const eau = { title: "EAU: Male infertility", url: "https://uroweb.org/guidelines/sexual-and-reproductive-health/chapter/male-infertility" };
const nichd = { title: "NICHD: Lifestyle and environmental factors", url: "https://www.nichd.nih.gov/health/topics/infertility/conditioninfo/causes/lifestyle" };
const endurance = { title: "Endurance exercise and semen quality: systematic review", url: "https://pubmed.ncbi.nlm.nih.gov/38861008/" };
/** These records explain evidence. They do not assign clinical doses or personal risks. */
export const FACTORS = [
    {
        id: "exercise", title: "Regular exercise", evidence: "Human association",
        summary: "Compare a sedentary example with regular physical activity over time.",
        mechanism: "Physical activity can support metabolic health and hormone balance. Some studies report better semen measures in active men.",
        timescale: "Weeks to months. This example represents a new sample after development.",
        limits: "Exercise does not guarantee better semen or pregnancy. Studies differ, and this example has no prescribed exercise dose.",
        sources: [eau, { title: "Paternal physical activity, semen quality, and reproductive outcomes", url: "https://pubmed.ncbi.nlm.nih.gov/25164027/" }, { title: "Physical activity and semen quality in a clinic cohort", url: "https://pubmed.ncbi.nlm.nih.gov/21122845/" }],
    },
    {
        id: "endurance", title: "High-volume running", evidence: "Mixed evidence",
        summary: "Explore a possible pathway during heavy endurance training with poor recovery.",
        mechanism: "Low energy availability, heat, and insufficient recovery can accompany heavy training. These conditions can affect reproductive hormone signals.",
        timescale: "Weeks to months. This example represents a later sample.",
        limits: "Running is not inherently harmful. Endurance studies report inconsistent results. The scene shows one possible pathway, without a mileage threshold.",
        sources: [endurance],
    },
    {
        id: "cycling", title: "Long cycling sessions", evidence: "Mixed evidence",
        summary: "Explore exercise conditions during prolonged cycling.",
        mechanism: "Long sessions can involve local heat and pressure. Some studies report differences in semen measures among cyclists.",
        timescale: "Repeated exposure over weeks. This example represents a later sample.",
        limits: "Studies do not establish a universal cycling threshold. The scene shows a possible adverse example, not an inevitable effect.",
        sources: [endurance, { title: "Physical activity and semen quality in a clinic cohort", url: "https://pubmed.ncbi.nlm.nih.gov/21122845/" }],
    },
    {
        id: "smoking", title: "Smoking", evidence: "Human association",
        summary: "Inspect a possible effect of repeated tobacco smoke exposure.",
        mechanism: "Smoke constituents can contribute to oxidative stress and DNA damage. Membrane damage can interfere with active movement.",
        timescale: "Repeated exposure and sperm development. A new cohort replaces the initial sample.",
        limits: "A cigarette does not instantly reshape a sperm. The scene does not predict the effect of a cigarette count.",
        sources: [{ title: "ASRM: Tobacco or marijuana use and infertility", url: "https://www.asrm.org/practice-guidance/practice-committee-documents/tobacco-or-marijuana-use/" }, eau],
    },
    {
        id: "alcohol", title: "Heavy alcohol use", evidence: "Human association",
        summary: "Explore repeated heavy alcohol use during sperm development.",
        mechanism: "Chronic heavy alcohol use can disrupt hormone balance and sperm production. Studies also report changes in movement and shape.",
        timescale: "Repeated exposure over weeks to months. This scene uses a new sample.",
        limits: "Heavy use differs from moderate consumption. No established dose-response curve converts drinks into the counts in this scene.",
        sources: [{ title: "ASRM: Optimizing natural fertility", url: "https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021/" }],
    },
    {
        id: "stress", title: "Chronic stress", evidence: "Mixed evidence",
        summary: "Explore one possible link between prolonged psychological stress and reproduction.",
        mechanism: "Stress-related hormone signals can affect reproductive pathways. Human studies report variable associations with semen measures.",
        timescale: "Prolonged exposure. This example represents a later sample.",
        limits: "Association does not prove cause. A stressful day does not determine sperm quality. This scene shows an uncertain pathway.",
        sources: [{ title: "Effects of work and life stress on semen quality", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4382866/" }, nichd],
    },
    {
        id: "sleep", title: "Disrupted sleep", evidence: "Human association",
        summary: "Explore research on disturbed sleep and semen quality.",
        mechanism: "Sleep patterns relate to daily hormone rhythms. Observational studies report associations between disturbed sleep and some semen measures.",
        timescale: "Habitual sleep patterns. This example represents a later sample.",
        limits: "These associations do not prove cause. The model does not prescribe sleep hours or predict damage after a poor night.",
        sources: [{ title: "Sleep disturbances and semen quality in 953 young men", url: "https://pubmed.ncbi.nlm.nih.gov/23568594/" }, { title: "Sleep duration, quality, and semen quality", url: "https://pubmed.ncbi.nlm.nih.gov/31830732/" }],
    },
    {
        id: "heat", title: "Prolonged heat", evidence: "Established mechanism",
        summary: "Explore sustained heat exposure during sperm development.",
        mechanism: "Increased testicular temperature can disturb sperm production and function. This example changes the later cohort, not the current fluid temperature.",
        timescale: "Sustained exposure, followed by delayed sample changes.",
        limits: "The slider is not a temperature scale. Exposure duration and individual responses differ. Normal warmth does not imply damage.",
        sources: [eau, { title: "Scrotal heat stress and sperm chromatin damage in fertile men", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4429437/" }],
    },
    {
        id: "fever", title: "Fever", evidence: "Human association",
        summary: "Explore a temporary disturbance after a febrile illness.",
        mechanism: "Fever can disrupt developing sperm. Changes in concentration, movement, and shape can appear after the illness.",
        timescale: "Delayed effects over subsequent weeks. Recovery also takes time.",
        limits: "Responses differ with the illness and its timing. This example does not set a recovery date or diagnose an infection.",
        sources: [{ title: "History of febrile illness and variation in semen quality", url: "https://pubmed.ncbi.nlm.nih.gov/14507826/" }],
    },
    {
        id: "metabolic", title: "Obesity and metabolic health", evidence: "Human association",
        summary: "Explore one pathway that links metabolic conditions with sperm development.",
        mechanism: "Hormone balance, inflammation, and heat can differ with metabolic conditions. Population studies associate obesity with poorer semen measures.",
        timescale: "Longer-term conditions. This example represents a later sample.",
        limits: "Body size does not diagnose fertility. Individuals differ, and the scene does not assign a target weight or a fertility score.",
        sources: [nichd, { title: "Obesity, sperm DNA integrity, and mitochondrial activity", url: "https://pubmed.ncbi.nlm.nih.gov/22300410/" }],
    },
    {
        id: "androgens", title: "Testosterone and anabolic steroids", evidence: "Established mechanism",
        summary: "See why external testosterone can suppress sperm production.",
        mechanism: "External androgens suppress pituitary signals that support sperm production. A higher blood testosterone level does not guarantee more sperm.",
        timescale: "Suppression and recovery develop over months. Individual timing differs.",
        limits: "This scene does not give medication advice or a recovery schedule. Steroid-associated suppression differs from ordinary exercise.",
        sources: [{ title: "AUA and ASRM: Diagnosis and treatment of infertility in men", url: "https://www.auanet.org/documents/Guidelines/PDF/Male-Infertility-Guideline.pdf" }, eau],
    },
    {
        id: "pesticides", title: "Certain pesticides", evidence: "Human association",
        summary: "Explore an example of repeated exposure to a specific class of chemicals.",
        mechanism: "Some chemicals can disturb hormone signals or contribute to cellular stress. Effects depend on the substance and exposure.",
        timescale: "Substance-specific exposure and sperm development. This example uses a later sample.",
        limits: "Pesticides are not one substance. This scene is not an exposure calculator and does not represent all products.",
        sources: [{ title: "WHO: Factors in the diagnosis of male infertility", url: "https://www.ncbi.nlm.nih.gov/books/NBK620433/figure/ch5.fig3/" }, { title: "Pyrethroid metabolites, semen quality, and sperm DNA damage", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2733825/" }],
    },
];
export function getFactor(id) {
    const factor = FACTORS.find(item => item.id === id);
    if (!factor)
        throw new RangeError(`Unknown factor: ${String(id)}`);
    return factor;
}
