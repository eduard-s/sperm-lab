import type { Factor, FactorId } from "./types.js";

const eau = { title: "EAU: Male infertility", url: "https://uroweb.org/guidelines/sexual-and-reproductive-health/chapter/male-infertility" };
const nichd = { title: "NICHD: Lifestyle and environmental factors", url: "https://www.nichd.nih.gov/health/topics/infertility/conditioninfo/causes/lifestyle" };
const endurance = { title: "Endurance exercise and semen quality: systematic review", url: "https://pubmed.ncbi.nlm.nih.gov/38861008/" };

/** References for separate anatomy, movement, and energy concepts. The artwork is original. */
export const ANATOMY_SOURCES = [
  { title: "WHO: Laboratory manual for human semen, sixth edition", url: "https://www.who.int/publications/i/item/9789240030787" },
  { title: "Separate assessment of head, midpiece, and tail in the WHO manual", url: "https://www.sciencedirect.com/science/article/pii/S0015028221022986" },
  { title: "Glycolysis and oxidative phosphorylation in sperm movement", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3501448/" },
  { title: "Human sperm proportions and longitudinal rolling", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9790903/" },
] as const;

/** These records explain evidence. They do not assign clinical doses or personal risks. */
export const FACTORS = [
  {
    id: "exercise", title: "Regular exercise", evidence: "Human association",
    summary: "Compare weekly minutes of regular physical activity in the example.",
    mechanism: "Physical activity can support metabolic health and hormone balance. Some studies report better semen measures in active men.",
    timescale: "Weeks to months. This example represents a new sample after development.",
    limits: "Exercise does not guarantee better semen or pregnancy. Studies differ, and this example has no prescribed exercise dose.",
    sources: [eau, { title: "Paternal physical activity, semen quality, and reproductive outcomes", url: "https://pubmed.ncbi.nlm.nih.gov/25164027/" }, { title: "Physical activity and semen quality in a clinic cohort", url: "https://pubmed.ncbi.nlm.nih.gov/21122845/" }],
  },
  {
    id: "endurance", title: "High-volume running", evidence: "Mixed evidence",
    summary: "Set weekly hours of hard running in a scenario with poor recovery.",
    mechanism: "Low energy availability, heat, and insufficient recovery can accompany heavy training. These conditions can affect reproductive hormone signals.",
    timescale: "Weeks to months. This example represents a later sample.",
    limits: "Running is not inherently harmful. Endurance studies report inconsistent results. The scene shows one possible pathway, without a mileage threshold.",
    sources: [endurance],
  },
  {
    id: "cycling", title: "Long cycling sessions", evidence: "Mixed evidence",
    summary: "Set weekly hours spent in long cycling sessions.",
    mechanism: "Long sessions can involve local heat and pressure. Some studies report differences in semen measures among cyclists.",
    timescale: "Repeated exposure over weeks. This example represents a later sample.",
    limits: "Studies do not establish a universal cycling threshold. The scene shows a possible adverse example, not an inevitable effect.",
    sources: [endurance, { title: "Physical activity and semen quality in a clinic cohort", url: "https://pubmed.ncbi.nlm.nih.gov/21122845/" }],
  },
  {
    id: "smoking", title: "Smoking", evidence: "Human association",
    summary: "Set the usual number of cigarettes smoked per day in the example.",
    mechanism: "Smoke constituents can contribute to oxidative stress and DNA damage. Membrane damage can interfere with active movement.",
    timescale: "Repeated exposure and sperm development. A new cohort replaces the initial sample.",
    limits: "A cigarette does not instantly reshape a sperm. The scene does not predict the effect of a cigarette count.",
    sources: [{ title: "ASRM: Tobacco or marijuana use and infertility", url: "https://www.asrm.org/practice-guidance/practice-committee-documents/tobacco-or-marijuana-use/" }, eau],
  },
  {
    id: "alcohol", title: "Heavy alcohol use", evidence: "Human association",
    summary: "Set weekly U.S. standard drinks. One standard drink contains 14 grams of pure alcohol.",
    mechanism: "Chronic heavy alcohol use can disrupt hormone balance and sperm production. Studies also report changes in movement and shape.",
    timescale: "Repeated exposure over weeks to months. This scene uses a new sample.",
    limits: "Heavy use differs from moderate consumption. No established dose-response curve converts drinks into the counts in this scene.",
    sources: [{ title: "ASRM: Optimizing natural fertility", url: "https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021/" }, { title: "NIAAA: What is a standard drink?", url: "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink" }],
  },
  {
    id: "stress", title: "Chronic stress", evidence: "Mixed evidence",
    summary: "Set the number of days with prolonged stress in a typical week in the example.",
    mechanism: "Stress-related hormone signals can affect reproductive pathways. Human studies report variable associations with semen measures.",
    timescale: "Prolonged exposure. This example represents a later sample.",
    limits: "Association does not prove cause. A stressful day does not determine sperm quality. This scene shows an uncertain pathway.",
    sources: [{ title: "Effects of work and life stress on semen quality", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4382866/" }, nichd],
  },
  {
    id: "sleep", title: "Disrupted sleep", evidence: "Human association",
    summary: "Set the number of nights with disrupted sleep in a typical week in the example.",
    mechanism: "Sleep patterns relate to daily hormone rhythms. Observational studies report associations between disturbed sleep and some semen measures.",
    timescale: "Habitual sleep patterns. This example represents a later sample.",
    limits: "These associations do not prove cause. The model does not prescribe sleep hours or predict damage after a poor night.",
    sources: [{ title: "Sleep disturbances and semen quality in 953 young men", url: "https://pubmed.ncbi.nlm.nih.gov/23568594/" }, { title: "Sleep duration, quality, and semen quality", url: "https://pubmed.ncbi.nlm.nih.gov/31830732/" }],
  },
  {
    id: "heat", title: "Prolonged heat", evidence: "Established mechanism",
    summary: "Set weekly hours of extra heat exposure in a repeated exposure scenario.",
    mechanism: "Increased testicular temperature can disturb sperm production and function. This example changes the later cohort, not the current fluid temperature.",
    timescale: "Sustained exposure, followed by delayed sample changes.",
    limits: "The model does not measure temperature. Heat sources and individual responses differ. Normal warmth does not imply damage.",
    sources: [eau, { title: "Scrotal heat stress and sperm chromatin damage in fertile men", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4429437/" }],
  },
  {
    id: "fever", title: "Fever", evidence: "Human association",
    summary: "Set how many days a single fever episode lasts in the example.",
    mechanism: "Fever can disrupt developing sperm. Changes in concentration, movement, and shape can appear after the illness.",
    timescale: "Delayed effects over subsequent weeks. Recovery also takes time.",
    limits: "Responses differ with the illness and its timing. This example does not set a recovery date or diagnose an infection.",
    sources: [{ title: "History of febrile illness and variation in semen quality", url: "https://pubmed.ncbi.nlm.nih.gov/14507826/" }],
  },
  {
    id: "metabolic", title: "Obesity and metabolic health", evidence: "Human association",
    summary: "Choose a modeled level of metabolic stress during sperm development.",
    mechanism: "Hormone balance, inflammation, and heat can differ with metabolic conditions. Population studies associate obesity with poorer semen measures.",
    timescale: "Longer-term conditions. This example represents a later sample.",
    limits: "Body size does not diagnose fertility. Individuals differ, and the scene does not assign a target weight or a fertility score.",
    sources: [nichd, { title: "Obesity, sperm DNA integrity, and mitochondrial activity", url: "https://pubmed.ncbi.nlm.nih.gov/22300410/" }],
  },
  {
    id: "androgens", title: "Testosterone and anabolic steroids", evidence: "Established mechanism",
    summary: "Choose a modeled level of exposure to external androgens.",
    mechanism: "External androgens suppress pituitary signals that support sperm production. A higher blood testosterone level does not guarantee more sperm.",
    timescale: "Suppression and recovery develop over months. Individual timing differs.",
    limits: "This scene does not give medication advice or a recovery schedule. Steroid-associated suppression differs from ordinary exercise.",
    sources: [{ title: "AUA and ASRM: Diagnosis and treatment of infertility in men", url: "https://www.auanet.org/documents/Guidelines/PDF/Male-Infertility-Guideline.pdf" }, eau],
  },
  {
    id: "pesticides", title: "Certain pesticides", evidence: "Human association",
    summary: "Choose a modeled level of repeated exposure to one example class of chemicals.",
    mechanism: "Some chemicals can disturb hormone signals or contribute to cellular stress. Effects depend on the substance and exposure.",
    timescale: "Substance-specific exposure and sperm development. This example uses a later sample.",
    limits: "Pesticides are not one substance. This scene is not an exposure calculator and does not represent all products.",
    sources: [{ title: "WHO: Factors in the diagnosis of male infertility", url: "https://www.ncbi.nlm.nih.gov/books/NBK620433/figure/ch5.fig3/" }, { title: "Pyrethroid metabolites, semen quality, and sperm DNA damage", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2733825/" }],
  },
] as const satisfies readonly Factor[];

export function getFactor(id: FactorId): Factor {
  const factor = FACTORS.find(item => item.id === id);
  if (!factor) throw new RangeError(`Unknown factor: ${String(id)}`);
  return factor;
}
