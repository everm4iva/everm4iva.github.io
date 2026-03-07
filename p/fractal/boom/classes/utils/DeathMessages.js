export default class DeathMessages {
  static getDeathMessage(game) {
    const messages = [];

    // Analyze death context
    const enemies = game.enemies.length;
    const playstyleData = game.getPlaystylePercentage();
    const playstyle = game.getPlaystyle();
    const level = game.level;
    const health = game.player.health;
    const enemyProjectiles = game.enemyProjectiles.length;
    const hasMage = game.mage !== null;
    const hasNova = game.nova !== null && game.nova.isActive;
    const score = game.score;

    // Boss-specific deaths
    if (hasNova) {
      messages.push(
        "Nova scrambled your existence into pixels",
        "Teleported straight into oblivion",
        "Reality.exe has stopped working",
        "You got vaporized by a laser... typical",
        "Nova said 'nah' and you ceased to exist",
        "Glitched out of life itself",
        "Color inverted your soul out of your body",
        "Nova is just... too chaotic for you",
        "Your brain couldn't handle the glitch",
        "Deleted by cosmic interference"
      );
    } else if (hasMage) {
      messages.push(
        "Mage yeeted you into another dimension",
        "Outplayed by purple magic... embarrassing",
        "The walls closed in on your hopes and dreams",
        "Mage said 'skill issue' and he was right",
        "You got teleport-baited like a noob",
        "Purple projectiles > your dodging skills",
        "Mage literally summoned your demise",
        "Pushed and pulled into the afterlife"
      );
    }

    // Overwhelmed by enemies
    if (enemies > 15) {
      messages.push(
        "Bro got absolutely SWARMED",
        "It's called fate",
        "They came in numbers you couldn't handle",
        "Overwelmed by what? geometry? u suck!",
        "Die, over and over.",
        "They formed a line just to delete you",
        "Enemies called a meeting... you were the topic",
        "Outnumbered, outgunned, out-skilled",
        "The enemy union voted you out",
        "Ganged up on like it's a 1v30",
        "They smelled fear and it smelled like you",
        "brain-cell issue",
        "is this being human? it sucks!",
        "respawned into a nightmare",
        "skill issue"
      );
    }

    // Bullet hell deaths
    if (enemyProjectiles > 10) {
      messages.push(
        "Skill issue",
        "bullets 2 the face",
        "bullets got you good",
        "pew pew pew... you dead",
        "smoking death",
        "dodging tutorial: FAILED",
        "Projectiles said 'this you?' and it was",
        "Turned into swiss cheese by bullets",
        "Bullet hell?",
        "Those red squares weren't friendly suggestions",
        "Your hitbox was simply too large (HAHA!)",
        "Imagine getting hit by slow-moving squares",
        "skill issue",
        "too bad, so sad"
      );
    }

    // Too aggressive playstyle deaths
    if (playstyle === "ATTACK" && playstyleData.attack > 70) {
      messages.push(
        "All offense, no defense = death",
        "Maybe try dodging next time?",
        "Rushing in didn't work out, huh?",
        "Aggression without caution",
        "You can't shoot if you're dead",
        "Your offensive was too offensive to survive",
        "You failed to react",
        "You saw it coming",
        "Hitbox exposed",
        "Positioning killed you",
        "You stood where death was",
        "Movement error",
        "You misread the pattern",
        "You hesitated",
        "You chose wrong",
        "This was avoidable"
      );
    }

    // Too defensive playstyle deaths
    if (playstyle === "DEFENCE" && playstyleData.defense > 70) {
      messages.push(
        "Can't win by hiding forever",
        "Defense is great but you gotta SHOOT",
        "Dodging without damage = slow death",
        "You survived long but accomplished nothing",
        "All dodge, no damage",
        "Turtling didn't save you this time",
        "You delayed the inevitable",
        "You survived without progress",
        "You ran out of space",
        "You hid until there was nowhere left",
        "You played scared",
        "You lost momentum",
        "You waited too long",
        "You stalled yourself to death",
        "You let it happen"
      );
    }

    // Early game deaths
    if (level < 3) {
      messages.push(
        "Died before the game even started lol",
        "Literally level 1... LEVEL 1.",
        "The tutorial boss would be proud",
        "You made it so far! (not really)",
        "Speed-running failure any%",
        "This game clearly isn't for you",
        "Couldn't even make it to level 3?",
        "My grandma lasted longer than you",
        "You weren’t ready",
        "This was expected",
        "You failed immediately",
        "You didn’t understand the game",
        "You lacked control",
        "You collapsed under pressure",
        "This ended before it began",
        "You made basic mistakes",
        "You were unprepared"
      );
    }

    // Mid-game deaths
    if (level >= 3 && level < 8) {
      messages.push(
        "You were doing okay... then you weren't",
        "Respectable run, shameful ending",
        "So close to the boss, yet so far",
        "The difficulty curve hit you like a truck",
        "Average run, below-average ending",
        "You peaked early unfortunately",
        "You almost mattered",
        "You broke at the end",
        "You lost focus",
        "You let it slip",
        "You failed when it counted",
        "This was your limit",
        "You couldn’t finish",
        "You reached the edge and fell",
        "You were close. Not enough"
      );
    }

    // Late game deaths
    if (level >= 8) {
      messages.push(
        "You almost had it... almost",
        "Got too confident and paid the price",
        "The legend ends here, tragically",
        "RIP to a semi-decent run",
        "You were so close to greatness",
        "At least you made it this far... barely",
        "Dead",
        "Failure",
        "Ended",
        "Run terminated",
        "Life depleted",
        "No recovery",
        "Fatal error",
        "System failure",
        "Eliminated",
        "Ceased"
      );
    }

    // High score deaths
    if (score > 1000) {
      messages.push(
        "All that score for nothing lmao",
        "Big numbers, big disappointment",
        "Score doesn't protect you from skill issues",
        "You grinded for THIS?",
        "Impressive score, unimpressive ending"
      );
    }

    // Generic hilarious deaths
    messages.push(
      "Skill issue",
      "Simply outplayed by AI",
      "just 67 at this point",
      "L + ratio + you died",
      "Just dodge lol",
      "Have you tried not dying?",
      "just don't be bad",
      "Imagine being this bad",
      "Certified bruh moment",
      "Death% speedrun achieved",
      "You tried your best (it wasn't enough)",
      "Better luck next time (you'll need it)",
      "The game was rigged from the start",
      "Eliminated. Terminated. Deleted.",
      "You were alive, now you're not",
      "Game said 'nah' to your existence",
      "Uninstalled from life",
      "left the server?",
      "cmon, the pixels were trying to help you",
      "You got rekt by basic mechanics",
      "The pixels just weren't on your side",
      "return to sender",
      "Not the chosen one apparently",
      "Your ancestors are disappointed",
      "F in the chat for this run",
      "Clowned by basic geometry",
      "Ratio'd by rectangles",
      "Rectangles: 1, You: 0",
      "WASD is your friend, not your enemy",
      "Mouse aim = questionable",
      "i just.. don't understand",
      "Critical existence failure",
      "You got sent to the shadow realm",
      "Respawn? More like REGRET-spawn",
      "packed by squares HAHA!",
      "That was... underwhelming",
      "Died of cringe",
      "more death soon?",
      "now i get it. 100x",
      "when are you going to be serious?",
      "bad at geometry",
      "shame SHAME SHAME SHAMEEEE!!!!111!!",
      "beuh",
      "Natural selection at work"
    );

    // Return random message
    return messages[Math.floor(Math.random() * messages.length)];
  }

  static getDeathCause(game) {
    const enemies = game.enemies.length;
    const enemyProjectiles = game.enemyProjectiles.length;
    const hasMage = game.mage !== null;
    const hasNova = game.nova !== null && game.nova.isActive;

    // Determine cause
    if (hasNova) {
      const novaCauses = [
        "Lasered by Nova",
        "Glitch damage",
        "Teleported into danger",
        "Reality malfunction",
        "Nova collision",
        "Cosmic chaos",
        "Inverted colors",
        "Pushed by nova",
        "Pulled by nova",
        "grabbed and dropped something?",
        "You were erased",
        "Reality rejected you",
        "You do not exist anymore",
        "Space folded. You didn’t",
        "Removed from the timeline",
        "Your atoms gave up",
        "Existence rolled back",
        "Unmade",
        "The universe corrected itself",
        "You were never meant to be here",
      ];
      return novaCauses[Math.floor(Math.random() * novaCauses.length)];
    }

    if (hasMage) {
      const mageCauses = [
        "Mage projectile",
        "Wall collision",
        "Force push/pull",
        "Mage contact",
        "Purple magic",
        "Walled bruh",
        "Teleported into harm",
        "Mage manipulation",
        "Spatial distortion",
        "Mage spell",
        "It meant to kill you",
        "Outplayed. Intentionally",
        "You were manipulated",
        "Every move was predicted",
        "Trapped. Then finished",
        "You walked exactly where it wanted",
        "This was planned",
        "You were a mistake it fixed",
        "Control lost. Life followed",
        "You obeyed the spell",
      ];
      return mageCauses[Math.floor(Math.random() * mageCauses.length)];
    }

    if (enemyProjectiles > 8) {
      return "Projectile spam";
    }

    if (enemies > 12) {
      return "Enemy swarm";
    }

    const genericCauses = [
      "Enemy contact",
      "Red square impact",
      "Poor positioning",
      "Bad.",
      "Lack of skill",
      "Getting overwhelmed",
      "Overconfidence",
      "Lacked attention",
      "Misjudged distance",
      "Failed dodge",
      "Wrong playstyle",
      "Underestimated threat",
      "Not Enough Knoledge",
      "Geometry interaction",
      "Unlucky",
      "Fatal mistake",
      "You were overwhelmed",
      "There was no escape",
      "You lost control",
      "Too many. Too late",
      "You couldn’t keep up",
      "You fell behind and stayed there",
      "This ended the moment they surrounded you",
      "You were consumed",
      "You stopped mattering",
      "Buried in movement",
    ];

    return genericCauses[Math.floor(Math.random() * genericCauses.length)];
  }
}
