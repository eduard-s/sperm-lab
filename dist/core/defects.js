import { SLOW_SPEED_THRESHOLD } from "./constants.js";
export const MORPHOLOGY_SOURCES = [
    { title: "WHO: Laboratory manual for human semen, sixth edition", url: "https://www.who.int/publications/i/item/9789240030787" },
    { title: "Another look at human sperm morphology", url: "https://doi.org/10.1093/humrep/dev251" },
];
const movementSources = [MORPHOLOGY_SOURCES[0]];
const dnaSources = [{ title: "EAU: Sperm DNA fragmentation and separate semen measures", url: "https://uroweb.org/guidelines/sexual-and-reproductive-health/chapter/male-infertility" }];
/** Common teaching categories. These examples are not a complete clinical classification. */
export const DEFECT_CATALOG = [
    { id: "double-head", title: "Two heads", description: "Two heads share one connecting region in this example.", region: "head", sources: MORPHOLOGY_SOURCES },
    { id: "small-head", title: "Small head", description: "The head is smaller than the typical model outline.", region: "head", sources: MORPHOLOGY_SOURCES },
    { id: "large-head", title: "Large head", description: "The head is larger than the typical model outline.", region: "head", sources: MORPHOLOGY_SOURCES },
    { id: "tapered-head", title: "Tapered head", description: "The head narrows toward its tip.", region: "head", sources: MORPHOLOGY_SOURCES },
    { id: "round-head", title: "Round head", description: "The head has a round contour. The drawing does not determine acrosome function.", region: "head", sources: MORPHOLOGY_SOURCES },
    { id: "double-tail", title: "Two tails", description: "Two tail branches extend from one cell.", region: "tail", sources: MORPHOLOGY_SOURCES },
    { id: "triple-tail", title: "Three tails", description: "Three tail branches illustrate the multiple-tail category.", region: "tail", sources: MORPHOLOGY_SOURCES },
    { id: "bent-tail", title: "Bent tail", description: "The tail has an angular bend.", region: "tail", sources: MORPHOLOGY_SOURCES },
    { id: "coiled-tail", title: "Coiled tail", description: "The tail forms a tight curve or loop.", region: "tail", sources: MORPHOLOGY_SOURCES },
    { id: "short-tail", title: "Short tail", description: "The tail is shorter than the typical model tail.", region: "tail", sources: MORPHOLOGY_SOURCES },
    { id: "absent-tail", title: "Absent tail", description: "This example has an isolated head without an attached tail.", region: "tail", sources: MORPHOLOGY_SOURCES },
    { id: "bent-midpiece", title: "Bent midpiece", description: "The connecting region bends away from the head axis.", region: "midpiece", sources: MORPHOLOGY_SOURCES },
    { id: "thick-midpiece", title: "Thick midpiece", description: "The midpiece is wider than the typical model outline.", region: "midpiece", sources: MORPHOLOGY_SOURCES },
    { id: "midpiece-damage", title: "Midpiece damage", description: "A marker identifies model cellular injury. This trait differs from midpiece shape.", region: "midpiece", sources: [{ title: "Sperm energy pathways and mitochondrial function", url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3501448/" }] },
    { id: "dna-fragmentation", title: "DNA fragmentation", description: "Separated strand pieces mark model DNA damage. Their number is illustrative.", region: "dna", sources: dnaSources },
    { id: "slow", title: "Slow movement", description: "This cell has a low active speed in model units.", region: "movement", sources: movementSources },
    { id: "immotile", title: "Still, but alive", description: "This cell has no active movement and remains alive in the model.", region: "movement", sources: movementSources },
    { id: "nonprogressive", title: "Motion without progress", description: "This cell moves without a forward path.", region: "movement", sources: movementSources },
];
export function cellMatchesDefect(cell, id) {
    switch (id) {
        case "double-head": return cell.headCount === 2;
        case "small-head": return cell.headShape === "small";
        case "large-head": return cell.headShape === "large";
        case "tapered-head": return cell.headShape === "tapered";
        case "round-head": return cell.headShape === "round";
        case "double-tail": return cell.tailCount === 2;
        case "triple-tail": return cell.tailCount === 3;
        case "bent-tail": return cell.tailShape === "bent";
        case "coiled-tail": return cell.tailShape === "coiled";
        case "short-tail": return cell.tailShape === "short";
        case "absent-tail": return cell.tailCount === 0 || cell.tailShape === "absent";
        case "bent-midpiece": return cell.midpieceShape === "bent";
        case "thick-midpiece": return cell.midpieceShape === "thick";
        case "midpiece-damage": return cell.midpieceDamage;
        case "dna-fragmentation": return cell.dnaDamage && cell.dnaFragmentation > 0;
        case "slow": return cell.alive && cell.speed > 0 && cell.speed < SLOW_SPEED_THRESHOLD;
        case "immotile": return cell.alive && cell.speed === 0;
        case "nonprogressive": return cell.alive && cell.speed > 0 && !cell.progressive;
        default: throw new RangeError(`Unknown defect: ${String(id)}`);
    }
}
export function getDefectCounts(world) {
    return Object.fromEntries(DEFECT_CATALOG.map(defect => [defect.id, world.cells.filter(cell => cellMatchesDefect(cell, defect.id)).length]));
}
export function getCellDefects(cell) {
    return DEFECT_CATALOG.filter(defect => cellMatchesDefect(cell, defect.id));
}
