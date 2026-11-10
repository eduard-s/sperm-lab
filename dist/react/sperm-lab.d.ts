import { type CSSProperties } from "react";
import { getMetrics, type FactorId } from "../core/index.js";
type Metrics = ReturnType<typeof getMetrics>;
export type SpermLabMetrics = {
    baseline: Metrics;
    scenario: Metrics;
};
export type SpermLabProps = {
    seed?: number;
    count?: number;
    initialFactor?: FactorId;
    className?: string;
    style?: CSSProperties;
    onMetrics?: (metrics: SpermLabMetrics) => void;
};
export declare function SpermLab({ seed, count, initialFactor, className, style, onMetrics }?: SpermLabProps): import("react").JSX.Element;
export {};
