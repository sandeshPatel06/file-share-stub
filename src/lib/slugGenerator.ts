const ADJECTIVES = [
  "velvet", "crystal", "solar", "lunar", "amber", "cobalt", "scarlet",
  "silver", "golden", "azure", "crimson", "emerald", "violet", "neon",
  "arctic", "cosmic", "shadow", "frost", "thunder", "phantom", "stellar",
  "onyx", "jade", "coral", "ivory", "obsidian", "sapphire", "topaz",
];

const NOUNS = [
  "ocean", "river", "forest", "canyon", "summit", "valley", "nebula",
  "comet", "horizon", "current", "cipher", "signal", "prism", "vertex",
  "anchor", "beacon", "circuit", "delta", "echo", "flux", "glyph",
  "helix", "zenith", "orbit", "pulse", "quasar", "relay", "stream",
];

/** Generates a readable random slug like `velvet-ocean-42` */
export function generateSlug(): string {
  const adj  = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
  const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
  const num  = Math.floor(Math.random() * 90) + 10; // 10-99
  return `${adj}-${noun}-${num}`;
}
