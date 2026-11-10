import test from "node:test";
import assert from "node:assert/strict";
import { FACTORS, ANATOMY_SOURCES, DEFECT_CATALOG, MORPHOLOGY_SOURCES, cellMatchesDefect, getDefectCounts, getCellDefects, getFactor, createSimulation, createChallengeSimulation, createDefectSimulation, resolveFactors, getActiveFactors, isSlow, SLOW_SPEED_THRESHOLD, stepSimulation, getMetrics, getTailPoints, findCell } from "../dist/core/index.js";

test("the public catalog contains all 12 distinct sourced factors", () => {
  assert.equal(FACTORS.length, 12);
  assert.equal(new Set(FACTORS.map(factor => factor.id)).size, 12);
  for (const factor of FACTORS) {
    assert.equal(getFactor(factor.id), factor);
    for (const field of ["title", "summary", "mechanism", "timescale", "evidence", "limits"]) assert.ok(factor[field].length > 0);
    assert.ok(factor.sources.length > 0);
    for (const source of factor.sources) assert.equal(new URL(source.url).protocol, "https:");
  }
  for (const id of ["endurance", "cycling", "stress"]) assert.equal(getFactor(id).evidence, "Mixed evidence");
  assert.throws(() => getFactor("unknown"), RangeError);
});

test("samples are deterministic without browser or React globals", () => {
  const options = { seed: 800, count: 64, factor: "smoking", progress: .8 };
  assert.deepEqual(createSimulation(options), createSimulation(options));
  assert.notDeepEqual(createSimulation({ seed: 1 }).cells, createSimulation({ seed: 2 }).cells);
  assert.equal(createSimulation().model, "fictional-teaching-sample");
});

test("zero progress or zero intensity keeps the paired baseline cells identical", () => {
  const baseline = createSimulation({ seed: 42, count: 64 });
  for (const factor of FACTORS) {
    assert.deepEqual(createSimulation({ seed: 42, count: 64, factor: factor.id, progress: 0 }).cells, baseline.cells);
    assert.deepEqual(createSimulation({ seed: 42, count: 64, factor: factor.id, intensity: 0 }).cells, baseline.cells);
  }
});

test("all later scenarios remain bounded and use integer specimen counts", () => {
  for (const factor of FACTORS) {
    const world = createSimulation({ seed: 8, count: 80, factor: factor.id });
    assert.ok(world.cells.length > 0 && world.cells.length <= 160);
    for (const cell of world.cells) {
      assert.ok(cell.x >= 0 && cell.x <= 1 && cell.y >= 0 && cell.y <= 1);
      assert.ok(cell.speed >= 0 && cell.speed < .1);
      assert.ok(cell.alive || cell.speed === 0);
      assert.ok(!cell.progressive || cell.speed > 0);
    }
    const metrics = getMetrics(world);
    for (const value of Object.values(metrics)) assert.ok(Number.isInteger(value) && value >= 0 && value <= metrics.total);
    assert.ok(metrics.progressive <= metrics.motile && metrics.motile <= metrics.alive);
  }
});

test("scenario coefficients illustrate production suppression without deleting a whole spatial region", () => {
  const world = createSimulation({ seed: 42, count: 100, factor: "androgens" });
  assert.ok(world.cells.length < 100);
  assert.ok(world.cells.some(cell => cell.x < .5) && world.cells.some(cell => cell.x > .5));
  assert.ok(world.cells.some(cell => cell.y < .5) && world.cells.some(cell => cell.y > .5));
});

test("androgens affect the fictional cohort size without adding survivor defects", () => {
  const baseline = createSimulation({ seed: 42, count: 100 });
  const later = createSimulation({ seed: 42, count: 100, factor: "androgens" });
  assert.deepEqual(later.cells, baseline.cells.slice(0, later.cells.length));
});

test("uncertain lifestyle examples do not infer DNA damage or death", () => {
  const baseline = createSimulation({ seed: 42, count: 100 });
  for (const factor of ["exercise", "endurance", "cycling", "stress", "sleep", "alcohol", "fever"]) {
    const later = createSimulation({ seed: 42, count: 100, factor });
    for (const cell of later.cells) {
      const before = baseline.cells.find(item => item.id === cell.id);
      if (before) {
        assert.equal(cell.alive, before.alive);
        assert.equal(cell.dnaDamage, before.dnaDamage);
      }
    }
  }
});

