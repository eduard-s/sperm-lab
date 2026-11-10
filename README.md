# Sperm Lab

Explore sperm movement, anatomy, and DNA through 12 educational scenarios.
Make a current with the mouse.
Select a cell to inspect its head, midpiece, tail, and DNA.

[Open the live lab](https://esmirnov.ai/sperm-lab/) · [Source code](https://github.com/eduard-s/sperm-lab) · [npm package](https://www.npmjs.com/package/sperm-lab)

The package includes a TypeScript simulation and a React component.
The component runs in the browser without a backend.
The headless simulation does not need React.

## Install

Use Node.js 22.12 or a later version for the development tools.
The React component supports React 18.2 through React 19.

```sh
npm install sperm-lab
```

```tsx
import { SpermLab } from "sperm-lab";
import "sperm-lab/styles.css";

export default function App() {
  return <SpermLab seed={42} count={48} initialFactor="heat" />;
}
```

For Next.js, put the component inside a client component.
Import the stylesheet from your page or layout.

```tsx
"use client";

import { SpermLab } from "sperm-lab";

export default function Lab() {
  return <SpermLab />;
}
```

## Explore the lab

1. Select a factor.
2. Compare the reference sample with the fictional later sample.
3. Drag across a sample to make a current.
4. Select a cell to examine its anatomy.
5. Use the DNA view to reveal hidden damage.
6. Try the discovery challenges.

The lab separates movement, vitality, shape, and DNA damage.
An immotile sperm can be alive.
Typical shape and forward movement do not prove that DNA is intact.

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

## Model limits

All cells, counts, scenario strengths, and development stages are fictional teaching examples.
The model does not calculate personal fertility, clinical doses, or treatment outcomes.
Its movement model does not solve fluid dynamics.

A factor creates a new fictional cohort for comparison.
Motion steps do not change the shape or DNA of existing cells.
The progress control represents an illustrative development sequence.
It does not represent a fixed number of days.

Uncertain factors use possible-pathway examples.
The example is not a measured effect size or a prediction.
The model does not add the risks of different factors.

Read the [model and evidence guide](docs/MODEL.md) for the scientific scope.

## Use the headless simulation

```ts
import {
  FACTORS,
  createSimulation,
  stepSimulation,
  getMetrics,
  getTailPoints,
} from "sperm-lab/core";

const sample = createSimulation({
  seed: 42,
  count: 48,
  factor: "heat",
  progress: 1,
  intensity: 0.6,
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
