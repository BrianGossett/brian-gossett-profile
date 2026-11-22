import type { Term } from './terms'

/**
 * Deadlock study cards: shop items, hero abilities, upgrade paths, counters and
 * game basics. The facts below (names, categories, costs, kits, upgrade paths)
 * come from the owner's "Deadlock Trainer", which took them from the game files
 * (SteamDatabase GameTracking-Deadlock, updated 22 Oct 2026). The game's own
 * description text is deliberately not included.
 */

export type ItemCategory = 'Weapon' | 'Vitality' | 'Spirit'

interface Item {
  name: string
  cat: ItemCategory
  /** Cost in souls: 800, 1600, 3200 or 6400 for tiers 1 to 4. */
  cost: number
  /** Items this one upgrades into. */
  into: string[]
  /** Items this one is built from. */
  from: string[]
}

interface Hero {
  name: string
  /** The four abilities, in slot order. The last is the ultimate. */
  kit: [string, string, string, string]
}

// prettier-ignore
export const ITEMS: Item[] = [
  { name: "Extra Charge", cat: "Spirit", cost: 800, into: ["Rapid Recharge"], from: [] },
  { name: "Extra Spirit", cat: "Spirit", cost: 800, into: ["Improved Spirit", "Surge of Power"], from: [] },
  { name: "Golden Goose Egg", cat: "Spirit", cost: 800, into: [], from: [] },
  { name: "Mystic Burst", cat: "Spirit", cost: 800, into: ["Tankbuster"], from: [] },
  { name: "Mystic Expansion", cat: "Spirit", cost: 800, into: ["Greater Expansion", "Ballistic Enchantment"], from: [] },
  { name: "Mystic Regeneration", cat: "Spirit", cost: 800, into: ["Radiant Regeneration"], from: [] },
  { name: "Rusted Barrel", cat: "Spirit", cost: 800, into: ["Disarming Hex"], from: [] },
  { name: "Spirit Strike", cat: "Spirit", cost: 800, into: ["Spirit Snatch"], from: [] },
  { name: "Arcane Surge", cat: "Spirit", cost: 1600, into: [], from: ["Extra Stamina"] },
  { name: "Bullet Resist Shredder", cat: "Spirit", cost: 1600, into: [], from: [] },
  { name: "Cold Front", cat: "Spirit", cost: 1600, into: ["Arctic Blast"], from: [] },
  { name: "Compress Cooldown", cat: "Spirit", cost: 1600, into: ["Superior Cooldown"], from: [] },
  { name: "Duration Extender", cat: "Spirit", cost: 1600, into: ["Superior Duration"], from: [] },
  { name: "Improved Spirit", cat: "Spirit", cost: 1600, into: ["Boundless Spirit"], from: ["Extra Spirit"] },
  { name: "Mystic Slow", cat: "Spirit", cost: 1600, into: ["Lightning Scroll"], from: [] },
  { name: "Mystic Vulnerability", cat: "Spirit", cost: 1600, into: ["Escalating Exposure"], from: [] },
  { name: "Quicksilver Reload", cat: "Spirit", cost: 1600, into: ["Mercurial Magnum"], from: [] },
  { name: "Slowing Hex", cat: "Spirit", cost: 1600, into: ["Vortex Web"], from: [] },
  { name: "Spirit Sap", cat: "Spirit", cost: 1600, into: ["Focus Lens"], from: [] },
  { name: "Suppressor", cat: "Spirit", cost: 1600, into: [], from: [] },
  { name: "Decay", cat: "Spirit", cost: 3200, into: [], from: [] },
  { name: "Disarming Hex", cat: "Spirit", cost: 3200, into: [], from: ["Rusted Barrel"] },
  { name: "Greater Expansion", cat: "Spirit", cost: 3200, into: [], from: ["Mystic Expansion"] },
  { name: "Knockdown", cat: "Spirit", cost: 3200, into: [], from: [] },
  { name: "Radiant Regeneration", cat: "Spirit", cost: 3200, into: [], from: ["Mystic Regeneration"] },
  { name: "Rapid Recharge", cat: "Spirit", cost: 3200, into: [], from: ["Extra Charge"] },
  { name: "Silence Wave", cat: "Spirit", cost: 3200, into: [], from: [] },
  { name: "Spirit Snatch", cat: "Spirit", cost: 3200, into: [], from: ["Spirit Strike"] },
  { name: "Superior Cooldown", cat: "Spirit", cost: 3200, into: ["Transcendent Cooldown"], from: ["Compress Cooldown"] },
  { name: "Superior Duration", cat: "Spirit", cost: 3200, into: [], from: ["Duration Extender"] },
  { name: "Surge of Power", cat: "Spirit", cost: 3200, into: [], from: ["Extra Spirit"] },
  { name: "Tankbuster", cat: "Spirit", cost: 3200, into: [], from: ["Mystic Burst"] },
  { name: "Torment Pulse", cat: "Spirit", cost: 3200, into: [], from: [] },
  { name: "Arctic Blast", cat: "Spirit", cost: 6400, into: [], from: ["Cold Front"] },
  { name: "Boundless Spirit", cat: "Spirit", cost: 6400, into: [], from: ["Improved Spirit"] },
  { name: "Cursed Relic", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Echo Shard", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Escalating Exposure", cat: "Spirit", cost: 6400, into: [], from: ["Mystic Vulnerability"] },
  { name: "Ethereal Shift", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Focus Lens", cat: "Spirit", cost: 6400, into: [], from: ["Spirit Sap"] },
  { name: "Lightning Scroll", cat: "Spirit", cost: 6400, into: [], from: ["Mystic Slow"] },
  { name: "Magic Carpet", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Mercurial Magnum", cat: "Spirit", cost: 6400, into: [], from: ["Quicksilver Reload"] },
  { name: "Mystic Reverb", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Refresher", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Scourge", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Spirit Burn", cat: "Spirit", cost: 6400, into: [], from: [] },
  { name: "Transcendent Cooldown", cat: "Spirit", cost: 6400, into: [], from: ["Superior Cooldown"] },
  { name: "Vortex Web", cat: "Spirit", cost: 6400, into: [], from: ["Slowing Hex"] },
  { name: "Extra Health", cat: "Vitality", cost: 800, into: ["Fortitude", "Colossus"], from: [] },
  { name: "Extra Regen", cat: "Vitality", cost: 800, into: ["Healing Booster"], from: [] },
  { name: "Extra Stamina", cat: "Vitality", cost: 800, into: ["Stamina Mastery", "Kinetic Dash", "Arcane Surge"], from: [] },
  { name: "Grit", cat: "Vitality", cost: 800, into: ["Weapon Shielding", "Spirit Shielding", "Guardian Ward", "Reactive Barrier"], from: [] },
  { name: "Healing Rite", cat: "Vitality", cost: 800, into: ["Rescue Beam", "Healing Nova"], from: [] },
  { name: "Melee Lifesteal", cat: "Vitality", cost: 800, into: ["Lifestrike"], from: [] },
  { name: "Rebuttal", cat: "Vitality", cost: 800, into: [], from: [] },
  { name: "Sprint Boots", cat: "Vitality", cost: 800, into: ["Trophy Collector", "Enduring Speed", "Shadow Weave"], from: [] },
  { name: "Battle Vest", cat: "Vitality", cost: 1600, into: [], from: [] },
  { name: "Bullet Lifesteal", cat: "Vitality", cost: 1600, into: ["Leech", "Fury Trance", "Vampiric Burst"], from: [] },
  { name: "Debuff Reducer", cat: "Vitality", cost: 1600, into: ["Unstoppable", "Spellbreaker"], from: [] },
  { name: "Enchanter's Emblem", cat: "Vitality", cost: 1600, into: [], from: [] },
  { name: "Enduring Speed", cat: "Vitality", cost: 1600, into: ["Juggernaut"], from: ["Sprint Boots"] },
  { name: "Guardian Ward", cat: "Vitality", cost: 1600, into: ["Divine Barrier"], from: ["Grit"] },
  { name: "Healbane", cat: "Vitality", cost: 1600, into: [], from: [] },
  { name: "Healing Booster", cat: "Vitality", cost: 1600, into: ["Healing Tempo"], from: ["Extra Regen"] },
  { name: "Reactive Barrier", cat: "Vitality", cost: 1600, into: ["Indomitable"], from: ["Grit"] },
  { name: "Restorative Locket", cat: "Vitality", cost: 1600, into: [], from: [] },
  { name: "Return Fire", cat: "Vitality", cost: 1600, into: [], from: [] },
  { name: "Spirit Lifesteal", cat: "Vitality", cost: 1600, into: ["Leech", "Spiritual Overflow", "Infuser"], from: [] },
  { name: "Spirit Shielding", cat: "Vitality", cost: 1600, into: [], from: ["Grit"] },
  { name: "Trophy Collector", cat: "Vitality", cost: 1600, into: [], from: ["Sprint Boots"] },
  { name: "Weapon Shielding", cat: "Vitality", cost: 1600, into: [], from: ["Grit"] },
  { name: "Bullet Resilience", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Counterspell", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Dispel Magic", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Fortitude", cat: "Vitality", cost: 3200, into: [], from: ["Extra Health"] },
  { name: "Fury Trance", cat: "Vitality", cost: 3200, into: [], from: ["Bullet Lifesteal"] },
  { name: "Healing Nova", cat: "Vitality", cost: 3200, into: [], from: ["Healing Rite"] },
  { name: "Lifestrike", cat: "Vitality", cost: 3200, into: [], from: ["Melee Lifesteal"] },
  { name: "Metal Skin", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Rescue Beam", cat: "Vitality", cost: 3200, into: [], from: ["Healing Rite"] },
  { name: "Spirit Resilience", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Stamina Mastery", cat: "Vitality", cost: 3200, into: [], from: ["Extra Stamina"] },
  { name: "Veil Walker", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Warp Stone", cat: "Vitality", cost: 3200, into: [], from: [] },
  { name: "Cheat Death", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Colossus", cat: "Vitality", cost: 6400, into: [], from: ["Extra Health"] },
  { name: "Divine Barrier", cat: "Vitality", cost: 6400, into: [], from: ["Guardian Ward"] },
  { name: "Diviner's Kevlar", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Healing Tempo", cat: "Vitality", cost: 6400, into: [], from: ["Healing Booster"] },
  { name: "Indomitable", cat: "Vitality", cost: 6400, into: [], from: ["Reactive Barrier"] },
  { name: "Infuser", cat: "Vitality", cost: 6400, into: [], from: ["Spirit Lifesteal"] },
  { name: "Inhibitor", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Juggernaut", cat: "Vitality", cost: 6400, into: [], from: ["Enduring Speed"] },
  { name: "Leech", cat: "Vitality", cost: 6400, into: [], from: ["Bullet Lifesteal", "Spirit Lifesteal"] },
  { name: "Phantom Strike", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Plated Armor", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Siphon Bullets", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Spellbreaker", cat: "Vitality", cost: 6400, into: [], from: ["Debuff Reducer"] },
  { name: "Unstoppable", cat: "Vitality", cost: 6400, into: [], from: ["Debuff Reducer"] },
  { name: "Vampiric Burst", cat: "Vitality", cost: 6400, into: [], from: ["Bullet Lifesteal"] },
  { name: "Witchmail", cat: "Vitality", cost: 6400, into: [], from: [] },
  { name: "Close Quarters", cat: "Weapon", cost: 800, into: ["Point Blank"], from: [] },
  { name: "Extended Magazine", cat: "Weapon", cost: 800, into: ["Escalating Resilience", "Titanic Magazine"], from: [] },
  { name: "Headshot Booster", cat: "Weapon", cost: 800, into: ["Headhunter"], from: [] },
  { name: "High-Velocity Rounds", cat: "Weapon", cost: 800, into: ["Opening Rounds", "Sharpshooter", "Armor Piercer", "Express Shot"], from: [] },
  { name: "Monster Rounds", cat: "Weapon", cost: 800, into: ["Cultist Sacrifice"], from: [] },
  { name: "Rapid Rounds", cat: "Weapon", cost: 800, into: ["Burst Fire", "Swift Striker"], from: [] },
  { name: "Restorative Shot", cat: "Weapon", cost: 800, into: [], from: [] },
  { name: "Active Reload", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Fleetfoot", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Intensifying Magazine", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Kinetic Dash", cat: "Weapon", cost: 1600, into: [], from: ["Extra Stamina"] },
  { name: "Long Range", cat: "Weapon", cost: 1600, into: ["Sharpshooter"], from: [] },
  { name: "Melee Charge", cat: "Weapon", cost: 1600, into: ["Crushing Fists"], from: [] },
  { name: "Mystic Shot", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Opening Rounds", cat: "Weapon", cost: 1600, into: [], from: ["High-Velocity Rounds"] },
  { name: "Recharging Rush", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Slowing Bullets", cat: "Weapon", cost: 1600, into: ["Weighted Shots"], from: [] },
  { name: "Spirit Shredder", cat: "Weapon", cost: 1600, into: ["Spirit Rend"], from: [] },
  { name: "Split Shot", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Stalker", cat: "Weapon", cost: 1600, into: [], from: [] },
  { name: "Swift Striker", cat: "Weapon", cost: 1600, into: [], from: ["Rapid Rounds"] },
  { name: "Titanic Magazine", cat: "Weapon", cost: 1600, into: [], from: ["Extended Magazine"] },
  { name: "Weakening Headshot", cat: "Weapon", cost: 1600, into: ["Crippling Headshot"], from: [] },
  { name: "Alchemical Fire", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Ballistic Enchantment", cat: "Weapon", cost: 3200, into: [], from: ["Mystic Expansion"] },
  { name: "Berserker", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Blood Tribute", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Burst Fire", cat: "Weapon", cost: 3200, into: [], from: ["Rapid Rounds"] },
  { name: "Cultist Sacrifice", cat: "Weapon", cost: 3200, into: [], from: ["Monster Rounds"] },
  { name: "Escalating Resilience", cat: "Weapon", cost: 3200, into: [], from: ["Extended Magazine"] },
  { name: "Express Shot", cat: "Weapon", cost: 3200, into: [], from: ["High-Velocity Rounds"] },
  { name: "Headhunter", cat: "Weapon", cost: 3200, into: [], from: ["Headshot Booster"] },
  { name: "Heroic Aura", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Hollow Point", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Hunter's Aura", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Point Blank", cat: "Weapon", cost: 3200, into: [], from: ["Close Quarters"] },
  { name: "Shadow Weave", cat: "Weapon", cost: 3200, into: [], from: ["Sprint Boots"] },
  { name: "Sharpshooter", cat: "Weapon", cost: 3200, into: [], from: ["Long Range", "High-Velocity Rounds"] },
  { name: "Spirit Rend", cat: "Weapon", cost: 3200, into: [], from: ["Spirit Shredder"] },
  { name: "Tesla Bullets", cat: "Weapon", cost: 3200, into: ["Capacitor"], from: [] },
  { name: "Toxic Bullets", cat: "Weapon", cost: 3200, into: [], from: [] },
  { name: "Weighted Shots", cat: "Weapon", cost: 3200, into: [], from: ["Slowing Bullets"] },
  { name: "Armor Piercer", cat: "Weapon", cost: 6400, into: [], from: ["High-Velocity Rounds"] },
  { name: "Capacitor", cat: "Weapon", cost: 6400, into: [], from: ["Tesla Bullets"] },
  { name: "Crippling Headshot", cat: "Weapon", cost: 6400, into: [], from: ["Weakening Headshot"] },
  { name: "Crushing Fists", cat: "Weapon", cost: 6400, into: [], from: ["Melee Charge"] },
  { name: "Frenzy", cat: "Weapon", cost: 6400, into: [], from: [] },
  { name: "Glass Cannon", cat: "Weapon", cost: 6400, into: [], from: [] },
  { name: "Lucky Shot", cat: "Weapon", cost: 6400, into: [], from: [] },
  { name: "Ricochet", cat: "Weapon", cost: 6400, into: [], from: [] },
  { name: "Silencer", cat: "Weapon", cost: 6400, into: [], from: [] },
  { name: "Spellslinger", cat: "Weapon", cost: 6400, into: [], from: [] },
  { name: "Spiritual Overflow", cat: "Weapon", cost: 6400, into: [], from: ["Spirit Lifesteal"] },
]

// prettier-ignore
export const HEROES: Hero[] = [
  { name: "Abrams", kit: ["Siphon Life", "Shoulder Charge", "Infernal Resilience", "Seismic Impact"] },
  { name: "Apollo", kit: ["Disengaging Sigil", "Riposte", "Flawless Advance", "Itani Lo Sahn"] },
  { name: "Bebop", kit: ["Exploding Uppercut", "Sticky Bomb", "Grapple Arm", "Hyper Beam"] },
  { name: "Billy", kit: ["Bashdown", "Rising Ram", "Blasted", "Chain Gang"] },
  { name: "Calico", kit: ["Gloom Bombs", "Leaping Slash", "Ava", "Return to Shadows"] },
  { name: "Celeste", kit: ["Light Eater", "Dazzling Trick", "Radiant Daggers", "Shining Wonder"] },
  { name: "Deadman Danny", kit: ["Strix Salvo", "Chimera Mk1", "Jettison Fuel", "Close The Deal"] },
  { name: "Drifter", kit: ["Rend", "Stalker's Mark", "Bloodscent", "Eternal Night"] },
  { name: "Dynamo", kit: ["Kinetic Pulse", "Quantum Entanglement", "Rejuvenating Aurora", "Singularity"] },
  { name: "Graves", kit: ["Jar of Dead", "Grasping Hands", "Essence Theft", "Borrowed Decree"] },
  { name: "Grey Talon", kit: ["Charged Shot", "Rain of Arrows", "Spirit Snare", "Guided Owl"] },
  { name: "Haze", kit: ["Sleep Dagger", "Smoke Bomb", "Fixation", "Bullet Dance"] },
  { name: "Holliday", kit: ["Powder Keg", "Bounce Pad", "Crackshot", "Spirit Lasso"] },
  { name: "Infernus", kit: ["Napalm", "Flame Dash", "Afterburn", "Concussive Combustion"] },
  { name: "Ivy", kit: ["Entangling Thorns", "Kudzu Connection", "Stone Form", "Air Drop"] },
  { name: "Kelvin", kit: ["Frost Grenade", "Ice Path", "Arctic Beam", "Frozen Shelter"] },
  { name: "Lady Geist", kit: ["Essence Bomb", "Life Drain", "Malice", "Soul Exchange"] },
  { name: "Lash", kit: ["Ground Strike", "Grapple", "Flog", "Death Slam"] },
  { name: "McGinnis", kit: ["Mini Turret", "Medicinal Specter", "Spectral Wall", "Heavy Barrage"] },
  { name: "Mina", kit: ["Rake", "Sanguine Retreat", "Love Bites", "Nox Nostra"] },
  { name: "Mirage", kit: ["Fire Scarabs", "Dust Devil", "Djinn's Mark", "Traveler"] },
  { name: "Mo & Krill", kit: ["Scorn", "Burrow", "Sand Blast", "Combo"] },
  { name: "Nurse Harrow", kit: ["Leech Therapy", "Wretched Vapors", "Healing Needles", "Lurking Terrors"] },
  { name: "Paige", kit: ["Bookwyrm", "Plot Armor", "Captivating Read", "Rallying Charge"] },
  { name: "Paradox", kit: ["Pulse Grenade", "Time Wall", "Kinetic Carbine", "Paradoxical Swap"] },
  { name: "Pocket", kit: ["Barrage", "Flying Cloak", "Enchanter's Satchel", "Affliction"] },
  { name: "Rat King", kit: ["Scrap Grenade", "Rat Swarm", "Royal Pestments", "Rule, Ratannia!"] },
  { name: "Rem", kit: ["Pillow Toss", "Tag Along", "Lil Helpers", "Naptime"] },
  { name: "Seven", kit: ["Lightning Ball", "Static Charge", "Power Surge", "Storm Cloud"] },
  { name: "Shiv", kit: ["Serrated Knives", "Slice and Dice", "Bloodletting", "Killing Blow"] },
  { name: "Silver", kit: ["Slam Fire", "Boot Kick", "Entangling Bola", "Lycan Curse"] },
  { name: "Sinclair", kit: ["Vexing Bolt", "Spectral Assistant", "Rabbit Hex", "Audience Participation"] },
  { name: "Solomon", kit: ["Setup Bishop", "Kingside Knight", "Rook Battery", "Develop Queen"] },
  { name: "The Doorman", kit: ["Call Bell", "Doorway", "Luggage Cart", "Hotel Guest"] },
  { name: "Venator", kit: ["Consecrating Grenade", "Gutshot", "Hex-Lined Snap Trap", "Ira Domini"] },
  { name: "Victor", kit: ["Pain Battery", "Jumpstart", "Aura of Suffering", "Shocking Reanimation"] },
  { name: "Vindicta", kit: ["Stake", "Flight", "Crow Familiar", "Assassinate"] },
  { name: "Viscous", kit: ["Splatter", "The Cube", "Puddle Punch", "Goo Ball"] },
  { name: "Vyper", kit: ["Screwjab Dagger", "Lethal Venom", "Slither", "Petrifying Bola"] },
  { name: "Warden", kit: ["Alchemical Flask", "Willpower", "Binding Word", "Last Stand"] },
  { name: "Wraith", kit: ["Card Trick", "Project Mind", "Full Auto", "Telekinesis"] },
  { name: "Yamato", kit: ["Power Slash", "Flying Slash", "Crimson Slash", "Shadow Transformation"] },
]

/** Which items answer which kind of threat. */
// prettier-ignore
export const COUNTERS: { threat: string; items: string[] }[] = [
  { threat: "Heavy healing or lifesteal", items: ["Healbane", "Toxic Bullets", "Decay", "Spirit Burn", "Inhibitor", "Crippling Headshot"] },
  { threat: "Stuns, silences, sleeps and roots", items: ["Debuff Reducer", "Reactive Barrier", "Dispel Magic", "Indomitable", "Unstoppable", "Divine Barrier", "Counterspell"] },
  { threat: "Heavy gun damage", items: ["Battle Vest", "Weapon Shielding", "Bullet Resilience", "Metal Skin", "Plated Armor", "Warp Stone", "Return Fire"] },
  { threat: "One gunner carrying the fight", items: ["Disarming Hex", "Phantom Strike", "Cursed Relic", "Rusted Barrel", "Suppressor", "Juggernaut", "Inhibitor", "Hunter's Aura"] },
  { threat: "Heavy spirit (ability) damage", items: ["Enchanter's Emblem", "Spirit Shielding", "Spirit Resilience", "Spellbreaker", "Witchmail", "Counterspell", "Ethereal Shift"] },
  { threat: "An ability-reliant hero", items: ["Silence Wave", "Silencer", "Focus Lens", "Cursed Relic", "Spirit Sap", "Knockdown"] },
  { threat: "A slippery hero who dashes away", items: ["Slowing Hex", "Knockdown", "Vortex Web", "Arctic Blast", "Capacitor", "Phantom Strike", "Mystic Slow", "Slowing Bullets", "Cold Front"] },
  { threat: "Constant slows on you", items: ["Enduring Speed", "Fleetfoot", "Juggernaut", "Magic Carpet"] },
  { threat: "A tanky hero with lots of HP or resist", items: ["Tankbuster", "Toxic Bullets", "Decay", "Armor Piercer", "Bullet Resist Shredder", "Weakening Headshot", "Crippling Headshot", "Mystic Vulnerability", "Escalating Exposure", "Spirit Shredder"] },
  { threat: "Melee brawlers in your face", items: ["Rebuttal", "Close Quarters", "Point Blank", "Torment Pulse", "Juggernaut"] },
  { threat: "Burst that kills you before you react", items: ["Ethereal Shift", "Cheat Death", "Metal Skin", "Divine Barrier", "Spellbreaker", "Counterspell"] },
  { threat: "Enemy buffing themselves or popping active items", items: ["Cursed Relic"] },
]

// prettier-ignore
export const FACTS: { q: string; a: string }[] = [
  { q: "What are the three item categories in the shop?", a: "Weapon, Vitality and Spirit" },
  { q: "What does a Tier 1 item cost?", a: "800 souls" },
  { q: "What does a Tier 2 item cost?", a: "1600 souls" },
  { q: "What does a Tier 3 item cost?", a: "3200 souls" },
  { q: "What does a Tier 4 item cost?", a: "6400 souls" },
  { q: "What is the shop called?", a: "The Curiosity Shop" },
  { q: "What currency do you spend in the shop?", a: "Souls" },
  { q: "Which ability slot is the ultimate?", a: "Ability 4" },
  { q: "What are the two teams?", a: "The Hidden King" },
  { q: "What is the first lane objective you push?", a: "The Guardian" },
  { q: "What objective comes after the Guardian in lane?", a: "The Walker" },
  { q: "What protects the enemy Patron before you can attack it?", a: "The Shrines" },
  { q: "What must you destroy to win the match?", a: "The enemy Patron" },
  { q: "How many phases does the Patron fight have?", a: "Two" },
  { q: "What do you earn by killing enemy Walkers?", a: "Extra item slots" },
  { q: "What does the Mid-Boss drop when killed?", a: "The Rejuvenator" },
  { q: "How do you claim the Rejuvenator?", a: "Heavy Melee it" },
  { q: "How do you pick up the Soul Urn?", a: "Melee it" },
  { q: "What lets you travel quickly along a lane back to your Guardian?", a: "The Zipline" },
  { q: "What action blocks an incoming melee attack?", a: "Parry" },
  { q: "Which vitality item heals you and returns damage after a successful parry?", a: "Rebuttal" },
  { q: "Which game mode has Legendary items?", a: "Street Brawl" },
  { q: "What stat makes your abilities hit harder?", a: "Spirit Power" },
  { q: "What stat reduces damage from guns?", a: "Bullet Resist" },
  { q: "What stat reduces damage from abilities?", a: "Spirit Resist" },
  { q: "What stat shortens debuffs like stuns and slows on you?", a: "Debuff Resist" },
  { q: "What do you spend to unlock and upgrade abilities?", a: "Ability Points" },
  { q: "What shop item can you hatch for souls and permanent buffs?", a: "Golden Goose Egg" },
]

/**
 * Card IDs are a block per category plus the position in that category's data,
 * so progress stays on the right card unless the data above is reordered.
 */
const block = (category: string, base: number, cards: { definition: string; term: string }[]): Term[] =>
  cards.map((card, index) => ({ id: base + index, category, ...card }))

const upgrades = ITEMS.flatMap(item => [
  ...(item.into.length > 0
    ? [{
        definition: item.into.length > 1 ? `Name every item ${item.name} upgrades into.` : `What does ${item.name} upgrade into?`,
        term: item.into.join(', '),
      }]
    : []),
  ...(item.from.length > 0
    ? [{
        definition: item.from.length > 1 ? `Name the items ${item.name} builds from.` : `What does ${item.name} build from?`,
        term: item.from.join(', '),
      }]
    : []),
])

export const DEADLOCK_TERMS: Term[] = [
  ...block('Item category', 1000, ITEMS.map(i => ({ definition: `Which shop category is ${i.name} in?`, term: i.cat }))),
  ...block('Item cost', 2000, ITEMS.map(i => ({ definition: `How many souls does ${i.name} cost?`, term: String(i.cost) }))),
  ...block('Whose ability', 3000, HEROES.flatMap(h => h.kit.map(ability => ({ definition: `Whose ability is ${ability}?`, term: h.name })))),
  ...block('Ultimates', 4000, HEROES.map(h => ({ definition: `What is ${h.name}'s ultimate?`, term: h.kit[3] }))),
  ...block('Full kits', 5000, HEROES.map(h => ({ definition: `Name all four of ${h.name}'s abilities.`, term: h.kit.join(', ') }))),
  ...block('Upgrades', 6000, upgrades),
  ...block('Counters', 7000, COUNTERS.map(c => ({ definition: `Which items counter this: ${c.threat.charAt(0).toLowerCase()}${c.threat.slice(1)}?`, term: c.items.join(', ') }))),
  ...block('Basics', 8000, FACTS.map(f => ({ definition: f.q, term: f.a }))),
]