test("invalid options cannot introduce unbounded counts or nonfinite positions", () => {
  assert.equal(createSimulation({ count: Infinity }).cells.length, 48);
  assert.equal(createSimulation({ count: -100 }).cells.length, 1);
  assert.equal(createSimulation({ count: 10000 }).cells.length, 160);
  const world = createSimulation({ seed: NaN, progress: -20, intensity: 500 });
  assert.equal(world.progress, 0);
  assert.equal(world.intensity, 1);
  assert.throws(() => createSimulation({ factor: "unknown" }), RangeError);
});

test("motion preserves biology and remains finite under long current exposure", () => {
  const world = createSimulation({ count: 96, factor: "heat" });
  const biology = world.cells.map(cell => [cell.id, cell.alive, cell.morphology, cell.dnaDamage, cell.speed, cell.progressive]);
  for (let frame = 0; frame < 3600; frame++) stepSimulation(world, 1 / 60, { x: .5, y: .5, dx: 100, dy: -100, strength: 100 });
  assert.deepEqual(world.cells.map(cell => [cell.id, cell.alive, cell.morphology, cell.dnaDamage, cell.speed, cell.progressive]), biology);
  for (const cell of world.cells) {
    assert.ok(Number.isFinite(cell.x) && Number.isFinite(cell.y) && Number.isFinite(cell.angle));
    assert.ok(cell.x >= .015 && cell.x <= .985 && cell.y >= .015 && cell.y <= .985);
    assert.ok(cell.trail.length <= 28);
  }
});

test("invalid or nonpositive time steps are inert and large steps are capped", () => {
  const world = createSimulation();
  const initial = structuredClone(world);
  for (const dt of [0, -1, NaN, Infinity]) stepSimulation(world, dt);
  assert.deepEqual(world, initial);
  stepSimulation(world, 2000);
  assert.equal(world.time, .05);
  stepSimulation(world, .02, { x: NaN, y: .5, dx: 2, dy: 2, strength: 1 });
  assert.ok(world.cells.every(cell => Number.isFinite(cell.x) && Number.isFinite(cell.y)));
});

test("identical paired samples respond to the same current identically", () => {
  const a = createSimulation({ seed: 9 });
  const b = createSimulation({ seed: 9, factor: "fever", progress: 0 });
  for (let frame = 0; frame < 120; frame++) {
    const flow = { x: .5, y: .5, dx: .02, dy: -.04, strength: 1 };
    stepSimulation(a, 1 / 60, flow);
    stepSimulation(b, 1 / 60, flow);
  }
  assert.deepEqual(a.cells, b.cells);
});

test("movement, vitality, shape and DNA describe separate properties", () => {
  const world = createSimulation({ seed: 123, count: 160 });
  assert.ok(world.cells.some(cell => cell.alive && cell.speed === 0));
  assert.ok(world.cells.some(cell => cell.alive && cell.speed > 0 && !cell.progressive));
  assert.ok(world.cells.some(cell => cell.alive && cell.speed > 0 && cell.morphology === "typical" && cell.dnaDamage));
  assert.ok(world.cells.some(cell => !cell.alive));
});

test("discovery fixtures have one guaranteed target and identify their prepared status", () => {
  for (const kind of ["hidden-dna", "immotile-alive", "circling"]) {
    const world = createChallengeSimulation(kind);
    assert.equal(world.fixture, kind);
    const matches = world.cells.filter(cell => kind === "hidden-dna" ? cell.dnaDamage : kind === "immotile-alive" ? cell.alive && cell.speed === 0 : cell.speed > 0 && !cell.progressive);
    assert.equal(matches.length, 1);
    assert.equal(matches[0].id, 0);
    if (kind === "hidden-dna") assert.ok(matches[0].progressive && matches[0].morphology === "typical");
  }
  assert.throws(() => createChallengeSimulation("unknown"), RangeError);
});

