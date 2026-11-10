import { getFactor } from "./factors.js";
import type { ChallengeKind, FactorId, Flow, Metrics, Point, Simulation, SimulationOptions, SpermCell } from "./types.js";

type Profile = { production: number; motility: number; vitality: number; shape: number; dna: number; speed: number };

// These authored coefficients create visible teaching examples. They are not research effect sizes.
const profiles: Record<FactorId, Profile> = {
  exercise: { production: 1.08, motility: 0, vitality: 0, shape: 0, dna: 0, speed: 1 },
  endurance: { production: .87, motility: -.1, vitality: 0, shape: .045, dna: 0, speed: .9 },
  cycling: { production: .9, motility: -.075, vitality: 0, shape: .065, dna: 0, speed: .94 },
  smoking: { production: .86, motility: -.19, vitality: 0, shape: .13, dna: .25, speed: .76 },
  alcohol: { production: .74, motility: -.16, vitality: 0, shape: .11, dna: 0, speed: .84 },
  stress: { production: .92, motility: -.065, vitality: 0, shape: .025, dna: 0, speed: .95 },
  sleep: { production: .93, motility: -.065, vitality: 0, shape: .035, dna: 0, speed: .95 },
  heat: { production: .72, motility: -.24, vitality: 0, shape: .18, dna: .21, speed: .7 },
  fever: { production: .68, motility: -.22, vitality: 0, shape: .16, dna: 0, speed: .78 },
  metabolic: { production: .83, motility: -.12, vitality: 0, shape: .08, dna: .1, speed: .88 },
  androgens: { production: .2, motility: 0, vitality: 0, shape: 0, dna: 0, speed: 1 },
  pesticides: { production: .8, motility: -.17, vitality: 0, shape: .12, dna: .19, speed: .8 },
};

function finite(value: number | undefined, fallback: number) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function clamp(value: number, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }

function randomGenerator(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6D2B79F5) >>> 0;
    let mixed = Math.imul(state ^ state >>> 15, 1 | state);
    mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed);
    return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
  };
}

/** Create a new fictional cohort. Progress is not elapsed biological time. */
export function createSimulation(options: SimulationOptions = {}): Simulation {
  const seed = Math.trunc(finite(options.seed, 42)) >>> 0;
  const requestedCount = Math.round(clamp(finite(options.count, 48), 1, 160));
  const progress = clamp(finite(options.progress, 1));
  const intensity = clamp(finite(options.intensity, 1));
  if (options.factor) getFactor(options.factor);
  const profile = options.factor ? profiles[options.factor] : undefined;
  const effect = profile ? progress * intensity : 0;
  const count = Math.round(clamp(requestedCount * (1 + ((profile?.production ?? 1) - 1) * effect), 1, 160));
  const random = randomGenerator(seed);
  const cells: SpermCell[] = [];
  for (let id = 0; id < count; id++) {
    const x = .04 + random() * .92;
    const y = .04 + random() * .92;
    const angle = random() * Math.PI * 2;
    const phase = random() * Math.PI * 2;
    const vitalityDraw = random();
    const movementDraw = random();
    const shapeDraw = random();
    const dnaDraw = random();
    const progressDraw = random();
    const speedDraw = random();
    const beatDraw = random();
    const alive = vitalityDraw < .95 + (profile?.vitality ?? 0) * effect;
    const motile = alive && movementDraw < .79 + (profile?.motility ?? 0) * effect;
    const shapeRisk = .17 + (profile?.shape ?? 0) * effect;
    const morphology = shapeDraw < shapeRisk * .52 ? "head" : shapeDraw < shapeRisk ? "tail" : "typical";
    const speed = motile ? (.035 + speedDraw * .035) * (1 + ((profile?.speed ?? 1) - 1) * effect) : 0;
    cells.push({ id, x, y, angle, phase, alive, speed, beat: motile ? 4 + beatDraw * 3 : 0,
      morphology, dnaDamage: dnaDraw < .12 + (profile?.dna ?? 0) * effect,
      progressive: motile && progressDraw < (morphology === "tail" ? .33 : .81), trail: [] });
  }
  return { cells, time: 0, seed, factor: options.factor, progress, intensity, requestedCount, model: "fictional-teaching-sample", trailClock: 0 };
}

