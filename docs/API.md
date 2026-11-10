# API

## Entry points

| Import | Content |
| --- | --- |
| `sperm-lab` | React component and component types. |
| `sperm-lab/react` | Alias for the React entry. |
| `sperm-lab/core` | Simulation, factors, geometry, metrics, and challenges. |
| `sperm-lab/styles.css` | Scoped component styles. |
| `sperm-lab/package.json` | Package metadata. |

The core entry does not import React or use browser globals.
The React entry keeps its client directive for compatible frameworks.

## React component

```tsx
import { SpermLab } from "sperm-lab";
import "sperm-lab/styles.css";

<SpermLab seed={42} count={48} initialFactor="heat" className="my-lab" />
```

| Property | Purpose |
| --- | --- |
| `seed` | Select a reproducible fictional population. |
| `count` | Set the requested number of cells in each sample. |
| `initialFactor` | Select the initial factor by its identifier. |
| `className` | Add a class to the component root. |
| `style` | Add styles or custom properties to the component root. |
| `onMetrics` | Receive the counts after a cohort change or challenge change. |

`seed`, `count`, and `initialFactor` apply when the component mounts.
Later changes to those properties do not replace the sample.
Use a React `key` to remount the component with new defaults.
The component bounds the requested count between 8 and 120 cells.
The scenario can change the actual cohort size within that range of requested counts.
The core accepts requested counts from 1 to 160.

`onMetrics` receives `{ baseline, scenario }` after the initial mount and cohort changes.
It does not run for every animation frame.
React development mode can repeat effects.

The component includes its own controls, sources, comparison, and inspection view.
The host owns its header, footer, and page introduction.
The canvases keep their background transparent.

The component respects reduced-motion preferences.
It stops automatic motion when its document is hidden or the component leaves the viewport.
Use the component controls to pause or resume motion.

## Core functions

```ts
createSimulation({ seed, count, factor, progress, intensity });
stepSimulation(sample, dt, flow);
getMetrics(sample);
getTailPoints(cell, sample.time);
findCell(sample, x, y);
createChallengeSimulation("hidden-dna", { seed, count });
```

Positions use normalized coordinates from 0 to 1.
Time steps use seconds for the motion model only.
The model bounds long or invalid time steps.
The scenario progress and intensity use relative values from 0 to 1.

Omit `factor` to create the reference population.
A scenario with zero progress keeps the reference population properties.
Create a new simulation when the factor, intensity, or progress changes.

`stepSimulation` changes motion in place.
It does not change vitality, shape, or DNA damage.
An optional current has `x`, `y`, `dx`, `dy`, and `strength` fields.

`getMetrics` returns integer counts for `total`, `motile`, `progressive`, `alive`, `typical`, and `dnaDamaged`.
Those counts describe the synthetic sample only.

`getTailPoints` returns normalized points for a renderer.
`findCell` returns a nearby cell or `undefined`.

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
Read the [model guide](MODEL.md) before you change the scenario rules.