test("immotile cells can drift passively in fluid without becoming motile", () => {
  const world = createChallengeSimulation("immotile-alive");
  const target = world.cells[0];
  const before = target.x;
  stepSimulation(world, .05, { x: target.x, y: target.y, dx: .1, dy: 0, strength: 1 });
  assert.notEqual(target.x, before);
  assert.equal(target.speed, 0);
  assert.equal(target.alive, true);
});

test("tail geometry animates without changing cell state", () => {
  const cell = createChallengeSimulation("hidden-dna").cells[0];
  const original = structuredClone(cell);
  const first = getTailPoints(cell, 0);
  assert.equal(first.length, 21);
  assert.notDeepEqual(first, getTailPoints(cell, .07));
  assert.deepEqual(cell, original);
  assert.ok(first.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  assert.ok(first.every(point => Math.hypot(point.x - cell.x, point.y - cell.y) < .22));
});

test("hit detection selects nearby cells and rejects invalid coordinates", () => {
  const world = createSimulation({ count: 1 });
  const cell = world.cells[0];
  assert.equal(findCell(world, cell.x, cell.y), cell);
  assert.equal(findCell(world, cell.x + .01, cell.y), cell);
  assert.equal(findCell(world, 20, 20), undefined);
  assert.equal(findCell(world, NaN, cell.y), undefined);
  assert.equal(findCell(world, cell.x, cell.y, -1), undefined);
});

test("all independent controls resolve to a finite complete settings object", () => {
  const settings = resolveFactors({ heat: Infinity, smoking: .6, alcohol: -4, exercise: 5, sleep: NaN });
  assert.equal(Object.keys(settings).length, 12);
  assert.equal(settings.heat, 0);
  assert.equal(settings.smoking, .6);
  assert.equal(settings.alcohol, 0);
  assert.equal(settings.exercise, 1);
  assert.equal(settings.sleep, 0);
  assert.equal(settings.fever, 0);
  assert.throws(() => resolveFactors({ imaginary: 1 }), RangeError);
  assert.throws(() => resolveFactors(null), TypeError);
  assert.throws(() => resolveFactors([]), TypeError);
});

test("empty independent settings override the legacy factor and preserve an unchanged cohort", () => {
  const baseline = createSimulation({ seed: 75, count: 64 });
  const independent = createSimulation({ seed: 75, count: 64, factor: "heat", intensity: 1, factors: {} });
  assert.deepEqual(independent.cells, baseline.cells);
  assert.equal(independent.factor, undefined);
  assert.deepEqual(getActiveFactors(independent), []);
  assert.equal(getActiveFactors(createSimulation({ factors: { sleep: .2, heat: .7 } })).length, 2);
});

test("one independent control matches its legacy single-factor counterpart", () => {
  for (const factor of FACTORS) {
    const old = createSimulation({ seed: 10, count: 80, factor: factor.id, intensity: .6, progress: .75 });
    const current = createSimulation({ seed: 10, count: 80, factors: { [factor.id]: .6 }, progress: .75 });
    assert.deepEqual(current.cells, old.cells);
    assert.deepEqual(current.factors, old.factors);
  }
});

test("factor composition is independent of property order and ignores legacy intensity", () => {
  const settings = Object.fromEntries(FACTORS.map((factor, index) => [factor.id, (index + 1) / 12]));
  const reversed = Object.fromEntries(Object.entries(settings).reverse());
  const a = createSimulation({ seed: 9, count: 120, factors: settings, intensity: 0 });
  const b = createSimulation({ seed: 9, count: 120, factors: reversed, intensity: 1 });
  assert.deepEqual(a.cells, b.cells);
  assert.deepEqual(a.factors, b.factors);
});

test("every combination of the twelve controls produces a bounded teaching sample", () => {
  for (let mask = 0; mask < 2 ** FACTORS.length; mask++) {
    const factors = Object.fromEntries(FACTORS.map((factor, index) => [factor.id, mask & 1 << index ? 1 : 0]));
    const world = createSimulation({ seed: mask, count: 40, factors });
    const metrics = getMetrics(world);
    assert.ok(metrics.total >= 1 && metrics.total <= 160);
    for (const value of Object.values(metrics)) assert.ok(Number.isInteger(value) && value >= 0 && value <= metrics.total);
    for (const cell of world.cells) assert.ok(Number.isFinite(cell.speed) && cell.speed >= 0 && cell.speed <= .07);
    assert.equal(metrics.immotile + metrics.motile, metrics.total);
    assert.equal(metrics.nonprogressive + metrics.progressive, metrics.motile);
  }
});

test("zero development progress keeps every enabled factor at the unchanged sample", () => {
  const factors = Object.fromEntries(FACTORS.map(factor => [factor.id, 1]));
  const baseline = createSimulation({ seed: 11, count: 96 });
  assert.deepEqual(createSimulation({ seed: 11, count: 96, factors, progress: 0 }).cells, baseline.cells);
});

test("exercise cannot cancel androgen-associated production suppression", () => {
  const baseline = createSimulation({ count: 100 });
  const androgens = createSimulation({ count: 100, factors: { androgens: 1 } });
  const combined = createSimulation({ count: 100, factors: { androgens: 1, exercise: 1 } });
  assert.ok(combined.cells.length < baseline.cells.length / 2);
  assert.ok(combined.cells.length >= androgens.cells.length);
  assert.deepEqual(combined.cells, baseline.cells.slice(0, combined.cells.length));
});

test("uncertain factors together cannot create DNA lesions or nonviability", () => {
  const baseline = createSimulation({ seed: 21, count: 120 });
  const combined = createSimulation({ seed: 21, count: 120, factors: { endurance: 1, cycling: 1, stress: 1, sleep: 1, alcohol: 1, fever: 1 } });
  for (const cell of combined.cells) {
    assert.equal(cell.alive, baseline.cells[cell.id].alive);
    assert.equal(cell.dnaDamage, baseline.cells[cell.id].dnaDamage);
  }
});

test("developmental head and tail counts never depend on lifestyle controls", () => {
  const baseline = createSimulation({ seed: 60, count: 100 });
  for (const factor of FACTORS) {
    const changed = createSimulation({ seed: 60, count: 100, factors: { [factor.id]: 1 } });
    for (const cell of changed.cells) {
      const original = baseline.cells[cell.id];
      if (original) {
        assert.equal(cell.headCount, original.headCount);
        assert.equal(cell.tailCount, original.tailCount);
      }
    }
  }
});

test("prepared anatomy samples guarantee visible independent traits for every seed", () => {
  for (const seed of [0, 1, 42, 90, 4444]) {
    const world = createDefectSimulation({ seed, count: 1 });
    assert.equal(world.fixture, "defect-examples");
    assert.equal(world.cells.length, 18);
    assert.equal(world.teachingPopulation, true);
    assert.equal(getActiveFactors(world).length, 0);
    for (const defect of DEFECT_CATALOG) {
      const specimen = world.cells.find(cell => cell.example === defect.id);
      assert.ok(specimen, `${defect.id} needs a discoverable example`);
      assert.ok(cellMatchesDefect(specimen, defect.id));
      assert.ok(getCellDefects(specimen).some(item => item.id === defect.id));
    }
    const dnaExample = world.cells.find(cell => cell.example === "dna-fragmentation");
    assert.ok(dnaExample.dnaDamage && dnaExample.dnaFragmentation >= 3);
    assert.ok(isSlow(world.cells.find(cell => cell.example === "slow")));
    const metrics = getMetrics(world);
    assert.ok(metrics.multiHead >= 1);
    assert.ok(metrics.multiTail >= 2);
    assert.ok(metrics.midpieceDamaged >= 1);
    assert.ok(metrics.dnaDamaged >= 1);
    assert.ok(metrics.immotile >= 2);
    assert.ok(metrics.nonprogressive >= 1);
  }
  assert.equal(SLOW_SPEED_THRESHOLD, .035);
  assert.ok(ANATOMY_SOURCES.some(source => source.url.startsWith("https://www.who.int/")));
});

test("two tails have distinct finite geometry, with no mutation during a motion step", () => {
  const world = createDefectSimulation({ count: 20 });
  const cell = world.cells.find(cell => cell.example === "double-tail");
  const first = getTailPoints(cell, 0, 0), second = getTailPoints(cell, 0, 1);
  assert.notDeepEqual(first, second);
  assert.ok(second.every(point => Number.isFinite(point.x) && Number.isFinite(point.y)));
  const biology = world.cells.map(cell => [cell.headCount, cell.tailCount, cell.headShape, cell.tailShape, cell.midpieceShape, cell.headDefect, cell.tailDefect, cell.midpieceDamage, cell.dnaDamage, cell.dnaFragmentation, cell.alive]);
  for (let frame = 0; frame < 100; frame++) stepSimulation(world, 1 / 60);
  assert.deepEqual(world.cells.map(cell => [cell.headCount, cell.tailCount, cell.headShape, cell.tailShape, cell.midpieceShape, cell.headDefect, cell.tailDefect, cell.midpieceDamage, cell.dnaDamage, cell.dnaFragmentation, cell.alive]), biology);
});

test("tail motion keeps its short proximal section straight and attached", () => {
  const cell = createChallengeSimulation("hidden-dna").cells[0];
  const first = getTailPoints(cell, 0);
  const later = getTailPoints(cell, .13);
  assert.deepEqual(first.slice(0, 3), later.slice(0, 3));
  assert.notDeepEqual(first.slice(3), later.slice(3));
  assert.ok(Math.abs(Math.hypot(first[0].x - cell.x, first[0].y - cell.y) - .009) < 1e-10);
  for (let index = 1; index < 3; index++) {
    const cross = (first[index].x - first[0].x) * Math.sin(cell.angle) - (first[index].y - first[0].y) * Math.cos(cell.angle);
    assert.ok(Math.abs(cross) < 1e-10);
  }
});

test("the common teaching catalog has distinct sourced categories without a complete-classification claim", () => {
  assert.equal(DEFECT_CATALOG.length, 18);
  assert.equal(new Set(DEFECT_CATALOG.map(defect => defect.id)).size, 18);
  assert.ok(MORPHOLOGY_SOURCES.some(source => source.url.startsWith("https://www.who.int/")));
  for (const defect of DEFECT_CATALOG) {
    assert.ok(defect.title && defect.description && defect.sources.length > 0);
    for (const source of defect.sources) assert.equal(new URL(source.url).protocol, "https:");
  }
  assert.throws(() => cellMatchesDefect(createSimulation({ count: 1 }).cells[0], "unknown"), RangeError);
});

test("all 18 categories remain discoverable across every combination of the 12 controls", () => {
  for (let mask = 0; mask < 2 ** FACTORS.length; mask++) {
    const factors = Object.fromEntries(FACTORS.map((factor, index) => [factor.id, mask & 1 << index ? 1 : 0]));
    const world = createSimulation({ seed: mask, count: 48, factors, teachingPopulation: true });
    assert.ok(world.cells.length >= 18 && world.cells.length <= 160);
    const counts = getDefectCounts(world);
    for (const defect of DEFECT_CATALOG) assert.ok(counts[defect.id] > 0, `${defect.id} missing for factor mask ${mask}`);
    for (const cell of world.cells) {
      assert.equal(cell.dnaDamage, cell.dnaFragmentation > 0);
      assert.ok([0, 3, 4, 5, 6].includes(cell.dnaFragmentation));
      assert.equal(cell.headDefect, cell.headCount > 1 || cell.headShape !== "typical");
      assert.equal(cell.tailDefect, cell.tailCount !== 1 || cell.tailShape !== "typical");
      if (cell.tailCount === 0) assert.ok(cell.speed === 0 && cell.beat === 0 && !cell.progressive);
    }
  }
});

test("pinned categories remain available while their other traits respond to the controls", () => {
  const baseline = createSimulation({ seed: 42, count: 100, teachingPopulation: true });
  const affected = createSimulation({ seed: 42, count: 100, teachingPopulation: true, factors: { smoking: .8, heat: .6 } });
  assert.ok(affected.cells.length < baseline.cells.length);
  for (const defect of DEFECT_CATALOG) {
    assert.ok(cellMatchesDefect(baseline.cells.find(cell => cell.example === defect.id), defect.id));
    assert.ok(cellMatchesDefect(affected.cells.find(cell => cell.example === defect.id), defect.id));
  }
  const responsiveTraits = cell => [cell.dnaDamage, cell.dnaFragmentation, cell.midpieceDamage, cell.speed, cell.progressive];
  assert.notDeepEqual(affected.cells.slice(0, 18).map(responsiveTraits), baseline.cells.slice(0, 18).map(responsiveTraits));
  assert.notDeepEqual(affected.cells.slice(20).map(responsiveTraits), baseline.cells.slice(20, affected.cells.length).map(responsiveTraits));
  assert.equal(createSimulation({ count: 1 }).cells.length, 1);
  assert.equal(createSimulation({ count: 1, teachingPopulation: true }).cells.length, 18);
  assert.equal(createSimulation().teachingPopulation, false);
});

test("factor effects remain visible at the minimum teaching count", () => {
  const first = createSimulation({ seed: 42, count: 48, teachingPopulation: true, factors: { androgens: 1 } });
  const second = createSimulation({ seed: 42, count: 48, teachingPopulation: true, factors: { androgens: 1, heat: 1, smoking: 1 } });
  assert.equal(first.cells.length, 18);
  assert.equal(second.cells.length, 18);
  assert.ok(getMetrics(second).dnaDamaged > getMetrics(first).dnaDamaged);
  assert.ok(getMetrics(second).motile < getMetrics(first).motile);
  assert.ok(second.cells.find(cell => cell.example === "dna-fragmentation").dnaFragmentation > first.cells.find(cell => cell.example === "dna-fragmentation").dnaFragmentation);
  for (const world of [first, second]) for (const count of Object.values(getDefectCounts(world))) assert.ok(count > 0);
});

test("named developmental forms do not receive specific lifestyle causes", () => {
  const baseline = createSimulation({ seed: 16, count: 160 });
  for (const factor of FACTORS) {
    const later = createSimulation({ seed: 16, count: 160, factors: { [factor.id]: 1 } });
    for (const cell of later.cells) {
      const before = baseline.cells[cell.id];
      if (!before) continue;
      if (["small", "large", "tapered", "round"].includes(before.headShape)) assert.equal(cell.headShape, before.headShape);
      if (["bent", "coiled", "short", "absent"].includes(before.tailShape)) assert.equal(cell.tailShape, before.tailShape);
      assert.equal(cell.midpieceShape, before.midpieceShape);
    }
  }
});

test("multiple, short, coiled, and absent tails have distinct bounded geometry", () => {
  const world = createDefectSimulation({ count: 18 });
  const find = id => world.cells.find(cell => cell.example === id);
  const triple = find("triple-tail");
  const branches = [0, 1, 2].map(index => getTailPoints(triple, .1, index));
  assert.notDeepEqual(branches[0], branches[1]);
  assert.notDeepEqual(branches[1], branches[2]);
  assert.notDeepEqual(branches[0], branches[2]);
  assert.deepEqual(getTailPoints(find("absent-tail"), 0), []);
  const reach = cell => Math.max(...getTailPoints(cell, 0).map(point => Math.hypot(point.x - cell.x, point.y - cell.y)));
  assert.ok(reach(find("short-tail")) < reach(find("dna-fragmentation")) / 2);
  assert.ok(reach(find("coiled-tail")) < reach(find("dna-fragmentation")) / 2);
  for (const cell of world.cells) for (let index = 0; index < cell.tailCount; index++) {
    for (const point of getTailPoints(cell, .2, index)) {
      assert.ok(Number.isFinite(point.x) && Number.isFinite(point.y));
      assert.ok(Math.hypot(point.x - cell.x, point.y - cell.y) < .22);
    }
  }
});

test("legacy challenge fixtures keep fragmentation and absent-tail invariants consistent", () => {
  for (const kind of ["hidden-dna", "immotile-alive", "circling"]) {
    const world = createChallengeSimulation(kind, { count: 160 });
    for (const cell of world.cells) {
      assert.equal(cell.dnaDamage, cell.dnaFragmentation > 0);
      assert.equal(cell.headDefect, cell.headCount > 1 || cell.headShape !== "typical");
      assert.equal(cell.tailDefect, cell.tailCount !== 1 || cell.tailShape !== "typical");
      if (cell.tailCount === 0) assert.ok(cell.speed === 0 && cell.beat === 0 && !cell.progressive);
    }
  }
});
