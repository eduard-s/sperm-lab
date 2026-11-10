export type FactorId = "exercise" | "endurance" | "cycling" | "smoking" | "alcohol" | "stress" | "sleep" | "heat" | "fever" | "metabolic" | "androgens" | "pesticides";
export type FactorSettings = Partial<Record<FactorId, number>>;
export type ResolvedFactors = Readonly<Record<FactorId, number>>;
export type HeadShape = "typical" | "small" | "large" | "tapered" | "round" | "irregular";
export type TailShape = "typical" | "bent" | "coiled" | "short" | "absent" | "irregular";
export type MidpieceShape = "typical" | "bent" | "thick";
export type DefectId = "double-head" | "small-head" | "large-head" | "tapered-head" | "round-head" | "double-tail" | "triple-tail" | "bent-tail" | "coiled-tail" | "short-tail" | "absent-tail" | "bent-midpiece" | "thick-midpiece" | "midpiece-damage" | "dna-fragmentation" | "slow" | "immotile" | "nonprogressive";
export type Evidence = "Human association" | "Mixed evidence" | "Established mechanism";
export interface Source {
    title: string;
    url: string;
}
export interface Factor {
    id: FactorId;
    title: string;
    summary: string;
    mechanism: string;
    timescale: string;
    evidence: Evidence;
    limits: string;
    sources: readonly Source[];
}
export interface Defect {
    id: DefectId;
    title: string;
    description: string;
    region: "head" | "tail" | "midpiece" | "dna" | "movement";
    sources: readonly Source[];
}
export interface Point {
    x: number;
    y: number;
}
export interface SpermCell extends Point {
    id: number;
    angle: number;
    phase: number;
    /** Model distance per second. Zero means no active movement. */
    speed: number;
    beat: number;
    alive: boolean;
    /** Developmental variants. Lifestyle settings do not change these counts. */
    headCount: 1 | 2;
    tailCount: 0 | 1 | 2 | 3;
    headShape: HeadShape;
    tailShape: TailShape;
    midpieceShape: MidpieceShape;
    headDefect: boolean;
    tailDefect: boolean;
    /** Illustrated cellular injury. This flag does not require a visibly abnormal contour. */
    midpieceDamage: boolean;
    /** Compatibility summary. Independent traits carry the detailed anatomy. */
    morphology: "typical" | "head" | "tail";
    dnaDamage: boolean;
    /** Number of drawn strand pieces. This is not a measured DNA fragmentation index. */
    dnaFragmentation: 0 | 3 | 4 | 5 | 6;
    /** Identifies a pinned teaching example, without a lifestyle cause. */
    example?: DefectId;
    progressive: boolean;
    trail: Point[];
}
export type ChallengeKind = "hidden-dna" | "immotile-alive" | "circling";
export type FixtureKind = ChallengeKind | "defect-examples";
export interface Simulation {
    cells: SpermCell[];
    time: number;
    seed: number;
    factors: ResolvedFactors;
    /** Includes an authored catalog of common forms, without prevalence estimates. */
    teachingPopulation: boolean;
    /** Legacy single-factor selection. Undefined for the independent factors API. */
    factor?: FactorId;
    progress: number;
    intensity: number;
    requestedCount: number;
    fixture?: FixtureKind;
    /** The sample is an authored example, without clinical units. */
    model: "fictional-teaching-sample";
    trailClock: number;
}
export interface SimulationOptions {
    seed?: number;
    count?: number;
    /** Independent illustrative settings. This object takes priority over factor and intensity. */
    factors?: FactorSettings;
    /** Keep all 18 teaching examples visible. This mode has a minimum of 18 cells. */
    teachingPopulation?: boolean;
    /** Legacy single-factor option. */
    factor?: FactorId;
    /** Position in an illustrative development sequence, without a real-time calibration. */
    progress?: number;
    /** Relative scenario strength, without a dose calibration. */
    intensity?: number;
}
export interface Flow extends Point {
    dx: number;
    dy: number;
    strength: number;
}
export interface Metrics {
    total: number;
    motile: number;
    progressive: number;
    alive: number;
    /** Typical head and tail outline in this model, not a clinical morphology score. */
    typical: number;
    dnaDamaged: number;
    multiHead: number;
    multiTail: number;
    midpieceDamaged: number;
    headDefects: number;
    tailDefects: number;
    slow: number;
    immotile: number;
    nonprogressive: number;
}
