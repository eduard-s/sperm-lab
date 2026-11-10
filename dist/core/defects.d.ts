import type { Defect, DefectId, Simulation, SpermCell } from "./types.js";
export declare const MORPHOLOGY_SOURCES: readonly [{
    readonly title: "WHO: Laboratory manual for human semen, sixth edition";
    readonly url: "https://www.who.int/publications/i/item/9789240030787";
}, {
    readonly title: "Another look at human sperm morphology";
    readonly url: "https://doi.org/10.1093/humrep/dev251";
}];
/** Common teaching categories. These examples are not a complete clinical classification. */
export declare const DEFECT_CATALOG: readonly [{
    readonly id: "double-head";
    readonly title: "Two heads";
    readonly description: "Two heads share one connecting region in this example.";
    readonly region: "head";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "small-head";
    readonly title: "Small head";
    readonly description: "The head is smaller than the typical model outline.";
    readonly region: "head";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "large-head";
    readonly title: "Large head";
    readonly description: "The head is larger than the typical model outline.";
    readonly region: "head";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "tapered-head";
    readonly title: "Tapered head";
    readonly description: "The head narrows toward its tip.";
    readonly region: "head";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "round-head";
    readonly title: "Round head";
    readonly description: "The head has a round contour. The drawing does not determine acrosome function.";
    readonly region: "head";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "double-tail";
    readonly title: "Two tails";
    readonly description: "Two tail branches extend from one cell.";
    readonly region: "tail";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "triple-tail";
    readonly title: "Three tails";
    readonly description: "Three tail branches illustrate the multiple-tail category.";
    readonly region: "tail";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "bent-tail";
    readonly title: "Bent tail";
    readonly description: "The tail has an angular bend.";
    readonly region: "tail";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "coiled-tail";
    readonly title: "Coiled tail";
    readonly description: "The tail forms a tight curve or loop.";
    readonly region: "tail";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "short-tail";
    readonly title: "Short tail";
    readonly description: "The tail is shorter than the typical model tail.";
    readonly region: "tail";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "absent-tail";
    readonly title: "Absent tail";
    readonly description: "This example has an isolated head without an attached tail.";
    readonly region: "tail";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "bent-midpiece";
    readonly title: "Bent midpiece";
    readonly description: "The connecting region bends away from the head axis.";
    readonly region: "midpiece";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "thick-midpiece";
    readonly title: "Thick midpiece";
    readonly description: "The midpiece is wider than the typical model outline.";
    readonly region: "midpiece";
    readonly sources: readonly [{
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }, {
        readonly title: "Another look at human sperm morphology";
        readonly url: "https://doi.org/10.1093/humrep/dev251";
    }];
}, {
    readonly id: "midpiece-damage";
    readonly title: "Midpiece damage";
    readonly description: "A marker identifies model cellular injury. This trait differs from midpiece shape.";
    readonly region: "midpiece";
    readonly sources: readonly [{
        readonly title: "Sperm energy pathways and mitochondrial function";
        readonly url: "https://pmc.ncbi.nlm.nih.gov/articles/PMC3501448/";
    }];
}, {
    readonly id: "dna-fragmentation";
    readonly title: "DNA fragmentation";
    readonly description: "Separated strand pieces mark model DNA damage. Their number is illustrative.";
    readonly region: "dna";
    readonly sources: {
        title: string;
        url: string;
    }[];
}, {
    readonly id: "slow";
    readonly title: "Slow movement";
    readonly description: "This cell has a low active speed in model units.";
    readonly region: "movement";
    readonly sources: {
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }[];
}, {
    readonly id: "immotile";
    readonly title: "Still, but alive";
    readonly description: "This cell has no active movement and remains alive in the model.";
    readonly region: "movement";
    readonly sources: {
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }[];
}, {
    readonly id: "nonprogressive";
    readonly title: "Motion without progress";
    readonly description: "This cell moves without a forward path.";
    readonly region: "movement";
    readonly sources: {
        readonly title: "WHO: Laboratory manual for human semen, sixth edition";
        readonly url: "https://www.who.int/publications/i/item/9789240030787";
    }[];
}];
export declare function cellMatchesDefect(cell: SpermCell, id: DefectId): boolean;
export declare function getDefectCounts(world: Simulation): Record<DefectId, number>;
export declare function getCellDefects(cell: SpermCell): Defect[];