/** Make an explicitly prepared sample for a discovery challenge. Cell zero is the target. */
export function createChallengeSimulation(kind: ChallengeKind, options: Pick<SimulationOptions, "seed" | "count"> = {}): Simulation {
  if (!["hidden-dna", "immotile-alive", "circling"].includes(kind)) throw new RangeError(`Unknown challenge: ${String(kind)}`);
  const world = createSimulation(options);
  const target = world.cells[0];
  world.fixture = kind;
  target.alive = true;
  target.morphology = "typical";
  target.dnaDamage = kind === "hidden-dna";
  target.speed = kind === "immotile-alive" ? 0 : .052;
  target.beat = kind === "immotile-alive" ? 0 : 5.5;
  target.progressive = kind === "hidden-dna";
  // Other cells cannot satisfy the selected challenge. The prepared target is unambiguous.
  for (const cell of world.cells.slice(1)) {
    if (kind === "hidden-dna") cell.dnaDamage = false;
    if (kind === "immotile-alive" && cell.alive && cell.speed === 0) { cell.speed = .045; cell.beat = 5; cell.progressive = true; }
    if (kind === "circling" && cell.speed > 0) cell.progressive = true;
  }
  return world;
}

/** Advance physical motion only. Sperm biology remains fixed within a cohort. */
export function stepSimulation(world: Simulation, dt: number, flow?: Flow): void {
  if (!Number.isFinite(dt) || dt <= 0) return;
  const step = Math.min(dt, .05);
  world.time += step;
  world.trailClock += step;
  const keepTrail = world.trailClock >= .06;
  if (keepTrail) world.trailClock %= .06;
  const validFlow = flow && [flow.x, flow.y, flow.dx, flow.dy, flow.strength].every(Number.isFinite);
  for (const cell of world.cells) {
    if (cell.speed > 0) {
      cell.angle += (cell.progressive ? Math.sin(world.time * .8 + cell.phase) * .1 : 2.25) * step;
      cell.x += Math.cos(cell.angle) * cell.speed * step;
      cell.y += Math.sin(cell.angle) * cell.speed * step;
    }
    if (validFlow && flow) {
      const distance = Math.hypot(cell.x - clamp(flow.x), cell.y - clamp(flow.y));
      const weight = Math.max(0, 1 - distance / .28) ** 2 * clamp(flow.strength, 0, 3);
      cell.x += clamp(flow.dx, -.4, .4) * weight * step * 8;
      cell.y += clamp(flow.dy, -.4, .4) * weight * step * 8;
    }
    if (cell.x < .015 || cell.x > .985) { cell.x = clamp(cell.x, .015, .985); cell.angle = Math.PI - cell.angle; cell.trail.length = 0; }
    if (cell.y < .015 || cell.y > .985) { cell.y = clamp(cell.y, .015, .985); cell.angle = -cell.angle; cell.trail.length = 0; }
    cell.angle = ((cell.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
    if (keepTrail) {
      cell.trail.push({ x: cell.x, y: cell.y });
      if (cell.trail.length > 28) cell.trail.shift();
    }
  }
}

export function getMetrics(world: Simulation): Metrics {
  const metrics: Metrics = { total: world.cells.length, motile: 0, progressive: 0, alive: 0, typical: 0, dnaDamaged: 0 };
  for (const cell of world.cells) {
    if (cell.alive) metrics.alive++;
    if (cell.alive && cell.speed > 0) metrics.motile++;
    if (cell.alive && cell.speed > 0 && cell.progressive) metrics.progressive++;
    if (cell.morphology === "typical") metrics.typical++;
    if (cell.dnaDamage) metrics.dnaDamaged++;
  }
  return metrics;
}

/** Return schematic tail geometry in the same normalized plane as the cell. */
export function getTailPoints(cell: SpermCell, time: number): Point[] {
  const points: Point[] = [];
  const t = finite(time, 0);
  const cos = Math.cos(cell.angle), sin = Math.sin(cell.angle);
  for (let index = 0; index <= 20; index++) {
    const fraction = index / 20;
    const along = -.009 - .085 * fraction;
    const wave = cell.beat > 0 ? Math.sin(t * cell.beat * 2 * Math.PI - fraction * Math.PI * 3 + cell.phase) * .009 * fraction : .002 * fraction;
    const bend = cell.morphology === "tail" ? .023 * Math.sin(fraction * Math.PI) : 0;
    const across = wave + bend;
    points.push({ x: cell.x + along * cos - across * sin, y: cell.y + along * sin + across * cos });
  }
  return points;
}

/** Select a nearby cell with a small, input-friendly hit target. */
export function findCell(world: Simulation, x: number, y: number, radius = .045): SpermCell | undefined {
  if (![x, y, radius].every(Number.isFinite) || radius < 0) return undefined;
  let nearest: SpermCell | undefined;
  let nearestDistance = radius;
  for (const cell of world.cells) {
    const distance = Math.hypot(cell.x - x, cell.y - y);
    if (distance <= nearestDistance) { nearest = cell; nearestDistance = distance; }
  }
  return nearest;
}
