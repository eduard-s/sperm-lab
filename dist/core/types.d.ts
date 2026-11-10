export type FactorId = "exercise" | "endurance" | "cycling" | "smoking" | "alcohol" | "stress" | "sleep" | "heat" | "fever" | "metabolic" | "androgens" | "pesticides";
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
    morphology: "typical" | "head" | "tail";
    dnaDamage: boolean;
    progressive: boolean;
    trail: Point[];
}
export type ChallengeKind = "hidden-dna" | "immotile-alive" | "circling";
export interface Simulation {
    cells: SpermCell[];
    time: number;
    seed: number;
    factor?: FactorId;
    progress: number;
    intensity: number;
    requestedCount: number;
    fixture?: ChallengeKind;
    /** The sample is an authored example, without clinical units. */
    model: "fictional-teaching-sample";
    trailClock: number;
}
export interface SimulationOptions {
    seed?: number;
    count?: number;
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
    typical: number;
    dnaDamaged: number;
}
