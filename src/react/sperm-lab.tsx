"use client";

import { useEffect, useId, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from "react";
import {
  FACTORS, ANATOMY_SOURCES, DEFECT_CATALOG, cellMatchesDefect, getDefectCounts, createSimulation, createDefectSimulation, stepSimulation, getMetrics, findCell, isSlow,
  type FactorId, type Simulation, type SpermCell,
} from "../core/index.js";
import { paintSimulation, type SpermPalette } from "./renderer.js";

type Metrics = ReturnType<typeof getMetrics>;
type Factors = Partial<Record<FactorId, number>>;
type Defect = typeof DEFECT_CATALOG[number]["id"];
export type SpermLabMetrics = Metrics;
export type SpermLabProps = {
  seed?: number;
  count?: number;
  initialFactors?: Factors;
  initialFactor?: FactorId;
  teachingPopulation?: boolean;
  className?: string;
  style?: CSSProperties;
  onMetrics?: (metrics: SpermLabMetrics) => void;
};

const groups: { title: string; ids: FactorId[]; side: "left" | "right" }[] = [
  { title: "Exercise", ids: ["exercise", "endurance", "cycling"], side: "left" },
  { title: "Habits", ids: ["smoking", "alcohol", "sleep", "stress"], side: "left" },
  { title: "Body", ids: ["heat", "fever", "metabolic"], side: "right" },
  { title: "Chemicals", ids: ["androgens", "pesticides"], side: "right" },
];
const shortLabels: Record<FactorId, string> = {
  exercise: "Regular exercise", endurance: "Heavy running", cycling: "Long cycling", smoking: "Smoking", alcohol: "Heavy alcohol",
  stress: "Chronic stress", sleep: "Poor sleep", heat: "Prolonged heat", fever: "Fever", metabolic: "Metabolic stress",
  androgens: "External androgens", pesticides: "Certain pesticides",
};
function finite(value: number | undefined, fallback: number, min: number, max: number) {
  return Number.isFinite(value) ? Math.min(max, Math.max(min, value!)) : fallback;
}
function resolveFactors(input?: Factors, initialFactor?: FactorId): Factors {
  return Object.fromEntries(FACTORS.map(factor => [factor.id, finite(input?.[factor.id], input ? 0 : factor.id === initialFactor ? .65 : 0, 0, 1)]));
}
function newWorld(seed: number, count: number, factors: Factors, progress: number, teachingPopulation: boolean) {
  return createSimulation({ seed, count, factors, progress, teachingPopulation });
}

export function SpermLab({ seed = 42, count = 48, initialFactors, initialFactor, teachingPopulation = true, className = "", style, onMetrics }: SpermLabProps = {}) {
  const [defaults] = useState(() => ({ seed: finite(seed, 42, 0, 0xffffffff), count: Math.round(finite(count, 48, teachingPopulation ? 18 : 8, 120)), factors: resolveFactors(initialFactors, initialFactor), teachingPopulation }));
  const prefix = useId();
  const [factors, setFactors] = useState<Factors>(defaults.factors);
  const [progress, setProgress] = useState(1);
  const [paused, setPaused] = useState(false);
  const [slowMotion, setSlowMotion] = useState(false);
  const [trails, setTrails] = useState(true);
  const [dna, setDna] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [prepared, setPrepared] = useState(false);
  const [status, setStatus] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [metrics, setMetrics] = useState(() => getMetrics(newWorld(defaults.seed, defaults.count, defaults.factors, 1, defaults.teachingPopulation)));
  const [defectCounts, setDefectCounts] = useState(() => getDefectCounts(newWorld(defaults.seed, defaults.count, defaults.factors, 1, defaults.teachingPopulation)));
  const world = useRef<Simulation | null>(null);
  const resetMotion = useRef(false);
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const inspector = useRef<HTMLElement>(null);
  const callback = useRef(onMetrics); callback.current = onMetrics;
  const settings = useRef({ paused, slowMotion, trails, dna, selectedId });
  settings.current = { paused, slowMotion, trails, dna, selectedId };
  const actions = useRef({ invalidate: () => {}, release: () => {} });
  const flow = useRef<{ x: number; y: number; dx: number; dy: number; strength: number } | undefined>(undefined);
  const pointer = useRef<{ id: number; x: number; y: number; startX: number; startY: number; dragged: boolean; type: string } | null>(null);
  const selected = world.current?.cells.find(cell => cell.id === selectedId);
  const active = FACTORS.filter(factor => (factors[factor.id] ?? 0) > 0);

  function publish(next: Simulation, preserveMotion = false) {
    const previous = world.current;
    if (preserveMotion && previous) {
      next.time = previous.time;
      next.trailClock = previous.trailClock;
      for (const cell of next.cells) {
        const old = previous.cells.find(item => item.id === cell.id);
        if (!old) continue;
        cell.x = old.x; cell.y = old.y; cell.angle = old.angle; cell.phase = old.phase;
        cell.trail = old.trail.map(point => ({ ...point }));
      }
    }
    world.current = next;
    const counts = getMetrics(next);
    setMetrics(counts); callback.current?.(counts);
    setDefectCounts(getDefectCounts(next));
    if (!preserveMotion || !next.cells.some(cell => cell.id === selectedId)) setSelectedId(null);
    actions.current.release(); actions.current.invalidate();
  }
  useEffect(() => {
    publish(newWorld(defaults.seed, defaults.count, factors, progress, defaults.teachingPopulation), !resetMotion.current);
    resetMotion.current = false;
    setPrepared(false);
  }, [defaults, factors, progress]);

  useEffect(() => {
    const surface = canvas.current!, context = surface.getContext("2d");
    if (!context) { setUnavailable(true); return; }
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (media.matches) { settings.current.paused = true; setPaused(true); }
    let frame = 0, idleFrame = 0, last = 0, visible = true, destroyed = false, width = 0, height = 0;
    let palette: SpermPalette = { ink: "#303832", sage: "#6f897c", clay: "#a67769", accent: "#785448", paper: "#eff2ed", damage: "#b82735" };
    function draw() {
      if (!world.current) return;
      paintSimulation(context!, world.current, width, height, palette, {
        dna: settings.current.dna, trails: settings.current.trails, selected: settings.current.selectedId,
      });
      const current = flow.current;
      if (current && current.strength > .04) {
        const x = current.x * width, y = current.y * height;
        context!.save(); context!.globalAlpha = Math.min(.7, current.strength * .6);
        context!.strokeStyle = palette.clay; context!.lineWidth = 1.2;
        context!.beginPath(); context!.arc(x, y, 8 + (1 - Math.min(1, current.strength)) * 20, 0, Math.PI * 2);
        context!.moveTo(x, y); context!.lineTo(x + current.dx * 90, y + current.dy * 90);
        context!.stroke(); context!.restore();
      }
    }
    function stop() { cancelAnimationFrame(frame); cancelAnimationFrame(idleFrame); frame = idleFrame = last = 0; surface.dataset.running = "false"; }
    function release() {
      const held = pointer.current; pointer.current = null; flow.current = undefined;
      if (held && surface.hasPointerCapture(held.id)) surface.releasePointerCapture(held.id);
    }
    function run() {
      if (destroyed || frame || settings.current.paused || !visible || document.hidden) return;
      last = 0; surface.dataset.running = "true"; frame = requestAnimationFrame(tick);
    }
    function tick(now: number) {
      frame = 0;
      if (settings.current.paused || !visible || document.hidden || destroyed) { stop(); return; }
      const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 1 / 30) * (settings.current.slowMotion ? .3 : 1);
      last = now;
      if (world.current) stepSimulation(world.current, dt, flow.current);
      if (flow.current) {
        flow.current.strength *= Math.exp(-dt * 4.5);
        if (flow.current.strength < .015) flow.current = undefined;
      }
      draw(); frame = requestAnimationFrame(tick);
    }
    function invalidate() {
      if (destroyed) return;
      if (settings.current.paused || !visible || document.hidden) {
        if (!idleFrame && visible && !document.hidden) idleFrame = requestAnimationFrame(() => { idleFrame = 0; draw(); });
      } else run();
    }
    function resize() {
      if (!root.current) return;
      const computed = getComputedStyle(root.current);
      const token = (name: string, fallback: string) => computed.getPropertyValue(name).trim() || fallback;
      palette = { ink: computed.color, sage: token("--sl-sage", "#6f897c"), clay: token("--sl-clay", "#a67769"), accent: token("--sl-accent", "#785448"), paper: token("--sl-paper", "#eff2ed"), damage: token("--sl-damage", "#b82735") };
      width = surface.clientWidth; height = surface.clientHeight;
      if (!width || !height) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75, Math.sqrt(1_300_000 / (width * height)));
      surface.width = Math.round(width * dpr); surface.height = Math.round(height * dpr);
      context!.setTransform(dpr, 0, 0, dpr, 0, 0);
      release(); draw();
    }
    function visibility() { release(); if (document.hidden) stop(); else { draw(); run(); } }
    function motionChange() {
      if (media.matches) { settings.current.paused = true; setPaused(true); release(); stop(); }
      draw();
    }
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(surface);
    const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
      visible = entries[0]?.isIntersecting ?? true;
      if (visible) { draw(); run(); } else { release(); stop(); }
    }, { rootMargin: "100px" });
    observer?.observe(surface);
    document.addEventListener("visibilitychange", visibility); window.addEventListener("blur", release);
    media.addEventListener("change", motionChange); actions.current = { invalidate, release };
    resize(); run();
    return () => {
      destroyed = true; release(); stop(); resizeObserver.disconnect(); observer?.disconnect();
      document.removeEventListener("visibilitychange", visibility); window.removeEventListener("blur", release);
      media.removeEventListener("change", motionChange); actions.current = { invalidate: () => {}, release: () => {} };
    };
  }, []);
  useEffect(() => { if (paused) actions.current.release(); actions.current.invalidate(); }, [paused, slowMotion, trails, dna, selectedId, prepared]);

  function changeFactor(id: FactorId, value: number) {
    setFactors(previous => ({ ...previous, [id]: value }));
    setStatus("The combined settings prepare a new illustrated cohort.");
  }
  function choose(id: number) {
    setSelectedId(id);
    const cell = world.current?.cells.find(item => item.id === id);
    if (cell) setStatus(`Cell ${id + 1}. ${movementLabel(cell)}. ${traitLabels(cell).join(". ")}.`);
  }
  function nextCell() {
    const cells = world.current?.cells;
    if (!cells?.length) return;
    const index = cells.findIndex(cell => cell.id === selectedId);
    choose(cells[(index + 1) % cells.length].id);
  }
  function inspectDefect(id: Defect) {
    const cells = world.current?.cells.filter(cell => cellMatchesDefect(cell, id)) ?? [];
    if (!cells.length) return;
    const target = cells.find(cell => cell.example === id) ?? cells[0];
    choose(target.id);
    if (id === "dna-fragmentation") setDna(true);
    requestAnimationFrame(() => inspector.current?.scrollIntoView({ block: "start", behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }));
  }
  function prepareExamples() {
    publish(createDefectSimulation({ seed: defaults.seed, count: defaults.count }));
    setPrepared(true); setDna(true); setSelectedId(0);
    setStatus("Prepared defect examples. These developmental traits do not represent a specific lifestyle exposure.");
  }
  function reset() {
    resetMotion.current = true;
    setFactors({ ...defaults.factors }); setProgress(1); setPrepared(false); setDna(true); setTrails(true); setSlowMotion(false);
    setStatus("The sample and controls returned to their initial settings.");
  }
  function restore() {
    publish(newWorld(defaults.seed, defaults.count, factors, progress, defaults.teachingPopulation)); setPrepared(false);
    setStatus("The sample now uses all current factor settings.");
  }
  function current(dx: number, dy: number) {
    if (paused) { setStatus("Resume the sample to create a current."); return; }
    flow.current = { x: .5, y: .5, dx, dy, strength: 1.4 };
    setStatus("The current moves the cells. Their biological traits stay the same."); actions.current.invalidate();
  }
  function point(event: PointerEvent<HTMLCanvasElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    return { x: finite((event.clientX - bounds.left) / bounds.width, .5, 0, 1), y: finite((event.clientY - bounds.top) / bounds.height, .5, 0, 1) };
  }
  function pointerDown(event: PointerEvent<HTMLCanvasElement>) {
    if (!event.isPrimary || event.button !== 0) return;
    const position = point(event);
    pointer.current = { id: event.pointerId, ...position, startX: event.clientX, startY: event.clientY, dragged: false, type: event.pointerType };
    if (event.pointerType !== "touch") event.currentTarget.setPointerCapture(event.pointerId);
  }
  function pointerMove(event: PointerEvent<HTMLCanvasElement>) {
    const held = pointer.current; if (!held || held.id !== event.pointerId) return;
    const position = point(event);
    held.dragged ||= Math.hypot(event.clientX - held.startX, event.clientY - held.startY) > 5;
    if (held.type !== "touch" && !paused) flow.current = { ...position, dx: finite((position.x - held.x) * 9, 0, -.35, .35), dy: finite((position.y - held.y) * 9, 0, -.35, .35), strength: 1.4 };
    held.x = position.x; held.y = position.y;
  }
  function pointerUp(event: PointerEvent<HTMLCanvasElement>) {
    const held = pointer.current; if (!held || held.id !== event.pointerId) return;
    if (!held.dragged && world.current) { const position = point(event), cell = findCell(world.current, position.x, position.y); if (cell) choose(cell.id); }
    const remaining = flow.current; actions.current.release(); flow.current = remaining;
  }
  function keyboard(event: KeyboardEvent<HTMLCanvasElement>) {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const directions: Record<string, [number, number]> = { ArrowLeft: [-.3, 0], ArrowRight: [.3, 0], ArrowUp: [0, -.3], ArrowDown: [0, .3] };
    if (directions[event.key]) { event.preventDefault(); current(...directions[event.key]); }
    else if (event.key === "Enter") { event.preventDefault(); nextCell(); }
    else if (event.key === " ") { event.preventDefault(); setPaused(value => !value); }
  }

  function controlColumn(side: "left" | "right") {
    return <aside className={`sl-controls sl-controls-${side}`} aria-label={`${side === "left" ? "Exercise and habits" : "Body and chemicals"} factors`}>
      {groups.filter(group => group.side === side).map(group => <fieldset className="sl-factor-group" key={group.title}>
        <legend>{group.title}</legend>
        {group.ids.map(id => {
          const factor = FACTORS.find(item => item.id === id)!, value = Math.round((factors[id] ?? 0) * 100);
          const rangeId = `${prefix}-${id}`;
          return <div className="sl-factor" key={id}>
            <div className="sl-factor-row">
              <label htmlFor={rangeId}>{shortLabels[id]}</label>
              <input id={rangeId} data-factor={id} type="range" min="0" max="100" step="1" value={value} aria-label={shortLabels[id] === factor.title ? factor.title : `${shortLabels[id]}: ${factor.title}`} aria-valuetext={`${value} of 100, relative illustrative setting`} onChange={event => changeFactor(id, Number(event.target.value) / 100)} />
              <output htmlFor={rangeId}>{value}</output>
            </div>
            <details className="sl-factor-help"><summary><span>About {shortLabels[id].toLowerCase()}</span><svg viewBox="0 0 16 16" aria-hidden="true"><path d="m5 6 3 3 3-3" /></svg></summary>
              <p>{factor.summary}</p><p>{factor.mechanism}</p><p className="sl-evidence">{factor.evidence}</p><p>{factor.limits}</p>
              <p className="sl-help-timescale">{factor.timescale}</p>
              <ul>{factor.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}</ul>
            </details>
          </div>;
        })}
      </fieldset>)}
    </aside>;
  }

  return <div ref={root} className={`sperm-lab sl-lab sl-lab-v3 ${className}`.trim()} style={style}>
    <div className="sl-intro-line"><p><strong>Change the factors. Watch one sample.</strong> Each slider acts independently.</p><span>All 12 settings use relative scales.</span></div>
    <div className="sl-workbench">
      {controlColumn("left")}
      <section className="sl-field" aria-label="Live sperm sample">
        <div className="sl-sample-bar"><div><h2>{prepared ? "Prepared defect examples" : defaults.teachingPopulation ? "Illustrative sample" : "Live sample"}</h2><span>{metrics.total} fictional cells</span></div><div className="sl-actions"><button type="button" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? "Resume" : "Pause"}</button><button type="button" onClick={reset}>Reset sample</button></div></div>
        {defaults.teachingPopulation && !prepared && <p className="sl-teaching-population">The teaching sample includes common defect examples. Counts do not show their frequency in people.</p>}
        {unavailable && <p role="status">Canvas is unavailable. The sample counts, cell inspector, and factor explanations remain available.</p>}
        <div className="sl-canvas-wrap"><canvas ref={canvas} tabIndex={0} role="group" aria-label="Interactive sperm sample. Drag to stir. Click a cell to inspect it. Arrow keys create currents. Enter selects the next cell. Space pauses." aria-describedby={`${prefix}-help`}
          onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => actions.current.release()} onLostPointerCapture={() => { pointer.current = null; }} onKeyDown={keyboard}>The sample needs canvas support. Use the cell inspector and model counts for a text alternative.</canvas></div>
        <p id={`${prefix}-help`} className="sl-canvas-help">Drag to stir. Click a cell to inspect it. On touch screens, tap a cell or use Create a current.</p>
        <div className="sl-sample-tools"><button type="button" onClick={() => current(.3, .1)} disabled={paused}>Create a current</button><button type="button" onClick={nextCell}>Inspect next cell</button><button type="button" onClick={prepareExamples}>Inspect defect examples</button></div>
        <div className="sl-display"><label><input type="checkbox" checked={dna} onChange={event => setDna(event.target.checked)} />DNA overlay</label><label><input type="checkbox" checked={trails} onChange={event => setTrails(event.target.checked)} />Trails</label><label><input type="checkbox" checked={slowMotion} onChange={event => setSlowMotion(event.target.checked)} />Slow motion</label></div>
        <p className="sl-overlay-note">Red marks illustrated abnormalities. Disconnected red pieces inside the nucleus show schematic DNA fragmentation. The overlay is not ordinary microscopy.</p>
        <div className="sl-development"><label htmlFor={`${prefix}-progress`}>Development point</label><input id={`${prefix}-progress`} type="range" min="0" max="100" value={Math.round(progress * 100)} aria-valuetext={`${Math.round(progress * 100)} of 100, schematic development, not real days`} onChange={event => setProgress(Number(event.target.value) / 100)} /><output htmlFor={`${prefix}-progress`}>{progress === 0 ? "Before" : progress === 1 ? "Later" : "Between"}</output></div>
        <p className="sl-model-note">Sliders prepare an illustrative later cohort. Counts do not predict personal fertility.</p>
        {prepared && <div className="sl-prepared-note"><p>These examples contain head, tail, midpiece, and DNA traits. They do not show the effects of a specific exposure.</p><button type="button" onClick={restore}>Return to current settings</button></div>}
      </section>
      {controlColumn("right")}
      <section className="sl-readouts" aria-labelledby={`${prefix}-counts-title`}>
        <h2 id={`${prefix}-counts-title`}>In this sample</h2>
        <dl>{([
          ["Cells", metrics.total], ["Active motion", metrics.motile], ["Forward", metrics.progressive], ["Slow", metrics.slow],
          ["Nonprogressive", metrics.nonprogressive], ["Still", metrics.immotile], ["Alive", metrics.alive],
        ] as const).map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
      </section>
      <section className="sl-catalog" aria-labelledby={`${prefix}-catalog-title`}>
        <header><h2 id={`${prefix}-catalog-title`}>Common examples</h2><p>These curated examples explain separate traits. Their frequency is not clinical prevalence. Select an example to inspect its cell.</p></header>
        <div className="sl-defect-catalog">{DEFECT_CATALOG.map(defect => {
          const example = world.current?.cells.find(cell => cell.example === defect.id && cellMatchesDefect(cell, defect.id))
            ?? world.current?.cells.find(cell => cellMatchesDefect(cell, defect.id));
          return <button key={defect.id} type="button" data-defect={defect.id} data-count={defectCounts[defect.id]} disabled={defectCounts[defect.id] === 0} onClick={() => inspectDefect(defect.id)} aria-describedby={`${prefix}-defect-${defect.id}`}>
            <SpecimenThumbnail id={defect.id} cell={example} />
            <span className="sl-catalog-copy"><strong>{defect.title}</strong><span id={`${prefix}-defect-${defect.id}`}>{defect.description}</span></span>
            <b>{defect.id === "dna-fragmentation" && !dna ? "Hidden" : defectCounts[defect.id]}</b>
          </button>;
        })}</div>
        <p className="sl-legend-help">Traits can overlap. Counts identify cells in this illustrative sample, not causes or diagnoses.</p>
      </section>
    <section ref={inspector} className="sl-inspector" aria-labelledby={`${prefix}-inspect-title`}>
      <header><h2 id={`${prefix}-inspect-title`}>Inside one cell</h2><p>{selected ? `Cell ${selected.id + 1}` : "Click a cell, or select a trait count."}</p></header>
      <div className="sl-inspector-content"><Anatomy cell={selected} dna={dna} /><div className="sl-cell-facts">{selected ? <>
        <dl><div><dt>Movement</dt><dd>{movementLabel(selected)}</dd></div><div><dt>Relative speed</dt><dd>{selected.alive ? Math.round(selected.speed / .07 * 100) : 0}/100</dd></div><div><dt>Vitality</dt><dd>{selected.alive ? "Alive" : "Nonviable"}</dd></div><div><dt>Head</dt><dd>{selected.headCount === 2 ? "Two heads" : selected.headShape === "typical" ? "One typical head" : `${selected.headShape} head`}</dd></div><div><dt>Tail</dt><dd>{selected.tailCount === 0 ? "Absent tail" : selected.tailCount > 1 ? `${selected.tailCount} tails` : selected.tailShape === "typical" ? "One typical tail" : `${selected.tailShape} tail`}</dd></div><div><dt>Midpiece</dt><dd>{selected.midpieceShape !== "typical" ? `${selected.midpieceShape} midpiece` : selected.midpieceDamage ? "Damage in the model" : "No modeled damage"}</dd></div><div><dt>DNA</dt><dd>{dna ? selected.dnaDamage ? `${selected.dnaFragmentation} illustrated fragments` : "No modeled fragmentation" : "Hidden. Use DNA overlay."}</dd></div></dl>
        <p>Shape, vitality, movement, and DNA are separate traits. An immotile cell can remain alive.</p>
      </> : <p>The head contains tightly packed DNA. The thin section behind the head is the midpiece. It contains mitochondria. Glycolysis along the tail also supplies energy.<br />Select a trait to compare the head, tail, midpiece, DNA, and movement of one cell.</p>}</div></div>
    </section>
    </div>
    <p className="sl-anatomy-sources">Anatomy and energy: {ANATOMY_SOURCES.map((source, index) => <span key={source.url}>{index > 0 ? ", " : ""}<a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></span>)}</p>
    <p className="sl-status" role="status" aria-live="polite">{status || (active.length ? "The sample uses the initial factor settings. Change several sliders to explore their combined effects." : "All factors start at zero. Change several sliders to explore one combined example.")}</p>
    <section className="sl-mechanisms" aria-labelledby={`${prefix}-mechanism-title`}><h2 id={`${prefix}-mechanism-title`}>What acts on this sample?</h2>
      {prepared ? <p>The prepared sample contains separate teaching examples. Its traits are not a prediction from the current factor settings.</p> : active.length ? <ul>{active.map(factor => <li key={factor.id}><strong>{factor.title}</strong><span>{factor.mechanism}</span><small>{factor.evidence}. {factor.evidence === "Established mechanism" ? "The sample counts remain illustrative." : "Association does not prove cause."}</small></li>)}</ul> : <p>No exposure scenario is active. The sample still contains authored variation in movement, shape, and DNA.</p>}
      <p className="sl-final-note">The model explains possible mechanisms. It does not predict fertility, diagnose a condition, or recommend a treatment.</p>
    </section>
  </div>;
}

