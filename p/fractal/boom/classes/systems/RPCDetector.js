// Discord RPC State Detector
// Detects game state and sends updates to Discord Rich Presence

export default class RPCDetector {
  constructor(game) {
    this.game = game;
    this.lastState = null;
    this.updateInterval = null;
    this.connected = false;
    this.gameStarted = false; // Track if player has started playing

    // Check if running in Electron with RPC support
    this.hasRPC = typeof window !== "undefined" && window.discordRPC;

    if (this.hasRPC) {
      console.log("[RPC] Discord Rich Presence available");
      this.startUpdating();

      // Listen for connection status
      window.discordRPC.onConnected?.((connected) => {
        this.connected = connected;
        console.log("[RPC] Connection status:", connected);
      });
    } else {
      console.log("[RPC] Running without Discord Rich Presence");
    }
  }

  startUpdating() {
    // Update every 200ms for responsive state changes
    this.updateInterval = setInterval(() => {
      this.detectAndUpdate();
    }, 200);

    // Initial update
    this.detectAndUpdate();
  }

  stopUpdating() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  detectState() {
    const game = this.game;

    // Detect current boss (needed for death state too)
    const currentBoss = this.detectBoss();

    // Death state
    if (game.gameOver) {
      return {
        level: game.level,
        activity: "dead",
        boss: currentBoss, // Track boss even when dead
        enemyCount: 0,
        paused: false,
        dead: true,
        deathMessage: game.deathMessage || "Game Over",
      };
    }

    // Paused state
    if (game.paused) {
      return {
        level: game.level,
        activity: "paused",
        boss: this.detectBoss(),
        enemyCount: game.enemies?.length || 0,
        paused: true,
        dead: false,
        deathMessage: null,
      };
    }

    // Boss fight
    const boss = this.detectBoss();
    if (boss) {
      return {
        level: game.level,
        activity: "boss",
        boss: boss,
        enemyCount: game.enemies?.length || 0,
        paused: false,
        dead: false,
        deathMessage: null,
      };
    }

    // Regular gameplay - detect activity
    const activity = this.detectActivity();
    return {
      level: game.level,
      activity: activity,
      boss: null,
      enemyCount: game.enemies?.length || 0,
      paused: false,
      dead: false,
      deathMessage: null,
    };
  }

  detectBoss() {
    const game = this.game;

    // Check for active Mage boss
    if (game.mage && game.mage.health > 0) {
      return "mage";
    }

    // Check for active Nova boss
    if (game.nova && game.nova.isActive && game.nova.health > 0) {
      return "nova";
    }

    return null;
  }

  detectActivity() {
    const game = this.game;
    const enemyCount = game.enemies?.length || 0;

    // Check if player is moving
    const isMoving =
      game.input &&
      (game.input.keys.has("w") ||
        game.input.keys.has("W") ||
        game.input.keys.has("a") ||
        game.input.keys.has("A") ||
        game.input.keys.has("s") ||
        game.input.keys.has("S") ||
        game.input.keys.has("d") ||
        game.input.keys.has("D") ||
        game.input.keys.has("ArrowUp") ||
        game.input.keys.has("ArrowDown") ||
        game.input.keys.has("ArrowLeft") ||
        game.input.keys.has("ArrowRight"));

    // Check if shooting
    const isShooting = game.input && game.input.mouseDown;

    // Track when player first moves or shoots
    if (!this.gameStarted && (isMoving || isShooting)) {
      this.gameStarted = true;
    }

    // If game hasn't started yet, show starting state
    if (!this.gameStarted) {
      return "starting";
    }

    // Determine activity
    if (enemyCount === 0 && !isMoving && !isShooting) {
      return "idle";
    }

    if (enemyCount > 0) {
      return "fighting";
    }

    return "idle";
  }

  detectAndUpdate() {
    if (!this.hasRPC) return;

    const currentState = this.detectState();

    // Only update if state changed
    if (!this.statesEqual(currentState, this.lastState)) {
      this.lastState = currentState;
      window.discordRPC.updateState(currentState);
    }
  }

  statesEqual(a, b) {
    if (!a || !b) return false;
    return (
      a.level === b.level &&
      a.activity === b.activity &&
      a.boss === b.boss &&
      a.enemyCount === b.enemyCount &&
      a.paused === b.paused &&
      a.dead === b.dead &&
      a.deathMessage === b.deathMessage
    );
  }

  // Call when game resets
  onNewGame() {
    this.gameStarted = false; // Reset so it shows "starting" again
    this.lastState = null; // Force state update
    if (this.hasRPC) {
      // Reset timestamp and all state
      window.discordRPC.updateState({
        newGame: true,
        level: 1,
        activity: "starting",
        boss: null,
        enemyCount: 0,
        paused: false,
        dead: false,
        deathMessage: null,
      });
      // Force an immediate presence update
      setTimeout(() => {
        if (this.hasRPC) {
          window.discordRPC.updateState({
            level: 1,
            activity: "playing",
            boss: null,
            enemyCount: 0,
            paused: false,
            dead: false,
            deathMessage: null,
          });
        }
      }, 100);
    }
  }

  // Call when player dies
  onDeath(deathMessage) {
    if (this.hasRPC) {
      window.discordRPC.updateState({
        level: this.game.level,
        activity: "dead",
        boss: null,
        enemyCount: 0,
        paused: false,
        dead: true,
        deathMessage: deathMessage,
      });
    }
  }

  destroy() {
    this.stopUpdating();
  }
}
