import test from "node:test";
import assert from "node:assert/strict";
import { createDefectSimulation, cellMatchesDefect } from "../dist/core/index.js";
import { paintSimulation, getCellAnchor, getCellGeometry, hitTestCell } from "../dist/react/renderer.js";

const palette = { ink: "#303832", sage: "#6f897c", clay: "#a67769", accent: "#785448", damage: "#b82735", paper: "#eff2ed" };

function recordCanvas() {
  const calls = [], stack = [];
  const context = { strokeStyle: "", fillStyle: "", lineWidth: 1, globalAlpha: 1, clipDepth: 0, path: [] };
  const methods = {
    clearRect() {}, translate() {}, rotate() {}, setLineDash() {}, fillRect() {},
    save() { stack.push({ strokeStyle: context.strokeStyle, fillStyle: context.fillStyle, lineWidth: context.lineWidth, globalAlpha: context.globalAlpha, clipDepth: context.clipDepth }); },
    restore() { Object.assign(context, stack.pop()); },
    beginPath() { context.path = []; },
    closePath() {},
    moveTo(...args) { context.path.push(["move", ...args]); },
    lineTo(...args) { context.path.push(["line", ...args]); },
    quadraticCurveTo(...args) { context.path.push(["quadratic", ...args]); },
    bezierCurveTo(...args) { context.path.push(["bezier", ...args]); },
    ellipse(...args) { context.path.push(["ellipse", ...args]); },
    arc(...args) { context.path.push(["arc", ...args]); },
    clip() { context.clipDepth++; },
    stroke() { calls.push({ kind: "stroke", color: context.strokeStyle, lineWidth: context.lineWidth, alpha: context.globalAlpha, clipDepth: context.clipDepth, path: [...context.path] }); },
    fill() { calls.push({ kind: "fill", color: context.fillStyle, clipDepth: context.clipDepth, path: [...context.path] }); },
  };
  Object.assign(context, methods);
  return { context, calls };
}

function drawExample(id, dna = true, width = 640, height = 420, edit) {
  const world = createDefectSimulation({ count: 24 });
  const cell = structuredClone(world.cells.find(item => item.example === id && cellMatchesDefect(item, id)));
  assert(cell, `The ${id} example must exist.`);
  cell.x = .7; cell.y = .5; cell.angle = 0;
  edit?.(cell);
  const recorded = recordCanvas();
  const sample = { ...world, cells: [cell] };
  paintSimulation(recorded.context, sample, width, height, palette, { trails: false, dna, selected: null });
  return { ...recorded, cell, world: sample };
}

test("multiple tails use the semantic red color", () => {
  for (const id of ["double-tail", "triple-tail"]) {
    const { calls } = drawExample(id);
    assert(calls.filter(call => call.kind === "stroke" && call.clipDepth === 0 && call.color === palette.damage).length >= 3, `${id} branches need visible red strokes.`);
  }
});

test("DNA fragmentation draws separate red strand pieces inside the head", () => {
  const { calls, cell } = drawExample("dna-fragmentation");
  const fragments = calls.filter(call => call.kind === "stroke" && call.clipDepth > 0 && call.color === palette.damage);
  assert.equal(fragments.length, cell.dnaFragmentation * cell.headCount);
  assert(fragments.every(call => call.path.some(segment => segment[0] === "move") && call.path.some(segment => segment[0] === "quadratic")));
  const hidden = drawExample("dna-fragmentation", false);
  assert.equal(hidden.calls.filter(call => call.kind === "stroke" && call.clipDepth > 0 && call.color === palette.damage).length, 0);
});

test("unselected DNA fragments remain bright, separated strand strokes in every head shape", () => {
  for (const headShape of ["typical", "small", "large", "tapered", "round", "irregular"]) {
    const { calls } = drawExample("dna-fragmentation", true, 300, 420, cell => { cell.headCount = 1; cell.headShape = headShape; cell.dnaDamage = true; cell.dnaFragmentation = 6; });
    const fragments = calls.filter(call => call.kind === "stroke" && call.clipDepth > 0 && call.color === palette.damage);
    assert.equal(fragments.length, 6);
    assert(fragments.every(call => call.lineWidth >= 1.4 && call.alpha >= .95));
    const starts = fragments.map(call => call.path.find(part => part[0] === "move").slice(1).join(","));
    assert.equal(new Set(starts).size, 6);
    for (const fragment of fragments) {
      const first = fragment.path.find(part => part[0] === "move");
      const end = fragment.path.find(part => part[0] === "quadratic");
      assert(Math.hypot(end[3] - first[1], end[4] - first[2]) >= 2, "DNA markers need strand length rather than dot geometry.");
    }
  }
});

