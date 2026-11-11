# Model and evidence

## Purpose

Sperm Lab explains cell movement, anatomy, and damage pathways.
The lab uses synthetic cells and fictional counts.
It does not analyze semen or predict fertility.

The lab has one live sample.
All 12 factor controls act on the same synthetic population.
A factor change prepares a new population from the same random seed.
The sample illustrates possible development pathways.
It does not change an existing sperm head after one exposure.

## Separate biological properties

Movement describes whether a cell moves.
Progressive movement describes forward travel.
Vitality describes whether a cell is alive.
Shape describes the head and tail outline in this simplified drawing.
Examples include small, large, tapered, and round heads, plus double heads.
Tail examples include bent, coiled, short, absent, double, and triple tails.

Bent and thick midpiece outlines form separate structural examples.
Midpiece injury is a separate trait.
It does not necessarily change the midpiece outline.
The `typical` count covers head and tail outlines only.
It is not a WHO strict morphology score.
DNA damage is a separate property.

An immotile cell can be alive.
A cell with typical shape can have DNA damage.
A moving cell can also have DNA damage.
These properties do not form a single fertility score.

The head contains compact DNA.
The midpiece contains mitochondria.
Sperm get ATP through mitochondrial metabolism and glycolysis.
ATP supports the molecular motors that bend the tail.
The drawing does not resolve molecular motors or actual ATP concentrations.
[Read the study of human sperm metabolism and movement](https://pmc.ncbi.nlm.nih.gov/articles/PMC3501448/).

## Evidence labels

An established mechanism does not establish a personal effect size.
A human association does not prove that one factor caused a particular result.
Mixed evidence means that studies differ or have important limits.
The lab identifies uncertain scenarios as possible-pathway examples.

Every numerical parameter in a scenario is an authored teaching value.
The parameters do not fit clinical data.
The React controls use example quantities such as cigarettes per day and nights of disrupted sleep per week.
These quantities select relative strengths in the core. The model does not estimate a clinical response to an exposure.
The core progress option does not represent a clinical recovery period.
The React component applies the current factor settings at progress 1.

The combined sample uses authored rules for shared development and damage pathways.
It does not estimate the independent risk of each factor or their combined clinical effect.
The model bounds those rules to keep the sample stable.
A beneficial exercise setting does not cancel chemical exposure or repair existing damage.

The teaching catalog contains 18 selected morphology, injury, and movement examples.
The React component keeps a matching example for each category by default.
The raw core includes them only when `teachingPopulation` is `true`.
A teaching population keeps at least 18 cells.
Factor controls still affect the sample through illustrative channels.
The required catalog trait stays available while other traits can change.

The catalog does not contain every clinical phenotype.
Its structural examples do not establish a lifestyle cause.
The examples do not show their frequency in people.

WHO guidance describes the assessment of sperm heads, midpieces, and tails, including multiple heads and tails.
[Read the WHO laboratory manual](https://www.who.int/publications/i/item/9789240030787).
[Read the study of head, midpiece, and tail defect categories](https://doi.org/10.1093/humrep/dev251).
The lab uses original schematic drawings.
It does not copy the manual's figures or present the drawings as diagnostic images.

## Factor scope

| Factor | Explanation and limit |
| --- | --- |
| Regular exercise | Physical activity can relate to better semen parameters. Benefits depend on the population and conditions. |
| High-volume running | Endurance studies report inconsistent results. Load, energy availability, and recovery need separate consideration. |
| Long cycling sessions | Results vary between studies. Cycling does not have one established effect on every rider. |
| Smoking | Human studies associate smoking with poorer sperm parameters. Smoke-related compounds and oxidative stress can damage cells. |
| Heavy alcohol use | Heavy consumption differs from moderate consumption. A universal dose-response rule is not established. |
| Chronic psychological stress | Studies report associations with semen quality. Confounding and reverse causation limit causal claims. |
| Disrupted sleep | Observational studies examine sleep and semen quality. The lab does not promise improvement from a sleep schedule. |
| Prolonged heat exposure | Increased testicular temperature can affect development and function. A relative control does not represent a safe temperature. |
| Fever | Studies report delayed changes after febrile illness. Effects and recovery vary between people. |
| Obesity and metabolic health | Hormone and metabolic changes can relate to sperm production. Body size alone does not determine fertility. |
| Testosterone and anabolic steroids | External androgens can suppress gonadotropins and sperm production. The lab does not give medication instructions. |
| Certain pesticides | Effects depend on the substance and exposure. The lab does not treat all pesticides as one chemical. |

EAU guidance describes physical activity, smoking, alcohol, obesity, heat, and androgen-related concerns.
It also distinguishes semen parameters from fertility outcomes.
[Read the EAU guideline](https://uroweb.org/guidelines/sexual-and-reproductive-health/chapter/male-infertility).

ASRM describes the limits of male alcohol and smoking evidence.
[Read the ASRM opinion](https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021/).

Endurance evidence remains inconsistent.
[Read the endurance review](https://pubmed.ncbi.nlm.nih.gov/38861008/).

A longitudinal study describes delayed changes after fever.
[Read the fever study](https://pubmed.ncbi.nlm.nih.gov/14507826/).

Observational studies examine psychological stress and sleep.
[Read the stress study](https://pmc.ncbi.nlm.nih.gov/articles/PMC4382866/).
[Read the sleep study](https://pubmed.ncbi.nlm.nih.gov/41330355/).

WHO guidance includes environmental chemicals in the assessment of male infertility.
[Read the WHO diagnostic guidance](https://www.ncbi.nlm.nih.gov/books/NBK620433/figure/ch5.fig3/).

## Display proportions

A human sperm study reports typical head lengths of 4–6 µm, midpiece lengths of 5–7 µm, and tail lengths of 50–60 µm.
[Read the study of human sperm proportions and longitudinal rolling](https://pmc.ncbi.nlm.nih.gov/articles/PMC9790903/).

Those dimensions guide the anatomical arrangement.
The renderer enlarges heads and injury marks to make live traits visible.
The display does not use a calibrated microscope scale or fixed anatomical pixel ratios.
Typical heads remain compact ovals, with a short, thin midpiece and a longer tail.
The catalog changes the outlines only for the selected structural examples.
The anatomy inspector enlarges parts for explanation.

The head drawing contains a compact nucleus rather than a loose DNA helix.
Red DNA fragments appear inside the compact nucleus.
The red fragments form a symbolic teaching overlay.
Their piece count does not measure molecular breaks or laboratory assay results.
They do not show molecular detail or resolved DNA breaks in ordinary microscopy.
The overlay does not replace a laboratory assay for DNA damage.

## Concentration in the model

Concentration means the current cell count in one model field.
The readout uses `Metrics.total` and displays `cells / model field`.
Factor changes can change that count when they prepare a new population.
The teaching mode keeps at least 18 cells for catalog coverage.

The field has no calibrated fluid volume.
The readout does not use cells per milliliter or clinical reference thresholds.
It does not measure semen concentration or predict fertility.

## Motion and inspection

Each cell has a position, direction, beat phase, and short movement trail.
A bounded motion rule produces forward travel, circling, weak movement, or immobility.
A sinusoidal tail drawing makes the beat visible.
The mouse adds a local current.
The current moves cells without changing their biological properties.
A current can move an immotile cell without active propulsion.

The model omits fluid interactions, three-dimensional motion, capacitation, chemotaxis, fertilization, and interactions with reproductive tissues.
The DNA view is an educational overlay.
It is not a microscopy technique or a diagnostic assay.

The live field shows head, tail, midpiece, and DNA traits directly.
Pointer selection uses the rendered cell geometry, including tails and midpieces.
A nonmodal detail popup tracks the selected cell during motion.
Its enlarged anatomy remains a schematic teaching view.

Discovery challenges use prepared samples with known targets.
Those samples teach a distinction and do not represent population frequencies.
