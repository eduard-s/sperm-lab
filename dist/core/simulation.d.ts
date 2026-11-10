import type { ChallengeKind, Flow, Metrics, Point, Simulation, SimulationOptions, SpermCell } from "./types.js";
/** Create a new fictional cohort. Progress is not elapsed biological time. */
export declare function createSimulation(options?: SimulationOptions): Simulation;
/** Make an explicitly prepared sample for a discovery challenge. Cell zero is the target. */
export declare function createChallengeSimulation(kind: ChallengeKind, options?: Pick<SimulationOptions, "seed" | "count">): Simulation;
/** Advance physical motion only. Sperm biology remains fixed within a cohort. */
export declare function stepSimulation(world: Simulation, dt: number, flow?: Flow): void;
export declare function getMetrics(world: Simulation): Metrics;
/** Return schematic tail geometry in the same normalized plane as the cell. */
export declare function getTailPoints(cell: SpermCell, time: number): Point[];
/** Select a nearby cell with a small, input-friendly hit target. */
export declare function findCell(world: Simulation, x: number, y: number, radius?: number): SpermCell | undefined;