test("midpiece injury colors the complete short sleeve red without a barrel", () => {
  const { calls } = drawExample("midpiece-damage", true, 640, 420, cell => { cell.tailCount = 1; cell.tailShape = "typical"; cell.midpieceShape = "typical"; cell.midpieceDamage = true; });
  const sleeve = calls.find(call => call.kind === "stroke" && call.color === palette.damage && call.path.filter(part => part[0] === "line").length === 12);
  assert(sleeve, "The entire injured midpiece needs the damage color.");
  assert(sleeve.lineWidth >= 2.5 && sleeve.lineWidth <= 3.5);
  assert(sleeve.alpha >= .95);
  const from = sleeve.path[0], end = sleeve.path.at(-1);
  assert(Math.hypot(end[1] - from[1], end[2] - from[2]) < 22);
});

test("cell outlines keep one isotropic scale in wide and narrow fields", () => {
  const cell = drawExample("dna-fragmentation", true, 640, 420, cell => { cell.headCount = 1; cell.headShape = "typical"; cell.tailCount = 1; cell.tailShape = "typical"; cell.midpieceShape = "typical"; cell.tailDefect = false; }).cell;
  const proportions = [];
  for (const [width, height] of [[300, 420], [420, 300], [1000, 600]]) {
    const geometry = getCellGeometry(cell, 0, width, height);
    proportions.push(geometry.headRx / geometry.headRy);
    assert(geometry.headRx * 2 >= 20 && geometry.headRx * 2 <= 26);
    const tailReach = Math.max(...geometry.tails[0].map(point => Math.hypot(point.x - geometry.anchor.x, point.y - geometry.anchor.y)));
    assert(tailReach >= 145 && tailReach <= 195);
    assert.deepEqual(geometry.anchor, getCellAnchor(cell, width, height));
  }
  assert(proportions.every(ratio => Math.abs(ratio - proportions[0]) < 1e-12));
});

test("hit detection reaches every head, midpiece, and live tail branch", () => {
  for (const id of ["double-head", "double-tail", "triple-tail", "bent-tail", "coiled-tail", "short-tail", "bent-midpiece", "absent-tail"]) {
    const { cell, world } = drawExample(id);
    const geometry = getCellGeometry(cell, world.time, 640, 420);
    for (const head of geometry.heads) assert.equal(hitTestCell(world, head.center.x, head.center.y, 640, 420), cell);
    if (geometry.midpiece.length) {
      const point = geometry.midpiece[6];
      assert.equal(hitTestCell(world, point.x, point.y, 640, 420), cell);
    }
    for (const tail of geometry.tails) {
      const point = tail[14];
      assert.equal(hitTestCell(world, point.x, point.y, 640, 420), cell, `${id} must respond to a click on its tail.`);
    }
  }
});

test("hit detection rejects empty space and follows the animated tail geometry", () => {
  const { cell, world } = drawExample("triple-tail");
  world.time = .23;
  const point = getCellGeometry(cell, world.time, 640, 420).tails[2][16];
  assert.equal(hitTestCell(world, point.x, point.y, 640, 420), cell);
  assert.equal(hitTestCell(world, 10, 10, 640, 420), undefined);
  assert.equal(hitTestCell(world, NaN, 10, 640, 420), undefined);
  assert.equal(hitTestCell(world, 10, 10, 0, 420), undefined);
  assert.equal(hitTestCell(world, -1, 10, 640, 420), undefined);
  assert.equal(hitTestCell(world, 10, 10, 640, 420, -1), undefined);
  const front = { ...cell, id: 999 };
  assert.equal(hitTestCell({ ...world, cells: [cell, front] }, cell.x * 640, cell.y * 420, 640, 420), front);
});

test("multiple tail branches have separate screen paths and visible stroke widths", () => {
  const { cell, world, calls } = drawExample("triple-tail");
  const tails = getCellGeometry(cell, world.time, 640, 420).tails;
  assert.equal(tails.length, 3);
  for (let index = 1; index < tails.length; index++) assert(Math.hypot(tails[index][18].x - tails[index - 1][18].x, tails[index][18].y - tails[index - 1][18].y) > 4);
  const branches = calls.filter(call => call.kind === "stroke" && call.color === palette.damage && call.path.length === 2 && call.path[1][0] === "line");
  assert(branches.some(call => call.lineWidth >= 1.8));
});
