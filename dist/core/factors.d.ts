import type { Factor, FactorId } from "./types.js";
/** References for separate anatomy, movement, and energy concepts. The artwork is original. */
export declare const ANATOMY_SOURCES: readonly [{
    readonly title: "WHO: Laboratory manual for human semen, sixth edition";
    readonly url: "https://www.who.int/publications/i/item/9789240030787";
}, {
    readonly title: "Separate assessment of head, midpiece, and tail in the WHO manual";
    readonly url: "https://www.sciencedirect.com/science/article/pii/S0015028221022986";
}, {
    readonly title: "Glycolysis and oxidative phosphorylation in sperm movement";
    readonly url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3501448/";
}, {
    readonly title: "Human sperm proportions and longitudinal rolling";
    readonly url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC9790903/";
}];
/** These records explain evidence. They do not assign clinical doses or personal risks. */
export declare const FACTORS: readonly [{
    readonly id: "exercise";
    readonly title: "Regular exercise";
    readonly evidence: "Human association";
    readonly summary: "Compare weekly minutes of regular physical activity in the example.";
    readonly mechanism: "Physical activity can support metabolic health and hormone balance. Some studies report better semen measures in active men.";
    readonly timescale: "Weeks to months. This example represents a new sample after development.";
    readonly limits: "Exercise does not guarantee better semen or pregnancy. Studies differ, and this example has no prescribed exercise dose.";
    readonly sources: readonly [{
        title: string;
        url: string;
    }, {
        readonly title: "Paternal physical activity, semen quality, and reproductive outcomes";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/25164027/";
    }, {
        readonly title: "Physical activity and semen quality in a clinic cohort";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/21122845/";
    }];
}, {
    readonly id: "endurance";
    readonly title: "High-volume running";
    readonly evidence: "Mixed evidence";
    readonly summary: "Set weekly hours of hard running in a scenario with poor recovery.";
    readonly mechanism: "Low energy availability, heat, and insufficient recovery can accompany heavy training. These conditions can affect reproductive hormone signals.";
    readonly timescale: "Weeks to months. This example represents a later sample.";
    readonly limits: "Running is not inherently harmful. Endurance studies report inconsistent results. The scene shows one possible pathway, without a mileage threshold.";
    readonly sources: readonly [{
        title: string;
        url: string;
    }];
}, {
    readonly id: "cycling";
    readonly title: "Long cycling sessions";
    readonly evidence: "Mixed evidence";
    readonly summary: "Set weekly hours spent in long cycling sessions.";
    readonly mechanism: "Long sessions can involve local heat and pressure. Some studies report differences in semen measures among cyclists.";
    readonly timescale: "Repeated exposure over weeks. This example represents a later sample.";
    readonly limits: "Studies do not establish a universal cycling threshold. The scene shows a possible adverse example, not an inevitable effect.";
    readonly sources: readonly [{
        title: string;
        url: string;
    }, {
        readonly title: "Physical activity and semen quality in a clinic cohort";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/21122845/";
    }];
}, {
    readonly id: "smoking";
    readonly title: "Smoking";
    readonly evidence: "Human association";
    readonly summary: "Set the usual number of cigarettes smoked per day in the example.";
    readonly mechanism: "Smoke constituents can contribute to oxidative stress and DNA damage. Membrane damage can interfere with active movement.";
    readonly timescale: "Repeated exposure and sperm development. A new cohort replaces the initial sample.";
    readonly limits: "A cigarette does not instantly reshape a sperm. The scene does not predict the effect of a cigarette count.";
    readonly sources: readonly [{
        readonly title: "ASRM: Tobacco or marijuana use and infertility";
        readonly url: "https://www.asrm.org/practice-guidance/practice-committee-documents/tobacco-or-marijuana-use/";
    }, {
        title: string;
        url: string;
    }];
}, {
    readonly id: "alcohol";
    readonly title: "Heavy alcohol use";
    readonly evidence: "Human association";
    readonly summary: "Set weekly U.S. standard drinks. One standard drink contains 14 grams of pure alcohol.";
    readonly mechanism: "Chronic heavy alcohol use can disrupt hormone balance and sperm production. Studies also report changes in movement and shape.";
    readonly timescale: "Repeated exposure over weeks to months. This scene uses a new sample.";
    readonly limits: "Heavy use differs from moderate consumption. No established dose-response curve converts drinks into the counts in this scene.";
    readonly sources: readonly [{
        readonly title: "ASRM: Optimizing natural fertility";
        readonly url: "https://www.asrm.org/practice-guidance/practice-committee-documents/optimizing-natural-fertility-a-committee-opinion-2021/";
    }, {
        readonly title: "NIAAA: What is a standard drink?";
        readonly url: "https://www.niaaa.nih.gov/alcohols-effects-health/what-standard-drink";
    }];
}, {
    readonly id: "stress";
    readonly title: "Chronic stress";
    readonly evidence: "Mixed evidence";
    readonly summary: "Set the number of days with prolonged stress in a typical week in the example.";
    readonly mechanism: "Stress-related hormone signals can affect reproductive pathways. Human studies report variable associations with semen measures.";
    readonly timescale: "Prolonged exposure. This example represents a later sample.";
    readonly limits: "Association does not prove cause. A stressful day does not determine sperm quality. This scene shows an uncertain pathway.";
    readonly sources: readonly [{
        readonly title: "Effects of work and life stress on semen quality";
        readonly url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4382866/";
    }, {
        title: string;
        url: string;
    }];
}, {
    readonly id: "sleep";
    readonly title: "Disrupted sleep";
    readonly evidence: "Human association";
    readonly summary: "Set the number of nights with disrupted sleep in a typical week in the example.";
    readonly mechanism: "Sleep patterns relate to daily hormone rhythms. Observational studies report associations between disturbed sleep and some semen measures.";
    readonly timescale: "Habitual sleep patterns. This example represents a later sample.";
    readonly limits: "These associations do not prove cause. The model does not prescribe sleep hours or predict damage after a poor night.";
    readonly sources: readonly [{
        readonly title: "Sleep disturbances and semen quality in 953 young men";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/23568594/";
    }, {
        readonly title: "Sleep duration, quality, and semen quality";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/31830732/";
    }];
}, {
    readonly id: "heat";
    readonly title: "Prolonged heat";
    readonly evidence: "Established mechanism";
    readonly summary: "Set weekly hours of extra heat exposure in a repeated exposure scenario.";
    readonly mechanism: "Increased testicular temperature can disturb sperm production and function. This example changes the later cohort, not the current fluid temperature.";
    readonly timescale: "Sustained exposure, followed by delayed sample changes.";
    readonly limits: "The model does not measure temperature. Heat sources and individual responses differ. Normal warmth does not imply damage.";
    readonly sources: readonly [{
        title: string;
        url: string;
    }, {
        readonly title: "Scrotal heat stress and sperm chromatin damage in fertile men";
        readonly url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC4429437/";
    }];
}, {
    readonly id: "fever";
    readonly title: "Fever";
    readonly evidence: "Human association";
    readonly summary: "Set how many days a single fever episode lasts in the example.";
    readonly mechanism: "Fever can disrupt developing sperm. Changes in concentration, movement, and shape can appear after the illness.";
    readonly timescale: "Delayed effects over subsequent weeks. Recovery also takes time.";
    readonly limits: "Responses differ with the illness and its timing. This example does not set a recovery date or diagnose an infection.";
    readonly sources: readonly [{
        readonly title: "History of febrile illness and variation in semen quality";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/14507826/";
    }];
}, {
    readonly id: "metabolic";
    readonly title: "Obesity and metabolic health";
    readonly evidence: "Human association";
    readonly summary: "Choose a modeled level of metabolic stress during sperm development.";
    readonly mechanism: "Hormone balance, inflammation, and heat can differ with metabolic conditions. Population studies associate obesity with poorer semen measures.";
    readonly timescale: "Longer-term conditions. This example represents a later sample.";
    readonly limits: "Body size does not diagnose fertility. Individuals differ, and the scene does not assign a target weight or a fertility score.";
    readonly sources: readonly [{
        title: string;
        url: string;
    }, {
        readonly title: "Obesity, sperm DNA integrity, and mitochondrial activity";
        readonly url: "https://pubmed.ncbi.nlm.nih.gov/22300410/";
    }];
}, {
    readonly id: "androgens";
    readonly title: "Testosterone and anabolic steroids";
    readonly evidence: "Established mechanism";
    readonly summary: "Choose a modeled level of exposure to external androgens.";
    readonly mechanism: "External androgens suppress pituitary signals that support sperm production. A higher blood testosterone level does not guarantee more sperm.";
    readonly timescale: "Suppression and recovery develop over months. Individual timing differs.";
    readonly limits: "This scene does not give medication advice or a recovery schedule. Steroid-associated suppression differs from ordinary exercise.";
    readonly sources: readonly [{
        readonly title: "AUA and ASRM: Diagnosis and treatment of infertility in men";
        readonly url: "https://www.auanet.org/documents/Guidelines/PDF/Male-Infertility-Guideline.pdf";
    }, {
        title: string;
        url: string;
    }];
}, {
    readonly id: "pesticides";
    readonly title: "Certain pesticides";
    readonly evidence: "Human association";
    readonly summary: "Choose a modeled level of repeated exposure to one example class of chemicals.";
    readonly mechanism: "Some chemicals can disturb hormone signals or contribute to cellular stress. Effects depend on the substance and exposure.";
    readonly timescale: "Substance-specific exposure and sperm development. This example uses a later sample.";
    readonly limits: "Pesticides are not one substance. This scene is not an exposure calculator and does not represent all products.";
    readonly sources: readonly [{
        readonly title: "WHO: Factors in the diagnosis of male infertility";
        readonly url: "https://www.ncbi.nlm.nih.gov/books/NBK620433/figure/ch5.fig3/";
    }, {
        readonly title: "Pyrethroid metabolites, semen quality, and sperm DNA damage";
        readonly url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC2733825/";
    }];
}];
export declare function getFactor(id: FactorId): Factor;
