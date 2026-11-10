# API

## Entry points

| Import | Content |
| --- | --- |
| `sperm-lab` | React component and component types. |
| `sperm-lab/react` | Alias for the React entry. |
| `sperm-lab/core` | Simulation, factors, geometry, metrics, and prepared samples. |
| `sperm-lab/styles.css` | Scoped component styles. |
| `sperm-lab/package.json` | Package metadata. |

The core entry does not import React or use browser globals.
The React entry keeps its client directive for compatible frameworks.

## React component

```tsx
import { SpermLab } from "sperm-lab";
import "sperm-lab/styles.css";

<SpermLab
  seed={42}
  count={48}
  initialFactors={{ smoking: 0.5, heat: 0.3 }}
  className="my-lab"
  onMetrics={metrics => console.log(metrics.total, metrics.multiHead)}
/>
```

| Property | Purpose |
| --- | --- |
| `seed` | Select a reproducible synthetic population. |
| `count` | Set the requested number of cells. |
| `initialFactors` | Set independent initial factor strengths from 0 to 1. |
| `initialFactor` | Preserve the older single-factor default for compatibility. |
| `className` | Add a class to the component root. |
| `style` | Add styles or custom properties to the component root. |
| `onMetrics` | Receive the counts after a population or prepared sample changes. |

`seed`, `count`, `initialFactors`, and `initialFactor` apply when the component mounts.
Later changes to those properties do not replace the sample.
Use a React `key` to remount the component with new defaults.

The default seed is 42 and the default requested count is 48.
The component bounds the requested count between 8 and 120 cells.
Factor values can change the actual population size.
The core accepts requested counts from 1 to 160.

All factor strengths default to zero.
`initialFactors` takes precedence over `initialFactor`.
The older `initialFactor` option starts that factor at a strength of 0.65.
All 12 native factor sliders remain visible.
Each slider changes its own value in the combined sample.

`onMetrics` receives one `Metrics` object after the initial mount and population changes.
It does not run for every animation frame.
React development mode can repeat effects.

The component includes its own controls, sources, sample, and inspection view.
The host owns its header, footer, and page introduction.
The canvas keeps its background transparent.

The component respects reduced-motion preferences.
It stops automatic motion when its document is hidden or the component leaves the viewport.
Use the component controls to pause or resume motion.

## Core functions

```ts
createSimulation({ seed, count, factors: { smoking: 0.5, heat: 0.3 } });
stepSimulation(sample, dt, flow);
getMetrics(sample);
getTailPoints(cell, sample.time, 0);
getTailPoints(cell, sample.time, 1);
findCell(sample, x, y);
createDefectSimulation({ seed, count });
createChallengeSimulation("hidden-dna", { seed, count });
```

Positions use normalized coordinates from 0 to 1.
Time steps use seconds for the motion model only.
The model bounds long or invalid time steps.
Each factor value uses a relative scale from 0 to 1.
Unspecified factor values resolve to zero.
`resolveFactors(settings)` returns a complete map of factor values.
It clamps finite values to the range from 0 to 1.
Invalid numeric values become zero.
Unknown factor identifiers cause a `RangeError`.
`getActiveFactors(sample)` returns the factor records with positive strengths.

Create a new simulation when the factor combination changes.
The core also accepts the older `factor` and `intensity` options.
The `factors` map takes precedence over those options.

The `progress` option represents an illustrative development stage from 0 to 1.
The component exposes that stage through its Development point slider.
It does not represent a fixed number of days.
A zero progress value keeps the unmodified synthetic population properties.

`stepSimulation` changes motion in place.
It does not change vitality, shape, or DNA damage.
An optional current has `x`, `y`, `dx`, `dy`, and `strength` fields.

`getMetrics` returns integer counts for the sample.
The counts include `total`, `motile`, `progressive`, `alive`, `typical`, and `dnaDamaged`.
They also include `multiHead`, `multiTail`, `midpieceDamaged`, `headDefects`, `tailDefects`, `slow`, `immotile`, and `nonprogressive`.
`isSlow` identifies a motile cell slower than `SLOW_SPEED_THRESHOLD` in the model.

`typical` counts cells with a typical head and tail outline in this model.
Midpiece injury and DNA damage remain separate properties.
It is not a WHO strict morphology score.
Those counts and thresholds describe the synthetic sample only.
They are not clinical reference limits.

## Cell geometry

`ANATOMY_SOURCES` contains the references for morphology and sperm metabolism.
Each cell includes `headCount`, `tailCount`, `headDefect`, `tailDefect`, and `midpieceDamage`.
`headCount` and `tailCount` each have the value 1 or 2.
The older `morphology` field remains available for compatibility.
DNA damage uses a separate `dnaDamage` field.

`getTailPoints` returns normalized points for a renderer.
Use tail index 0 for the first tail.
If `tailCount` is 2, use tail index 1 for the second tail.
`findCell` returns a nearby cell or `undefined`.

`createDefectSimulation` makes a prepared sample with at least eight cells.
The sample includes explicit head, tail, midpiece, movement, and DNA examples.
It identifies itself with `fixture: "defect-examples"`.
The examples do not represent population frequencies.

Prepared challenge identifiers are `hidden-dna`, `immotile-alive`, and `circling`.
Each prepared sample includes a target for its teaching task.

## Factors

`FACTORS` contains all 12 factor records.
Each record includes its identifier, title, summary, mechanism, timescale, evidence label, limits, and source links.

The factor identifiers are:

```ts
type FactorId =
  | "exercise" | "endurance" | "cycling" | "smoking"
  | "alcohol" | "stress" | "sleep" | "heat"
  | "fever" | "metabolic" | "androgens" | "pesticides";
```

Use the emitted TypeScript declarations for the complete public types.
Read the [model guide](MODEL.md) before you change the factor rules.
