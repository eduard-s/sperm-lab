import test from "node:test";
import assert from "node:assert/strict";
import { FACTORS, getFactor, createSimulation, createChallengeSimulation, stepSimulation, getMetrics, getTailPoints, findCell } from "../dist/core/index.js";

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
  assert.ok(first.every(point => Math.hypot(point.x - cell.x, point.y - cell.y) < .12));
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
