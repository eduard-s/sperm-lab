export { FACTORS, ANATOMY_SOURCES, getFactor } from "./factors.js";
export { DEFECT_CATALOG, MORPHOLOGY_SOURCES, cellMatchesDefect, getDefectCounts, getCellDefects } from "./defects.js";
export { createSimulation, createChallengeSimulation, createDefectSimulation, resolveFactors, getActiveFactors, isSlow, SLOW_SPEED_THRESHOLD, stepSimulation, getMetrics, getTailPoints, findCell } from "./simulation.js";
export type { Factor, FactorId, FactorSettings, ResolvedFactors, Evidence, Source, Point, SpermCell, Simulation, SimulationOptions, Metrics, Flow, ChallengeKind, FixtureKind, Defect, DefectId, HeadShape, TailShape, MidpieceShape } from "./types.js";
