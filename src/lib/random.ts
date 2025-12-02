// Seeded random number generator (mulberry32)
export function createRandom(seed: number): () => number {
  let t = seed + 0x6d2b79f5;
  return function () {
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface RandomUtils {
  random: () => number;
  range: (min: number, max: number) => number;
  int: (min: number, max: number) => number;
  pick: <T>(arr: T[]) => T;
  chance: (probability: number) => boolean;
  gaussian: () => number;
}

export function createRandomUtils(seed: number): RandomUtils {
  const random = createRandom(seed);

  return {
    random,
    range: (min: number, max: number) => min + random() * (max - min),
    int: (min: number, max: number) => Math.floor(min + random() * (max - min + 1)),
    pick: <T>(arr: T[]) => arr[Math.floor(random() * arr.length)],
    chance: (probability: number) => random() < probability,
    // Box-Muller transform for gaussian distribution
    gaussian: () => {
      const u1 = random();
      const u2 = random();
      return Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    },
  };
}
