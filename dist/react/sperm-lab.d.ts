import { type CSSProperties } from "react";
import { getMetrics, type FactorId } from "../core/index.js";
type Metrics = ReturnType<typeof getMetrics>;
type Factors = Partial<Record<FactorId, number>>;
export type SpermLabMetrics = Metrics;
export type SpermLabProps = {
    seed?: number;
    count?: number;
    initialFactors?: Factors;
    initialFactor?: FactorId;
    teachingPopulation?: boolean;
    className?: string;
    style?: CSSProperties;
    onMetrics?: (metrics: SpermLabMetrics) => void;
};
export declare function SpermLab({ seed, count, initialFactors, initialFactor, teachingPopulation, className, style, onMetrics }?: SpermLabProps): import("react").JSX.Element;
export {};
