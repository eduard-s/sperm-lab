# API

## Entry points

| Import | Content |
| --- | --- |
| `@esmirnov.ai/sperm-lab` | React component and component types. |
| `@esmirnov.ai/sperm-lab/react` | Alias for the React entry. |
| `@esmirnov.ai/sperm-lab/core` | Simulation, factors, geometry, metrics, and prepared samples. |
| `@esmirnov.ai/sperm-lab/styles.css` | Scoped component styles. |
| `@esmirnov.ai/sperm-lab/package.json` | Package metadata. |

The core entry does not import React or use browser globals.
The React entry keeps its client directive for compatible frameworks.

## React component

```tsx
import { SpermLab } from "@esmirnov.ai/sperm-lab";
import "@esmirnov.ai/sperm-lab/styles.css";

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
| `teachingPopulation` | Keep a matching example for every catalog category. The default is `true`. |
| `className` | Add a class to the component root. |
| `style` | Add styles or custom properties to the component root. |
| `onMetrics` | Receive the counts after a population or prepared sample changes. |

`seed`, `count`, `initialFactors`, `initialFactor`, and `teachingPopulation` apply when the component mounts.
Later changes to those properties do not replace the sample.
Use a React `key` to remount the component with new defaults.

The default seed is 42 and the default requested count is 48.
With the teaching population, the component bounds the requested count between 18 and 120 cells.
Without it, the component bounds the requested count between 8 and 120 cells.
Factor values can change the actual population size.
The teaching mode keeps at least 18 cells.
The core accepts requested counts from 1 to 160 before that teaching floor.

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

## Live inspection and concentration

The component draws defects directly in the live sample.
Explore selects a moving swimmer and opens its details.
If a cell is already selected, Explore keeps that selection.
Select Explore again to dismiss the popup.
Select a visible head, midpiece, or tail to inspect its cell.
A nonmodal detail popup tracks the selected cell during motion.
The popup shows movement, vitality, head, tail, midpiece, and DNA traits.
DNA details obey the DNA overlay control.

Escape, the close button, and an empty-space click dismiss the popup.
Enter on the focused canvas selects the next cell and opens its details.
Next swimmer selects the next cell with a button.
The canvas blocks the browser context menu.
Tab reaches the popup controls.
Full anatomy dismisses the popup and scrolls to the larger diagram.
Popup motion obeys pause and reduced-motion preferences.

The Concentration readout uses `Metrics.total` with the unit `cells / model field`.
It updates after a factor change prepares a new population.
The readout describes synthetic density without clinical units or reference thresholds.
`onMetrics` continues to report population changes rather than every motion frame.

The component uses internal rendered geometry for pointer selection.
The public `findCell` function remains a center-based query in normalized model coordinates.
The internal renderer helpers do not change the public package entry points.

## Damage color

The component uses `--sl-damage` for DNA fragmentation and defect accents.
The default value is red `#b82735`.
The internal renderer reads this color into its optional `SpermPalette.damage` field.

```css
.my-lab.sl-lab {
  --sl-damage: #b82735;
}
```

## Core functions

```ts
createSimulation({ seed, count, factors: { smoking: 0.5, heat: 0.3 }, teachingPopulation: true });
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

The core defaults `teachingPopulation` to `false`.
Set it to `true` to keep a matching example for every catalog category.
Factor controls still affect the sample through illustrative channels.
The model preserves the required catalog trait while other traits can change.
A cell can match more than one catalog category.

The `progress` option represents an illustrative development stage from 0 to 1.
The React component uses progress 1 with the current factor settings.
It does not represent a fixed number of days.
A zero progress value removes the illustrative factor effects.
Teaching catalog examples remain available.

`stepSimulation` changes motion in place.
It does not change vitality, shape, or DNA damage.
An optional current has `x`, `y`, `dx`, `dy`, and `strength` fields.

`getMetrics` returns integer counts for the sample.
The counts include `total`, `motile`, `progressive`, `alive`, `typical`, and `dnaDamaged`.
They also include `multiHead`, `multiTail`, `midpieceDamaged`, `headDefects`, `tailDefects`, `slow`, `immotile`, and `nonprogressive`.
`isSlow` identifies a motile cell slower than `SLOW_SPEED_THRESHOLD` in the model.

`Metrics.immotile` includes all cells without active propulsion, including nonviable cells.
The catalog identifier `immotile` selects a cell that remains alive without active propulsion.
A current can move an immotile cell without changing its movement class.

`typical` counts cells with a typical head and tail outline in this model.
Midpiece injury and DNA damage remain separate properties.
It is not a WHO strict morphology score.
Those counts and thresholds describe the synthetic sample only.
They are not clinical reference limits.

## Cell geometry

`ANATOMY_SOURCES` contains the references for morphology and sperm metabolism.
Each cell includes `headCount`, `tailCount`, `headShape`, `tailShape`, and `midpieceShape`.
The independent injury fields are `midpieceDamage` and `dnaDamage`.
The older `headDefect`, `tailDefect`, and `morphology` fields remain available.

| Field | Values |
| --- | --- |
| `headCount` | `1` or `2`. |
| `tailCount` | `0`, `1`, `2`, or `3`. |
| `headShape` | `typical`, `small`, `large`, `tapered`, `round`, or `irregular`. |
| `tailShape` | `typical`, `bent`, `coiled`, `short`, `absent`, or `irregular`. |
| `midpieceShape` | `typical`, `bent`, or `thick`. |
| `dnaFragmentation` | `0`, `3`, `4`, `5`, or `6` symbolic pieces. |

DNA pieces are display symbols rather than measured molecular fragments.
`getTailPoints` returns normalized points for a renderer.
Use tail indexes from zero to `tailCount - 1`.
If `tailCount` is zero, draw no tail.
`findCell` returns a nearby cell or `undefined`.

## Teaching catalog

`DEFECT_CATALOG` describes 18 selected morphology, injury, and movement examples.
`cellMatchesDefect(cell, id)` identifies a matching cell.
`getDefectCounts(sample)` returns integer counts indexed by the catalog identifiers.
`getCellDefects(cell)` returns every catalog record that matches the cell.
`MORPHOLOGY_SOURCES` contains the structural references.
A prepared example carries its catalog identifier in `cell.example`.

`createDefectSimulation` makes a prepared sample with at least 18 cells.
The sample guarantees an example for every catalog identifier.
It identifies itself with `fixture: "defect-examples"`.
The examples do not represent population frequencies or the effect of a particular lifestyle factor.

The catalog identifiers are:

```ts
"double-head", "small-head", "large-head", "tapered-head", "round-head",
"double-tail", "triple-tail", "bent-tail", "coiled-tail", "short-tail", "absent-tail",
"bent-midpiece", "thick-midpiece", "midpiece-damage", "dna-fragmentation",
"slow", "immotile", "nonprogressive"
```

Prepared challenge identifiers remain `hidden-dna`, `immotile-alive`, and `circling`.
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
