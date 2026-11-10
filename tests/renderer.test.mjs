import test from "node:test";
import assert from "node:assert/strict";
import { createDefectSimulation, cellMatchesDefect } from "../dist/core/index.js";
import { paintSimulation } from "../dist/react/renderer.js";

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
    stroke() { calls.push({ kind: "stroke", color: context.strokeStyle, clipDepth: context.clipDepth, path: [...context.path] }); },
    fill() { calls.push({ kind: "fill", color: context.fillStyle, clipDepth: context.clipDepth, path: [...context.path] }); },
  };
  Object.assign(context, methods);
  return { context, calls };
}

function drawExample(id, dna = true) {
  const world = createDefectSimulation({ count: 24 });
  const cell = structuredClone(world.cells.find(item => item.example === id && cellMatchesDefect(item, id)));
  assert(cell, `The ${id} example must exist.`);
  const recorded = recordCanvas();
  paintSimulation(recorded.context, { ...world, cells: [cell] }, 640, 420, palette, { trails: false, dna, selected: null });
  return { ...recorded, cell };
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
  assert.equal(fragments.length, cell.dnaFragmentation);
  assert(fragments.every(call => call.path.some(segment => segment[0] === "move") && call.path.some(segment => segment[0] === "quadratic")));
  const hidden = drawExample("dna-fragmentation", false);
  assert.equal(hidden.calls.filter(call => call.kind === "stroke" && call.clipDepth > 0 && call.color === palette.damage).length, 0);
});
