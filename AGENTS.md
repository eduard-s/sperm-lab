# Project rules

Keep the simulation, renderer, React component, styles, and demo in this repository.
Use the public package API in the personal site.
Publish only as `@esmirnov.ai/sperm-lab`.
Use the `@esmirnov.ai` scope in package imports, installation steps, and npm links.
Keep React optional for consumers of the headless core.
Use no backend or analytics service.

Keep all 12 factor sliders visible and independent.
Combine their values in one live sample.
Keep dropdown factor selection and baseline comparisons out of the interface.
Keep anatomy inspection near the sample.
Keep a visible Explore button that follows the selected swimmer.
Use normal clicks or taps for selection. Do not require a context menu.

Use a transparent canvas, native controls, thin rules, and the existing sage, charcoal, and clay palette.
Use normal document flow on desktop and phones.
On phones, put all controls directly below the live sample.
Put the notes, defect catalog, and anatomy explanation after all controls.
Keep keyboard input, touch scrolling, reduced-motion support, and suspension in hidden tabs.

Separate movement, vitality, shape, and DNA damage.
Keep all 18 catalog examples available.
Show the selected head, tail, and midpiece shapes explicitly.
Show absent, double, and triple tails.
Keep prepared morphology examples independent of specific lifestyle claims.

Use red `--sl-damage: #b82735` for DNA fragmentation and defect accents.
Keep fragmentation symbols inside a compact nucleus.
Keep typical heads compact, midpieces short and thin, and tails long and tapered.
Use no external cross marks, loose DNA helices, or banded midpiece barrels.

Describe every population as synthetic.
Identify factor settings as illustrative, without clinical doses or personal fertility predictions.
Explain uncertain evidence for endurance exercise, cycling, psychological stress, and sleep.

Keep the teaching population on by default in the React component.
Keep the raw core opt-in through `teachingPopulation`.
Keep a matching example for every catalog category.
Preserve the required catalog trait while other traits respond to the factors.

Show defects directly in the live sample.
Use shared renderer geometry to select visible heads, midpieces, and tails.
Open a nonmodal detail popup for the selected cell.
Keep that popup near the cell during motion.
Show all cell traits and keep full anatomy optional.
Preserve keyboard inspection and popup dismissal.

Show Concentration as `Metrics.total` with the unit `cells / model field`.
Update the count when the synthetic population changes.
Use no clinical concentration units or reference thresholds.

Never change existing cell heads or DNA during a motion step.
Factor changes prepare a new synthetic population.

Use short, simple sentences in all documentation.
Keep scientific claims beside their sources.
Run `npm test`, `npm run typecheck`, `npm run test:package`, and `npm run build:demo` before release.
Commit `dist/` with its source.
