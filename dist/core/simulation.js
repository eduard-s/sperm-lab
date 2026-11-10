import { FACTORS, getFactor } from "./factors.js";
// These authored coefficients create visible teaching examples. They are not research effect sizes.
const profiles = {
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
function finite(value, fallback) { return typeof value === "number" && Number.isFinite(value) ? value : fallback; }
function clamp(value, min = 0, max = 1) { return Math.min(max, Math.max(min, value)); }
/** A relative animation threshold, without clinical units. */
export const SLOW_SPEED_THRESHOLD = .035;
/** Resolve all twelve independent strengths. Unknown keys are errors; invalid numeric values become zero. */
export function resolveFactors(settings = {}) {
    if (!settings || typeof settings !== "object" || Array.isArray(settings))
        throw new TypeError("Factor settings must be an object.");
    for (const key of Object.keys(settings))
        getFactor(key);
    return Object.freeze(Object.fromEntries(FACTORS.map(factor => [factor.id, clamp(finite(settings[factor.id], 0))])));
}
export function getActiveFactors(world) {
    return FACTORS.filter(factor => world.factors[factor.id] > 0);
}
function composeChannels(factors, progress) {
    let production = 1, motility = .79, typical = .83, intactDna = .88, speed = 1, intactMidpiece = .92;
    // Independent visual pathways saturate separately. No channel is an aggregate fertility score.
    // Canonical factor order makes the result independent of object property order.
    for (const factor of FACTORS) {
        const effect = factors[factor.id] * progress;
        if (effect === 0)
            continue;
        const profile = profiles[factor.id];
        production *= 1 + (profile.production - 1) * effect;
        motility *= 1 + profile.motility / .79 * effect;
        typical *= 1 - profile.shape / .83 * effect;
        intactDna *= 1 - profile.dna / .88 * effect;
        speed *= 1 + (profile.speed - 1) * effect;
        // Only these cited oxidative examples affect the illustrated midpiece pathway.
        if (factor.id === "smoking" || factor.id === "heat")
            intactMidpiece *= 1 - .12 / .92 * effect;
    }
    return { production: clamp(production, .12, 1.08), motility: clamp(motility), shape: clamp(1 - typical), dna: clamp(1 - intactDna), speed: clamp(speed, .25, 1.08), midpiece: clamp(1 - intactMidpiece) };
}
function randomGenerator(seed) {
    let state = seed >>> 0;
    return () => {
        state = (state + 0x6D2B79F5) >>> 0;
        let mixed = Math.imul(state ^ state >>> 15, 1 | state);
        mixed ^= mixed + Math.imul(mixed ^ mixed >>> 7, 61 | mixed);
        return ((mixed ^ mixed >>> 14) >>> 0) / 4294967296;
    };
}
/** Create a new fictional cohort. Progress is not elapsed biological time. */
export function createSimulation(options = {}) {
    const seed = Math.trunc(finite(options.seed, 42)) >>> 0;
    const requestedCount = Math.round(clamp(finite(options.count, 48), 1, 160));
    const progress = clamp(finite(options.progress, 1));
    const independent = options.factors !== undefined;
    const intensity = independent ? 1 : clamp(finite(options.intensity, 1));
    if (!independent && options.factor !== undefined)
        getFactor(options.factor);
    const factors = resolveFactors(independent ? options.factors : options.factor ? { [options.factor]: intensity } : {});
    const channels = composeChannels(factors, progress);
    const count = Math.round(clamp(requestedCount * channels.production, 1, 160));
    const random = randomGenerator(seed);
    const cells = [];
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
        const headDraw = random(), tailDraw = random(), midpieceDraw = random();
        const alive = vitalityDraw < .95;
        const motile = alive && movementDraw < channels.motility;
        const headCount = headDraw < .035 ? 2 : 1;
        const tailCount = tailDraw < .045 ? 2 : 1;
        const headDefect = headCount === 2 || shapeDraw < channels.shape * .52;
        const tailDefect = tailCount === 2 || (shapeDraw >= channels.shape * .52 && shapeDraw < channels.shape);
        const midpieceDamage = midpieceDraw < channels.midpiece;
        const morphology = headDefect ? "head" : tailDefect ? "tail" : "typical";
        // Shape alone does not determine movement. The separate draw preserves that distinction.
        const speed = motile ? (.02 + speedDraw * .05) * channels.speed : 0;
        cells.push({ id, x, y, angle, phase, alive, speed, beat: motile ? 4 + beatDraw * 3 : 0,
            headCount, tailCount, headDefect, tailDefect, midpieceDamage, morphology, dnaDamage: dnaDraw < channels.dna,
            progressive: motile && progressDraw < (tailDefect ? .33 : .81), trail: [] });
    }
    return { cells, time: 0, seed, factors, factor: independent ? undefined : options.factor, progress, intensity, requestedCount, model: "fictional-teaching-sample", trailClock: 0 };
}
/** Make an explicitly prepared sample for a discovery challenge. Cell zero is the target. */
export function createChallengeSimulation(kind, options = {}) {
    if (!["hidden-dna", "immotile-alive", "circling"].includes(kind))
        throw new RangeError(`Unknown challenge: ${String(kind)}`);
    const world = createSimulation(options);
    const target = world.cells[0];
    world.fixture = kind;
    target.alive = true;
    target.headCount = target.tailCount = 1;
    target.headDefect = target.tailDefect = target.midpieceDamage = false;
    target.morphology = "typical";
    target.dnaDamage = kind === "hidden-dna";
    target.speed = kind === "immotile-alive" ? 0 : .052;
    target.beat = kind === "immotile-alive" ? 0 : 5.5;
    target.progressive = kind === "hidden-dna";
    // Other cells cannot satisfy the selected challenge. The prepared target is unambiguous.
    for (const cell of world.cells.slice(1)) {
        if (kind === "hidden-dna")
            cell.dnaDamage = false;
        if (kind === "immotile-alive" && cell.alive && cell.speed === 0) {
            cell.speed = .045;
            cell.beat = 5;
            cell.progressive = true;
        }
        if (kind === "circling" && cell.speed > 0)
            cell.progressive = true;
    }
    return world;
}
/** Make prepared anatomy examples without assigning them to a lifestyle exposure. */
export function createDefectSimulation(options = {}) {
    const world = createSimulation({ ...options, count: Math.max(8, finite(options.count, 48)) });
    world.fixture = "defect-examples";
    for (const cell of world.cells.slice(0, 9)) {
        cell.alive = true;
        cell.headCount = cell.tailCount = 1;
        cell.headDefect = cell.tailDefect = cell.midpieceDamage = cell.dnaDamage = false;
        cell.morphology = "typical";
        cell.speed = .052;
        cell.beat = 5.5;
        cell.progressive = true;
    }
    const [heads, tails, midpiece, dna, slow, still, circling, forward, nonviable] = world.cells;
    heads.headCount = 2;
    heads.headDefect = true;
    heads.morphology = "head";
    tails.tailCount = 2;
    tails.tailDefect = true;
    tails.morphology = "tail";
    midpiece.midpieceDamage = true;
    midpiece.speed = .023;
    dna.dnaDamage = true;
    slow.speed = .018;
    still.speed = still.beat = 0;
    still.progressive = false;
    circling.progressive = false;
    forward.speed = .066;
    if (nonviable) {
        nonviable.alive = false;
        nonviable.speed = nonviable.beat = 0;
        nonviable.progressive = false;
    }
    return world;
}
/** Advance physical motion only. Sperm biology remains fixed within a cohort. */
export function stepSimulation(world, dt, flow) {
    if (!Number.isFinite(dt) || dt <= 0)
        return;
    const step = Math.min(dt, .05);
    world.time += step;
    world.trailClock += step;
    const keepTrail = world.trailClock >= .06;
    if (keepTrail)
        world.trailClock %= .06;
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
        if (cell.x < .015 || cell.x > .985) {
            cell.x = clamp(cell.x, .015, .985);
            cell.angle = Math.PI - cell.angle;
            cell.trail.length = 0;
        }
        if (cell.y < .015 || cell.y > .985) {
            cell.y = clamp(cell.y, .015, .985);
            cell.angle = -cell.angle;
            cell.trail.length = 0;
        }
        cell.angle = ((cell.angle % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
        if (keepTrail) {
            cell.trail.push({ x: cell.x, y: cell.y });
            if (cell.trail.length > 28)
                cell.trail.shift();
        }
    }
}
export function getMetrics(world) {
    const metrics = { total: world.cells.length, motile: 0, progressive: 0, alive: 0, typical: 0, dnaDamaged: 0,
        multiHead: 0, multiTail: 0, midpieceDamaged: 0, headDefects: 0, tailDefects: 0, slow: 0, immotile: 0, nonprogressive: 0 };
    for (const cell of world.cells) {
        if (cell.alive)
            metrics.alive++;
        if (cell.alive && cell.speed > 0)
            metrics.motile++;
        if (cell.alive && cell.speed > 0 && cell.progressive)
            metrics.progressive++;
        if (cell.morphology === "typical")
            metrics.typical++;
        if (cell.dnaDamage)
            metrics.dnaDamaged++;
        if (cell.headCount > 1)
            metrics.multiHead++;
        if (cell.tailCount > 1)
            metrics.multiTail++;
        if (cell.midpieceDamage)
            metrics.midpieceDamaged++;
        if (cell.headDefect)
            metrics.headDefects++;
        if (cell.tailDefect)
            metrics.tailDefects++;
        if (isSlow(cell))
            metrics.slow++;
        if (!cell.alive || cell.speed === 0)
            metrics.immotile++;
        if (cell.alive && cell.speed > 0 && !cell.progressive)
            metrics.nonprogressive++;
    }
    return metrics;
}
export function isSlow(cell) {
    return cell.alive && cell.speed > 0 && cell.speed < SLOW_SPEED_THRESHOLD;
}
/** Return schematic tail geometry in the same normalized plane as the cell. */
export function getTailPoints(cell, time, tailIndex = 0) {
    const points = [];
    const t = finite(time, 0);
    const indexOffset = Math.round(clamp(finite(tailIndex, 0), 0, (cell.tailCount ?? 1) - 1));
    const separation = cell.tailCount === 2 ? indexOffset === 0 ? -.005 : .005 : 0;
    const cos = Math.cos(cell.angle), sin = Math.sin(cell.angle);
    for (let index = 0; index <= 20; index++) {
        const fraction = index / 20;
        const along = -.009 - .18 * fraction;
        // The short proximal section stays nearly straight. Bending grows smoothly along the flagellum.
        const flexible = clamp((fraction - .1) / .9);
        const envelope = flexible * flexible * (3 - 2 * flexible);
        const wave = cell.beat > 0 ? Math.sin(t * cell.beat * 2 * Math.PI - flexible * Math.PI * 3 + cell.phase + indexOffset * Math.PI) * .009 * envelope : .002 * envelope;
        const bend = cell.tailDefect ? .023 * Math.sin(flexible * Math.PI) * envelope : 0;
        const across = wave + bend + separation * (1 + fraction);
        points.push({ x: cell.x + along * cos - across * sin, y: cell.y + along * sin + across * cos });
    }
    return points;
}
/** Select a nearby cell with a small, input-friendly hit target. */
export function findCell(world, x, y, radius = .045) {
    if (![x, y, radius].every(Number.isFinite) || radius < 0)
        return undefined;
    let nearest;
    let nearestDistance = radius;
    for (const cell of world.cells) {
        const distance = Math.hypot(cell.x - x, cell.y - y);
        if (distance <= nearestDistance) {
            nearest = cell;
            nearestDistance = distance;
        }
    }
    return nearest;
}
