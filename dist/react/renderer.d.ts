import { type Simulation } from "../core/index.js";
export type SpermPalette = {
    ink: string;
    sage: string;
    clay: string;
    accent: string;
};
export type SpermDisplay = {
    trails: boolean;
    dna: boolean;
    selected: number | null;
};
export declare function paintSimulation(context: CanvasRenderingContext2D, world: Simulation, width: number, height: number, palette: SpermPalette, display: SpermDisplay): void;
