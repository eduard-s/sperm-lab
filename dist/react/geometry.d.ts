import { type Point, type Simulation, type SpermCell } from "../core/index.js";
export type HeadGeometry = {
    center: Point;
    localY: number;
    rx: number;
    ry: number;
    contour: Point[];
    asymmetric: boolean;
};
export type CellGeometry = {
    anchor: Point;
    scale: number;
    heads: HeadGeometry[];
    tails: Point[][];
    midpiece: Point[];
    connections: Point[][];
    headRx: number;
    headRy: number;
    midpieceWidth: number;
};
/** CSS pixel anchor shared by the scene, hit detection, and the moving inspector. */
export declare function getCellAnchor(cell: SpermCell, width: number, height: number): Point;
/** One isotropic display scale keeps cell outlines independent of canvas aspect ratio. */
export declare function getCellGeometry(cell: SpermCell, time: number, width: number, height: number): CellGeometry;
/** Hit the visible anatomy in CSS pixels, including each tail branch. */
export declare function hitTestCell(world: Simulation, px: number, py: number, width: number, height: number, padding?: number): SpermCell | undefined;
