import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const manifest = JSON.parse(readFileSync(join(root, "package.json"), "utf8"));
const temp = mkdtempSync(join(tmpdir(), "sperm-lab-package-"));
const npm = (args, cwd = temp) => execFileSync("npm", args, { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
const node = source => execFileSync(process.execPath, ["--input-type=module", "-e", source], { cwd: temp, encoding: "utf8" });

try {
  const [pack] = JSON.parse(npm(["pack", "--json", "--ignore-scripts", "--pack-destination", temp], root));
  const paths = pack.files.map(({ path }) => path);
  for (const path of ["package.json", "README.md", "LICENSE", "docs/API.md", "docs/MODEL.md", "docs/DEPLOY.md", "dist/core/index.js", "dist/core/index.d.ts", "dist/react/index.js", "dist/react/index.d.ts", "dist/styles.css"]) {
    assert(paths.includes(path), `The package must contain ${path}.`);
  }
  assert(!paths.some(path => /(?:^|\/)(?:node_modules|demo-dist|output|tests|src|scripts|\.git|\.github)(?:\/|$)|\.env(?:\.|$)|\.tgz$/.test(path)), "The archive contains a development or private file.");
  for (const [name, entry] of Object.entries(manifest.exports)) {
    for (const target of typeof entry === "string" ? [entry] : [entry.types, entry.import]) {
      assert(paths.includes(target.replace(/^\.\//, "")), `The ${name} export target must exist.`);
    }
  }
  assert.equal(manifest.peerDependenciesMeta?.react?.optional, true);
  assert.equal(manifest.peerDependencies?.["react-dom"], undefined);
  assert(manifest.sideEffects.includes("**/*.css"));
  writeFileSync(join(temp, "package.json"), JSON.stringify({ private: true, type: "module" }));
  npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", resolve(temp, pack.filename)]);
  const lock = JSON.parse(readFileSync(join(temp, "package-lock.json"), "utf8"));
  assert(!lock.packages["node_modules/react"], "A core-only consumer must not install React.");
  assert(!lock.packages["node_modules/react-dom"], "A core-only consumer must not install React DOM.");
  const result = JSON.parse(node(`
    import assert from 'node:assert/strict';
    import { readFileSync } from 'node:fs';
    import { fileURLToPath } from 'node:url';
    import { FACTORS, createSimulation, stepSimulation, getMetrics, getTailPoints, createChallengeSimulation } from 'sperm-lab/core';
    assert.equal(FACTORS.length, 12);
    const world = createSimulation({ seed: 42, count: 32, factor: 'heat', progress: 1 });
    stepSimulation(world, 1 / 60);
    assert(world.time > 0);
    assert.equal(world.requestedCount, 32);
    assert.equal(getMetrics(world).total, world.cells.length);
    assert(world.cells.every(cell => Number.isFinite(cell.x) && Number.isFinite(cell.y)));
    assert(getTailPoints(world.cells[0], world.time).length > 2);
    for (const kind of ['hidden-dna', 'immotile-alive', 'circling']) assert(createChallengeSimulation(kind).cells.length > 0);
    assert(readFileSync(fileURLToPath(import.meta.resolve('sperm-lab/styles.css')), 'utf8').includes('.sl-lab'));
    process.stdout.write(JSON.stringify({ factors: FACTORS.length, cells: world.cells.length }));
  `));
  assert.equal(result.factors, 12);
  writeFileSync(join(temp, "core-consumer.mts"), `
    import { createSimulation, stepSimulation, type FactorId } from 'sperm-lab/core';
    const factor: FactorId = 'exercise';
    const sample = createSimulation({ seed: 7, count: 24, factor, progress: 1 });
    stepSimulation(sample, 1 / 60);
  `);
  execFileSync(process.execPath, [join(root, "node_modules/typescript/bin/tsc"), "--noEmit", "--strict", "--skipLibCheck", "--target", "ES2022", "--module", "NodeNext", "--moduleResolution", "NodeNext", "--lib", "ES2022,DOM", "core-consumer.mts"], { cwd: temp, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  console.log("Headless consumer: clean install, typed exports, simulation, challenges, and CSS pass without React.");
  for (const version of ["18.3.1", "19.2.6"]) {
    npm(["install", "--ignore-scripts", "--no-audit", "--no-fund", `react@${version}`, `react-dom@${version}`]);
    const markup = node(`
      import assert from 'node:assert/strict';
      import React from 'react';
      import { renderToString } from 'react-dom/server';
      import { SpermLab } from 'sperm-lab';
      import { SpermLab as Alias } from 'sperm-lab/react';
      import { FACTORS } from 'sperm-lab/core';
      assert.equal(SpermLab, Alias);
      const html = renderToString(React.createElement(SpermLab, { seed: 42, count: 24 }));
      for (const factor of FACTORS) assert(html.includes(factor.title.replaceAll('&', '&amp;')), factor.title);
      assert(html.includes('<canvas'));
      assert(html.includes('<select'));
      process.stdout.write(html);
    `);
    assert(markup.length > 1000);
    console.log(`React ${version}: server rendering and all 12 factors pass.`);
  }
  const entry = readFileSync(join(temp, "node_modules/sperm-lab/dist/react/index.js"), "utf8");
  assert(/^['"]use client['"];/.test(entry), "The React entry must keep its client directive.");
  console.log(`Package smoke tests pass: ${paths.length} files, ${pack.size} compressed bytes. Node ${process.versions.node}.`);
} finally {
  rmSync(temp, { recursive: true, force: true });
}
