/** Entropy is used only when starting a new run or explicitly retrying a chapter.
 * Simulation and bookmark resume remain seeded and reproducible. */
let lastEntropySeed = null;
let entropyCounter = 0;
export function freshRunSeed(cryptoSource = globalThis.crypto) {
 let value;
 try {
  const bytes = new Uint32Array(1);
  cryptoSource.getRandomValues(bytes);
  value = bytes[0] >>> 0;
 } catch {
  value = (Date.now() ^ Math.floor(Math.random() * 0x100000000) ^ Math.imul(++entropyCounter, 0x9e3779b9)) >>> 0;
 }
 // Also handles same-tick fallback starts or an entropy source returning a repeat.
 if (value === lastEntropySeed) value = (value + 0x9e3779b9) >>> 0;
 lastEntropySeed = value;
 return value;
}
