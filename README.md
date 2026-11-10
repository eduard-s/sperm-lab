# Sperm Lab

Explore sperm movement, anatomy, and DNA in one live sample.
Combine 12 independent factor controls.
Make a current with the mouse.
Select a cell to inspect its head, midpiece, tail, and DNA.

[Open the live lab](https://esmirnov.ai/sperm-lab/) · [Source code](https://github.com/eduard-s/sperm-lab) · [npm package](https://www.npmjs.com/package/@esmirnov.ai/sperm-lab)

The package includes a TypeScript simulation and a React component.
The component runs in the browser without a backend.
The headless simulation does not need React.

## Install

Use Node.js 22.12 or a later version for the development tools.
The React component supports React 18.2 through React 19.

```sh
npm install @esmirnov.ai/sperm-lab
```

```tsx
import { SpermLab } from "@esmirnov.ai/sperm-lab";
import "@esmirnov.ai/sperm-lab/styles.css";

export default function App() {
  return <SpermLab seed={42} count={48} initialFactors={{ smoking: 0.5, heat: 0.3 }} />;
}
```

For Next.js, put the component inside a client component.
Import the stylesheet from your page or layout.

```tsx
"use client";

import { SpermLab } from "@esmirnov.ai/sperm-lab";

export default function Lab() {
  return <SpermLab />;
}
```

## Explore the lab

1. Adjust a factor slider.
2. Combine more factors in the same sample.
3. Drag across the sample to make a current.
4. Select Explore to follow a swimmer and examine its details.
5. Use the DNA view to reveal hidden damage.
6. Use the prepared morphology sample to find different cell forms.

All 12 factor sliders remain visible.
Each slider has its own value and explanation.
The sample can show forward movement, slow movement, circles, and immobility.
Cell traits include head shapes, multiple tails, midpiece differences, and red DNA fragmentation marks.

The lab separates movement, vitality, shape, and DNA damage.
An immotile sperm can be alive.
Typical shape and forward movement do not prove that DNA is intact.

## Live cell inspection

Defects appear in the live sample as cells move.
Select Explore to follow a swimmer without a context menu.
Select a visible head, midpiece, or tail to inspect its cell.
The detail popup tracks the selected cell.
It shows movement, vitality, head shape, tail shape, midpiece traits, and DNA integrity.
The popup keeps the sample interactive.

Press Escape to dismiss the popup.
Click empty sample space to clear the selection.
Select Full anatomy for the enlarged diagram.
Select Next swimmer to inspect another cell.
The focused canvas also accepts Enter to select the next cell.

The Concentration readout shows the current count as cells per model field.
Factor changes update the count when they prepare a new population.
This is synthetic density without clinical units or thresholds.
It does not represent a semen measurement.

## The 12 factors

| Factor | Educational scope |
| --- | --- |
| Regular exercise | Physical activity and metabolic context. |
| High-volume running | Endurance load, energy availability, and recovery. |
| Long cycling sessions | Exercise conditions and uncertain associations. |
| Smoking | Oxidative stress and damage pathways. |
| Heavy alcohol use | Hormones and sperm production. |
| Chronic psychological stress | Possible pathways and uncertain human evidence. |
| Disrupted sleep | Observational evidence about sleep and semen quality. |
| Prolonged heat exposure | Sperm development and function. |
| Fever | Delayed changes after an illness. |
| Obesity and metabolic health | Hormones, inflammation, and metabolic context. |
| Testosterone and anabolic steroids | Suppression of signals that support sperm production. |
| Certain pesticides | Effects that depend on the chemical and exposure. |

The factor explanations include sources and evidence limits.
Regular exercise does not share a fixed damage rule with high-volume endurance exercise.

## Common defect examples

The teaching catalog includes 18 selected morphology, injury, and movement examples.
It is not a complete list of clinical phenotypes.
It does not show how often each trait occurs in people.

| Region | Examples |
| --- | --- |
| Head | Small, large, tapered, round, and double heads. |
| Tail | Bent, coiled, short, absent, double, and triple tails. |
| Midpiece | Bent or thick outlines, plus a separate injury marker. |
| DNA | Red fragments inside a compact nucleus. |
| Movement | Slow, immotile, and nonprogressive cells. |

The React component includes the teaching population by default.
It keeps at least 18 cells so each category has a matching example.
Factor controls still affect the sample through illustrative channels.
Each cell can have more than one trait.
The catalog does not establish a lifestyle cause for a particular defect.
Use `teachingPopulation={false}` for a synthetic population without guaranteed catalog coverage.

## Model limits

All cells, counts, and factor strengths are fictional teaching examples.
The model does not calculate personal fertility, clinical doses, or treatment outcomes.
Its movement model does not solve fluid dynamics.

Factor controls prepare one new synthetic population with the selected combination.
Motion steps do not change the shape or DNA of existing cells.
Combined controls use authored rules for possible pathways.
Those rules do not measure combined clinical risk.

Structural forms in the teaching catalog remain independent of lifestyle settings.
The model does not assign those forms to a particular lifestyle factor.
Red DNA fragmentation is a symbolic overlay inside the nucleus.
It does not depict molecular breaks visible through ordinary microscopy.

Uncertain factors use possible-pathway examples.
The example is not a measured effect size or a prediction.
Read the [model and evidence guide](docs/MODEL.md) for the scientific scope.

## Use the headless simulation

```ts
import {
  FACTORS,
  createSimulation,
  stepSimulation,
  getMetrics,
  getTailPoints,
} from "@esmirnov.ai/sperm-lab/core";

const sample = createSimulation({
  seed: 42,
  count: 48,
  factors: { smoking: 0.5, heat: 0.3 },
});

stepSimulation(sample, 1 / 60);
console.log(FACTORS.length, getMetrics(sample));
const tail = getTailPoints(sample.cells[0], sample.time);
```

The core uses normalized coordinates from 0 to 1.
Use the [API guide](docs/API.md) for the exports and options.

## Develop

```sh
npm ci
npm run dev
```

The standalone demo opens at `http://127.0.0.1:4177`.

```sh
npm test
npm run typecheck
npm run test:package
npm run build:demo
```

The package smoke tests install the archive in a clean directory.
They examine core imports without React and server output with React 18 and React 19.

Read the [release guide](docs/DEPLOY.md) before a release.
The project uses the MIT license.