function movementLabel(cell: SpermCell) {
  return !cell.alive || cell.speed === 0 ? "Still" : !cell.progressive ? "Nonprogressive movement" : isSlow(cell) ? "Slow forward movement" : "Forward movement";
}
function traitLabels(cell: SpermCell) {
  const labels = [cell.alive ? "Alive in the model" : "Nonviable in the model"];
  if (cell.headCount === 2) labels.push("Two heads"); else if (cell.headShape !== "typical") labels.push(`${cell.headShape} head`);
  if (cell.tailCount === 0) labels.push("Absent tail"); else if (cell.tailCount > 1) labels.push(`${cell.tailCount} tails`); else if (cell.tailShape !== "typical") labels.push(`${cell.tailShape} tail`);
  if (cell.midpieceShape !== "typical") labels.push(`${cell.midpieceShape} midpiece`);
  if (cell.midpieceDamage) labels.push("Midpiece damage");
  return labels;
}

type Phenotype = Pick<SpermCell, "headCount" | "tailCount" | "headShape" | "tailShape" | "midpieceShape" | "midpieceDamage" | "dnaDamage" | "dnaFragmentation">;
function phenotype(cell?: SpermCell, id?: Defect): Phenotype {
  return {
    headCount: cell?.headCount ?? (id === "double-head" ? 2 : 1),
    tailCount: cell?.tailCount ?? (id === "absent-tail" ? 0 : id === "double-tail" ? 2 : id === "triple-tail" ? 3 : 1),
    headShape: cell?.headShape ?? (id === "small-head" ? "small" : id === "large-head" ? "large" : id === "tapered-head" ? "tapered" : id === "round-head" ? "round" : "typical"),
    tailShape: cell?.tailShape ?? (id === "bent-tail" ? "bent" : id === "coiled-tail" ? "coiled" : id === "short-tail" ? "short" : id === "absent-tail" ? "absent" : "typical"),
    midpieceShape: cell?.midpieceShape ?? (id === "bent-midpiece" ? "bent" : id === "thick-midpiece" ? "thick" : "typical"),
    midpieceDamage: cell?.midpieceDamage ?? id === "midpiece-damage",
    dnaDamage: cell?.dnaDamage ?? id === "dna-fragmentation",
    dnaFragmentation: cell?.dnaFragmentation ?? (id === "dna-fragmentation" ? 4 : 0),
  };
}
function SpecimenThumbnail({ cell, id }: { cell?: SpermCell; id: Defect }) {
  if (id === "dna-fragmentation") return <svg className="sl-specimen-thumbnail sl-dna-thumbnail" viewBox="335 150 130 90" aria-hidden="true"><HeadInset model={phenotype(cell, id)} dna={true} label={false} /></svg>;
  return <svg className="sl-specimen-thumbnail" viewBox="24 65 485 100" aria-hidden="true"><SpecimenDrawing model={phenotype(cell, id)} dna={true} /></svg>;
}
function Anatomy({ cell, dna }: { cell?: SpermCell; dna: boolean }) {
  const model = phenotype(cell);
  return <svg className="sl-anatomy" viewBox="0 0 520 260" role="img" aria-label={`Enlarged cell: ${model.headCount} head${model.headCount === 2 ? "s" : ""}, ${model.tailCount} tail${model.tailCount === 1 ? "" : "s"}, ${model.headShape} head shape, ${model.tailShape} tail shape, ${model.midpieceShape} midpiece.${dna && model.dnaDamage ? ` DNA fragmentation with ${model.dnaFragmentation} illustrated red pieces. The DNA close-up shows these separate pieces inside the nucleus.` : ""}`}>
    <g className="sl-anatomy-lines"><path d="M60 96V36H27M109 111V171H161M359 108V36H420" /></g>
    <text x="22" y="24">Head · packed DNA</text><text x="128" y="191">Midpiece · mitochondria</text><text x="377" y="24">Tail</text>
    <SpecimenDrawing model={model} dna={dna} />
    <HeadInset model={model} dna={dna} label={true} />
    <text className="sl-diagram-caption" x="22" y="257">Enlarged schematic. Red marks illustrated abnormalities and DNA fragmentation.</text>
  </svg>;
}
function HeadInset({ model, dna, label }: { model: Phenotype; dna: boolean; label: boolean }) {
  return <g className="sl-head-inset">
    <g transform="translate(400 190)">
      <ellipse className="sl-anatomy-head" cx="0" cy="0" rx="46" ry="31" />
      <path className="sl-acrosomal-cap" d="M-8-28C-55-28-55 28-8 28C-23 12-23-12-8-28Z" />
      <g transform="scale(2.5) translate(-65 0)"><CompactNucleus cy={0} damaged={Boolean(dna && model.dnaDamage)} pieces={model.dnaFragmentation} /></g>
    </g>
    {label && <text className="sl-head-inset-label" x="322" y="241">DNA · enlarged schematic</text>}
  </g>;
}
function SpecimenDrawing({ model, dna }: { model: Phenotype; dna: boolean }) {
  const tailPaths: Record<string, string> = {
    typical: "M125 111C174 111 196 114 230 109S281 97 316 108S368 127 405 113S461 96 499 110",
    bent: "M125 111C164 111 189 108 214 111L244 139C259 151 273 124 300 111S356 109 389 117S453 99 499 111",
    coiled: "M125 111C157 111 180 109 206 113C252 119 282 151 257 159C228 168 209 128 234 112C262 95 293 121 277 140C260 159 234 140 245 124C255 108 276 124 266 135",
    short: "M125 111C155 111 179 124 210 113S244 103 262 112",
    absent: "",
    irregular: "M125 111C164 111 192 108 221 111C238 114 245 131 259 122C279 99 300 95 325 108S381 129 413 111S466 97 499 110",
  };
  const abnormalTail = model.tailShape !== "typical" || model.tailCount !== 1;
  const midpieceBent = model.midpieceShape === "bent";
  const midpiecePath = midpieceBent ? "M74 111Q100 102 112 119L127 112" : "M74 111H127";
  return <>
    {model.tailCount > 0 && <path className={`sl-anatomy-tail${abnormalTail ? " sl-trait-damage" : ""}`} d={tailPaths[model.tailShape]} />}
    {model.tailCount >= 2 && <path className="sl-anatomy-tail sl-trait-damage" d="M123 113C166 122 195 146 231 140S283 119 320 140S383 155 418 140S467 124 499 139" />}
    {model.tailCount === 3 && <path className="sl-anatomy-tail sl-trait-damage" d="M123 109C164 99 195 81 232 88S283 100 320 83S383 68 418 86S467 101 499 82" />}
    {model.tailCount > 0 && <path className={`sl-anatomy-midpiece-smooth${model.midpieceShape !== "typical" ? " sl-trait-damage" : ""}`} strokeWidth={model.midpieceShape === "thick" ? 10 : 6.5} d={midpiecePath} />}
    {model.tailCount > 0 && model.midpieceDamage && <path className="sl-anatomy-midpiece-injury" d={midpieceBent ? "M102 113 114 118" : "M100 111H114"} />}
    {model.headCount === 2 && <g className="sl-anatomy-fork"><path d="M88 111 81 96M88 111 81 125" /></g>}
    {Array.from({ length: model.headCount }, (_, index) => {
      const cy = model.headCount === 2 ? index === 0 ? 96 : 125 : 111;
      const shape = model.headShape;
      const sx = shape === "small" ? .74 : shape === "large" ? 1.32 : shape === "round" ? .78 : shape === "tapered" ? 1.13 : 1;
      const sy = shape === "small" ? .72 : shape === "large" ? 1.28 : shape === "round" ? 1.3 : shape === "tapered" ? .64 : 1;
      const irregular = String(shape) === "irregular";
      const outline = shape === "round" ? `M85 ${cy}C84 ${cy - 17} 48 ${cy - 17} 45 ${cy}C48 ${cy + 17} 84 ${cy + 17} 85 ${cy}Z` : `M85 ${cy}C82 ${cy - 7} 74 ${cy - (irregular ? 17 : 12)} 62 ${cy - 12}C40 ${cy - 13} 40 ${cy + 13} 62 ${cy + 12}C74 ${cy + (irregular ? 8 : 12)} 82 ${cy + 7} 85 ${cy}Z`;
      return <g key={index} transform={`translate(65 ${cy}) scale(${sx} ${sy}) translate(-65 ${-cy})`}>
        <path className={`sl-anatomy-head${shape !== "typical" || model.headCount === 2 || model.tailCount === 0 ? " sl-trait-damage" : ""}`} d={outline} />
        <path className="sl-acrosomal-cap" d={`M60 ${cy - 10}C43 ${cy - 12} 43 ${cy + 12} 60 ${cy + 10}C55 ${cy + 5} 55 ${cy - 5} 60 ${cy - 10}Z`} />
        <CompactNucleus cy={cy} damaged={Boolean(dna && model.dnaDamage)} pieces={model.dnaFragmentation} />
      </g>;
    })}
  </>;
}
function CompactNucleus({ cy, damaged, pieces }: { cy: number; damaged: boolean; pieces: number }) {
  const fragmentPaths = [
    `M55 ${cy - 4}q2-2 5 0`, `M64 ${cy - 5}q2 2 5 0`, `M72 ${cy - 3}q2-1 4 1`,
    `M56 ${cy + 3}q3 2 5 0`, `M65 ${cy + 2}q2-2 5 0`, `M70 ${cy + 6}q3-1 5-3`,
  ];
  return <g className="sl-compact-nucleus">
    <ellipse className="sl-nucleus-mass" cx="65" cy={cy} rx="13.5" ry="8.2" />
    {!damaged && Array.from({ length: 17 }, (_, index) => {
      const x = 65 + Math.sin(index * 2.4) * 10.5, y = cy + Math.cos(index * 1.8) * 5.8;
      return <ellipse key={index} className="sl-chromatin-speck" cx={x} cy={y} rx=".8" ry=".6" />;
    })}
    {damaged && <g className="sl-chromatin-fragments">{fragmentPaths.slice(0, Math.max(3, pieces)).map(path => <path key={path} d={path} />)}</g>}
  </g>;
}
