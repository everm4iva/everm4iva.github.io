// GameConfig.js - Centralized configuration for all game constants
// Edit these values to tweak gameplay without hunting through code!

export const CONFIG = {
  // ===================
  // PLAYER SETTINGS
  // ===================
  PLAYER: {
    WIDTH: 40,
    HEIGHT: 40,
    SPEED: 5,
    MAX_HEALTH: 100, // default: 100
    COLOR: "#00ff00",
    MAX_STACK_SIZE: 8, // Max items per inventory slot
    INVENTORY_SLOTS: 3,
    DASH: {
      SPEED: 25, // How fast the dash moves
      DURATION: 8, // Frames the dash lasts
      COOLDOWN: 45,
      INVINCIBILITY_DURATION: 12, // Brief i-frames during dash
      TRAIL_LENGTH: 5, // Number of trail positions to store
    },
  },

  // ===================
  // ENEMY SETTINGS
  // ===================
  ENEMY: {
    DEFAULT_SIZE: 30,
    FLOCKING: {
      ENABLED: true,
      SEPARATION_RADIUS: 50, // px, avoid crowding
      ALIGN_RADIUS: 80, // px, align with neighbors
      COHESION_RADIUS: 120, // px, move toward group
      SEPARATION_FORCE: 2.0,
      ALIGN_FORCE: 0.7,
      COHESION_FORCE: 0.5,
      WALL_AVOID_FORCE: 2.5,
      WALL_AVOID_RADIUS: 60,
      RANDOMNESS: 0.2,
      PLAYER_ATTRACT_FORCE: 1.0, // How much to seek player
    },
    TYPES: {
      DUMB: {
        SPEED: 2,
        HEALTH: 30,
        DAMAGE: 10,
      },
      MEDIUM: {
        SPEED: 2.2,
        HEALTH: 35,
        DAMAGE: 10,
        SHOOT_INTERVAL: 180,
      },
      SMART: {
        SPEED: 2.5,
        HEALTH: 40,
        DAMAGE: 10,
        SHOOT_INTERVAL: 120,
        DODGE_RANGE: 80,
        KEEP_DISTANCE: 150,
      },
      TELEPORT: {
        SPEED: 1.5,
        HEALTH: 25,
        DAMAGE: 10,
        TELEPORT_INTERVAL: 180,
        TELEPORT_COOLDOWN: 60,
      },
    },
  },

  // ===================
  // BOSS SETTINGS
  // ===================
  BOSSES: {
    MAGE: {
      WIDTH: 50,
      HEIGHT: 50,
      SPEED: 1.5,
      HEALTH: 600,
      MAX_HEALTH: 400,
      DAMAGE: 12,
      COLOR: "#8800ff",
      SHOOT_INTERVAL: 120,
      TELEPORT_INTERVAL: 240,
      WALL_SUMMON_INTERVAL: 300,
      PUSH_PULL_INTERVAL: 200,
      BEHAVIOR_INTERVAL: 180,
      SPAWN_LEVEL: 8,
      RESPAWN_INTERVAL: 6, // Every 6 levels after first
    },
    NOVA: {
      WIDTH: 50,
      HEIGHT: 50,
      SPEED: 2,
      HEALTH: 800,
      MAX_HEALTH: 800,
      DAMAGE: 20,
      COLOR: "#ff00ff",
      LASER_INTERVAL: 180,
      TELEPORT_INTERVAL: 200,
      PLAYER_TELEPORT_INTERVAL: 360,
      SUMMON_INTERVAL: 300,
      DISAPPEAR_INTERVAL: 1800,
      BEHAVIOR_INTERVAL: 120,
      SPAWN_LEVEL: 10, // Nova appears first at level 10
      RESPAWN_INTERVAL: 10, // Every 10 levels after being killed
      REAPPEAR_LEVELS: 2, // Reappear after 2 levels if disappeared
      NOVA_LASER: {
        DAMAGE: 40,
        THICKNESS: 80,
        WARNING_DURATION: 40,
        ACTIVE_DURATION: 25,
        LENGTH: 3000,
      },
    },
  },

  // ===================
  // PROJECTILE SETTINGS
  // ===================
  PROJECTILES: {
    PLAYER: {
      WIDTH: 5,
      HEIGHT: 5,
      SPEED: 7,
      DAMAGE: 20,
      COLOR: "#ffff00",
    },
    ENEMY: {
      WIDTH: 8, // Enemy projectile width
      HEIGHT: 8, // Enemy projectile height
      SPEED: 4, // Enemy projectile speed
      DAMAGE: 15, // Enemy projectile damage
      COLOR: "#ff3300", // Enemy projectile color
    },
    NOVA_LASER: {
      DAMAGE: 25,
      WIDTH: 15,
      DURATION: 60,
    },
  },

  // ===================
  // ENTITY SETTINGS
  // ===================
  ENTITY: {
    WALL: {
      WIDTH: 40,
      HEIGHT: 60,
      EMERGING_DURATION: 60, // 1 second to emerge
      SHAKE_INTENSITY: 5,
      HEALTH: 100,
      MAX_HEALTH: 100,
      EXPLODING_DURATION: 60,
    },
  },

  // ===================
  // PARTICLE SETTINGS
  // ===================
  PARTICLES: {
    MAX_PARTICLES: 120,
    SPAWN_PER_FRAME: 5,
    DEFAULT: {
      MIN_SIZE: 2,
      MAX_SIZE: 6,
      MIN_SPEED: 4,
      MAX_SPEED: 8,
      MIN_DECAY: 0.01,
      MAX_DECAY: 0.03,
      GRAVITY: 0.2,
      FRICTION: 0.98,
    },
    EXPLOSION: {
      MIN_SIZE: 3,
      MAX_SIZE: 9,
      MIN_SPEED: 6,
      MAX_SPEED: 12,
      MIN_DECAY: 0.02,
      MAX_DECAY: 0.05,
      COLORS: ["#ff3300", "#ff6600", "#ff9900", "#ffcc00", "#ffffff"],
    },
    TRAIL: {
      MIN_SIZE: 1,
      MAX_SIZE: 3,
      SPEED: 0.5,
      DECAY: 0.05,
    },
  },

  // ===================
  // SPAWNING SETTINGS
  // ===================
  SPAWNING: {
    ENEMY_INTERVAL: 120,
    ENEMY_MIN_INTERVAL: 40,
    ENEMY_INTERVAL_DECREASE: 1,
    POWERUP_INTERVAL: 600,
    BOMB_INTERVAL: 300,
    BOMB_SPAWN_CHANCE: 0.2,
    BOMB_START_LEVEL: 3,
  },

  // ===================
  // LEVEL PROGRESSION
  // ===================
  PROGRESSION: {
    STARTING_ENEMIES_PER_LEVEL: 16,
    ENEMIES_INCREMENT: 5,
  },

  // ===================
  // POWERUP SETTINGS
  // ===================
  POWERUPS: {
    HEALTH_RESTORE: 30,
    PICKUP_EXPLOSION_RADIUS: 200, // Radius for enemy explosion on powerup pickup
    MULTISHOT: {
      DURATION: 300,
      SPREAD_ANGLE: 0.3,
      MIN_BULLETS: 3, // Minimum bullets when multishot active
      MAX_BULLETS: 7, // Maximum bullets when multishot active
    },
    TIME_WARP: {
      WIDTH: 24,
      HEIGHT: 24,
      COLOR: "#00ffff",
      DURATION: 480,
      SLOW_FACTOR: 0.3, // Everything else moves at 30% speed
      LIFETIME: 600, // 10 seconds before despawning
      SPAWN_CHANCE: 0.3, // 30% chance from bomb explosion
      MIN_LEVEL: 8, // Only spawn after level 8
      SPAWN_AFTER_BOSS: true, // Can also spawn after boss fights
    },
    PUSH_PULL: {
      WIDTH: 22,
      HEIGHT: 22,
      COLOR: "#ffffff",
      DURATION: 600,
      LIFETIME: 900, // 15 seconds before despawning (0 = infinite)
      PUSH_FORCE: 8, // How hard enemies are pushed
      PULL_SPEED: 12, // How fast XP orbs are pulled
      SPAWN_CHANCE: 0.15, // 15% chance to spawn
      MIN_LEVEL: 5, // Only spawn after level 5
    },
  },

  // ===================
  // COMBAT SETTINGS
  // ===================
  COMBAT: {
    AUTO_SHOOT_COOLDOWN: 8,
    BOMB_EXPLOSION_DAMAGE: 50,
    PLACED_BOMB_DAMAGE: 70,
    BOMB_PLAYER_DAMAGE: 30,
    PLACED_BOMB_PLAYER_DAMAGE: 20,
    STAR_DAMAGE: 150,
  },

  // ===================
  // XP & SCORING
  // ===================
  SCORING: {
    ENEMY_KILL_BASE: 100,
    XP_ORB: {
      DUMB: { COUNT: 2, VALUE: 5 },
      MEDIUM: { COUNT: 3, VALUE: 5 },
      SMART: { COUNT: 5, VALUE: 10 },
      TELEPORT: { COUNT: 6, VALUE: 10 },
    },
    STAR_ORB_COST: 80,
    MAGE_DEFEAT: 500,
    NOVA_DEFEAT: 750,
  },

  // ===================
  // COMBO SYSTEM
  // ===================
  COMBO: {
    DECAY_TIME: 120,
    MIN_FOR_DISPLAY: 2, // Show combo at 2x or higher
    POPUP_DURATION: 90, // How long popup stays (1.5 seconds)
    POPUP_RISE_SPEED: 0.5, // How fast it floats up
    SCORE_MULTIPLIER: true, // Apply multiplier to score
  },

  // ===================
  // VHS EFFECTS
  // ===================
  VHS: {
    BOOT_DURATION: 280,
    STATIC_COUNT: 1000,
    GLITCH_MAX_INTENSITY: 10,
    GLITCH_MAX_RADIUS: 200,
    GLITCH_DECAY: 0.8,
  },

  // ===================
  // ANIMATION TIMINGS
  // ===================
  ANIMATION: {
    LEVEL_TRANSITION_DURATION: 80,
    LEVEL_TRANSITION_EXPAND: 30,
    LEVEL_TRANSITION_HOLD: 60,
    LEVEL_TRANSITION_SHRINK: 30,
    DEATH_ANIMATION_DURATION: 120,
  },

  // ===================
  // SCREEN SHAKE
  // ===================
  SCREEN_SHAKE: {
    ENEMY_KILL: { INTENSITY: 20, DURATION: 25 },
    BOSS_HIT: { INTENSITY: 15, DURATION: 20 },
    BOSS_DEFEAT: { INTENSITY: 40, DURATION: 50 },
    BOMB_EXPLOSION: { INTENSITY: 25, DURATION: 30 },
    SHOCKWAVE: { INTENSITY: 50, DURATION: 60 },
    DEATH: { INTENSITY: 30, DURATION: 40 },
  },

  // ===================
  // LIGHTING
  // ===================
  LIGHTING: {
    PLAYER_LIGHT_RADIUS: 150,
    PLAYER_LIGHT_COLOR: "rgba(0, 255, 0, 0.3)",
    ENEMY_LIGHT_RADIUS: 80,
    ENEMY_LIGHT_COLOR: "rgba(255, 0, 0, 0.2)",
    EXPLOSION_LIGHT_RADIUS: 200,
    EXPLOSION_LIGHT_COLOR: "rgba(255, 100, 0, 0.8)",
    EXPLOSION_LIGHT_DURATION: 300,
  },

  // ===================
  // OBJECT POOL SIZES
  // ===================
  POOLS: {
    PARTICLES: 200,
    PROJECTILES: 100,
    ENEMY_PROJECTILES: 50,
    XP_ORBS: 100,
  },
};

// Helper to get enemy config by type
export function getEnemyConfig(type) {
  const typeUpper = type.toUpperCase();
  return CONFIG.ENEMY.TYPES[typeUpper] || CONFIG.ENEMY.TYPES.DUMB;
}

// Helper to get XP orb config by enemy type
export function getXPOrbConfig(type) {
  const typeUpper = type.toUpperCase();
  const config = CONFIG.SCORING.XP_ORB[typeUpper] || CONFIG.SCORING.XP_ORB.DUMB;
  // Return with lowercase keys for compatibility
  return { count: config.COUNT, value: config.VALUE };
}

export default CONFIG;
