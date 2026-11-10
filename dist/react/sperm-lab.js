"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { FACTORS, createSimulation, createChallengeSimulation, stepSimulation, getMetrics, findCell } from "../core/index.js";
import { paintSimulation } from "./renderer.js";
const challengeCopy = {
    "hidden-dna": {
        title: "Looks ordinary",
        task: "Inspect a forward swimmer. Reveal its DNA to find hidden damage.",
        success: "Found it. This cell moves forward and has a typical shape, but its model DNA has damage.",
    },
    "immotile-alive": {
        title: "Still, but alive",
        task: "Inspect a still cell. Find one that remains alive in the model.",
        success: "Found it. No movement does not always mean a dead cell. Vitality is a separate measure.",
    },
    circling: {
        title: "Motion without progress",
        task: "Inspect a cell that moves in a circle instead of a forward path.",
        success: "Found it. This cell moves, but it does not make forward progress.",
    },
};
const challengeIds = ["hidden-dna", "immotile-alive", "circling"];
const samples = ["baseline", "scenario"];
function bounded(value, fallback, min, max) {
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
function makeWorlds(seed, count, factor, progress, intensity) {
    return { baseline: createSimulation({ seed, count }), scenario: createSimulation({ seed, count, factor, progress, intensity }) };
}
function worldMetrics(worlds) {
    return { baseline: getMetrics(worlds.baseline), scenario: getMetrics(worlds.scenario) };
}
export function SpermLab({ seed = 42, count = 40, initialFactor = "heat", className = "", style, onMetrics } = {}) {
    const [defaults] = useState(() => ({
        seed: bounded(seed, 42, 0, 0xffffffff), count: Math.round(bounded(count, 40, 8, 120)),
        factor: FACTORS.some(item => item.id === initialFactor) ? initialFactor : "heat",
    }));
    const prefix = useId();
    const [factorId, setFactorId] = useState(defaults.factor);
    const [progress, setProgress] = useState(1);
    const [intensity, setIntensity] = useState(.65);
    const [paused, setPaused] = useState(false);
    const [slow, setSlow] = useState(false);
    const [trails, setTrails] = useState(true);
    const [dna, setDna] = useState(false);
    const [selection, setSelection] = useState(null);
    const [challenge, setChallenge] = useState(null);
    const [completed, setCompleted] = useState([]);
    const [status, setStatus] = useState("");
    const [unavailable, setUnavailable] = useState(false);
    const [metrics, setMetrics] = useState(() => worldMetrics(makeWorlds(defaults.seed, defaults.count, defaults.factor, 1, .65)));
    const worlds = useRef(null);
    const root = useRef(null);
    const microscope = useRef(null);
    const baselineCanvas = useRef(null);
    const scenarioCanvas = useRef(null);
    const settings = useRef({ paused, slow, trails, dna, selection });
    settings.current = { paused, slow, trails, dna, selection };
    const callback = useRef(onMetrics);
    callback.current = onMetrics;
    const actions = useRef({ invalidate: () => { }, release: () => { } });
    const pendingFlow = useRef(undefined);
    const pointer = useRef(null);
    const factor = FACTORS.find(item => item.id === factorId);
    const selectedCell = selection ? worlds.current?.[selection.sample].cells.find(cell => cell.id === selection.id) : undefined;
    useEffect(() => {
        worlds.current = makeWorlds(defaults.seed, defaults.count, factorId, progress, intensity);
        setSelection(null);
        setChallenge(null);
        actions.current.release();
        const next = worldMetrics(worlds.current);
        setMetrics(next);
        callback.current?.(next);
        actions.current.invalidate();
    }, [defaults, factorId, progress, intensity]);
    useEffect(() => {
        const surfaces = { baseline: baselineCanvas.current, scenario: scenarioCanvas.current };
        const contexts = { baseline: surfaces.baseline.getContext("2d"), scenario: surfaces.scenario.getContext("2d") };
        if (!contexts.baseline || !contexts.scenario) {
            setUnavailable(true);
            return;
        }
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (media.matches) {
            settings.current.paused = true;
            setPaused(true);
        }
        let frame = 0, idleFrame = 0, last = 0, visible = true, destroyed = false;
        let palette = { ink: "#303832", sage: "#6f897c", clay: "#a67769", accent: "#785448" };
        const dimensions = { baseline: { width: 0, height: 0 }, scenario: { width: 0, height: 0 } };
        function draw() {
            if (!worlds.current)
                return;
            for (const sample of samples) {
                const { width, height } = dimensions[sample];
                paintSimulation(contexts[sample], worlds.current[sample], width, height, palette, {
                    dna: settings.current.dna, trails: settings.current.trails,
                    selected: settings.current.selection?.sample === sample ? settings.current.selection.id : null,
                });
                const flow = pendingFlow.current;
                if (flow && flow.strength > .04) {
                    const context = contexts[sample];
                    const x = flow.x * width, y = flow.y * height;
                    context.save();
                    context.globalAlpha = Math.min(.7, flow.strength * .6);
                    context.strokeStyle = palette.clay;
                    context.lineWidth = 1.2;
                    context.beginPath();
                    context.arc(x, y, 8 + (1 - Math.min(1, flow.strength)) * 20, 0, Math.PI * 2);
                    context.moveTo(x, y);
                    context.lineTo(x + flow.dx * 90, y + flow.dy * 90);
                    context.stroke();
                    context.restore();
                }
            }
        }
        function stop() {
            cancelAnimationFrame(frame);
            cancelAnimationFrame(idleFrame);
            frame = idleFrame = last = 0;
            for (const sample of samples)
                surfaces[sample].dataset.running = "false";
        }
        function release() {
            const held = pointer.current;
            pointer.current = null;
            pendingFlow.current = undefined;
            if (held && surfaces[held.sample].hasPointerCapture(held.id))
                surfaces[held.sample].releasePointerCapture(held.id);
        }
        function run() {
            if (destroyed || frame || settings.current.paused || !visible || document.hidden)
                return;
            last = 0;
            for (const sample of samples)
                surfaces[sample].dataset.running = "true";
            frame = requestAnimationFrame(tick);
        }
        function tick(now) {
            frame = 0;
            if (settings.current.paused || !visible || document.hidden || destroyed) {
                stop();
                return;
            }
            const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 1 / 30) * (settings.current.slow ? .3 : 1);
            last = now;
            if (worlds.current) {
                const flow = pendingFlow.current;
                for (const sample of samples)
                    stepSimulation(worlds.current[sample], dt, flow);
                if (flow) {
                    flow.strength *= Math.exp(-dt * 4.5);
                    if (flow.strength < .015)
                        pendingFlow.current = undefined;
                }
            }
            draw();
            frame = requestAnimationFrame(tick);
        }
        function invalidate() {
            if (destroyed)
                return;
            if (settings.current.paused || !visible || document.hidden) {
                if (!idleFrame && visible && !document.hidden)
                    idleFrame = requestAnimationFrame(() => { idleFrame = 0; draw(); });
            }
            else
                run();
        }
        function resize() {
            if (!root.current)
                return;
            const computed = getComputedStyle(root.current);
            const token = (name, fallback) => computed.getPropertyValue(name).trim() || fallback;
            palette = { ink: computed.color, sage: token("--sl-sage", "#6f897c"), clay: token("--sl-clay", "#a67769"), accent: token("--sl-accent", "#785448") };
            for (const sample of samples) {
                const surface = surfaces[sample];
                const width = surface.clientWidth, height = surface.clientHeight;
                dimensions[sample] = { width, height };
                if (!width || !height)
                    continue;
                const dpr = Math.min(window.devicePixelRatio || 1, 1.75, Math.sqrt(1_000_000 / (width * height)));
                surface.width = Math.round(width * dpr);
                surface.height = Math.round(height * dpr);
                contexts[sample].setTransform(dpr, 0, 0, dpr, 0, 0);
            }
            release();
            draw();
        }
        function onVisibility() {
            release();
            if (document.hidden)
                stop();
            else {
                draw();
                run();
            }
        }
        function onMotion() {
            if (media.matches) {
                settings.current.paused = true;
                setPaused(true);
                release();
                stop();
            }
            draw();
        }
        const resizeObserver = new ResizeObserver(resize);
        for (const sample of samples)
            resizeObserver.observe(surfaces[sample]);
        const observer = typeof IntersectionObserver === "undefined" ? null : new IntersectionObserver(entries => {
            visible = entries[0]?.isIntersecting ?? true;
            if (visible) {
                draw();
                run();
            }
            else {
                release();
                stop();
            }
        }, { rootMargin: "100px" });
        if (microscope.current)
            observer?.observe(microscope.current);
        document.addEventListener("visibilitychange", onVisibility);
        window.addEventListener("blur", release);
        media.addEventListener("change", onMotion);
        actions.current = { invalidate, release };
        resize();
        run();
        return () => {
            destroyed = true;
            release();
            stop();
            resizeObserver.disconnect();
            observer?.disconnect();
            document.removeEventListener("visibilitychange", onVisibility);
            window.removeEventListener("blur", release);
            media.removeEventListener("change", onMotion);
            actions.current = { invalidate: () => { }, release: () => { } };
        };
    }, []);
    useEffect(() => {
        if (paused)
            actions.current.release();
        actions.current.invalidate();
    }, [paused, slow, trails, dna, selection, challenge]);
    useEffect(() => {
        if (!challenge || !selectedCell || selection?.sample !== "scenario")
            return;
        const hit = challenge === "hidden-dna" ? dna && selectedCell.dnaDamage && selectedCell.alive && selectedCell.progressive && selectedCell.morphology === "typical"
            : challenge === "immotile-alive" ? selectedCell.alive && selectedCell.speed === 0
                : selectedCell.alive && selectedCell.speed > 0 && !selectedCell.progressive;
        if (hit) {
            if (!completed.includes(challenge))
                setCompleted(previous => [...previous, challenge]);
            setStatus(challengeCopy[challenge].success);
        }
    }, [challenge, selectedCell, selection, dna, completed]);
    function chooseCell(sample, id) {
        setSelection({ sample, id });
        const cell = worlds.current?.[sample].cells.find(item => item.id === id);
        if (cell)
            setStatus(`${sample === "baseline" ? "Baseline" : "Example"} cell ${id + 1}. ${movementLabel(cell)}. ${cell.alive ? "Alive in the model." : "Nonviable in the model."}`);
    }
    function nextCell(forcedSample) {
        const sample = forcedSample ?? selection?.sample ?? "scenario";
        const cells = worlds.current?.[sample].cells;
        if (!cells?.length)
            return;
        const index = selection?.sample === sample ? cells.findIndex(cell => cell.id === selection.id) : -1;
        chooseCell(sample, cells[(index + 1) % cells.length].id);
    }
    function point(event) {
        const bounds = event.currentTarget.getBoundingClientRect();
        return { x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / bounds.width)), y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / bounds.height)) };
    }
    function pointerDown(event, sample) {
        if (!event.isPrimary || event.button !== 0)
            return;
        const p = point(event);
        pointer.current = { id: event.pointerId, sample, ...p, startX: event.clientX, startY: event.clientY, dragged: false, type: event.pointerType };
        if (event.pointerType !== "touch")
            event.currentTarget.setPointerCapture(event.pointerId);
    }
    function pointerMove(event) {
        const held = pointer.current;
        if (!held || held.id !== event.pointerId)
            return;
        const p = point(event);
        held.dragged ||= Math.hypot(event.clientX - held.startX, event.clientY - held.startY) > 5;
        if (held.type !== "touch" && !paused) {
            pendingFlow.current = { x: p.x, y: p.y, dx: Math.max(-.35, Math.min(.35, (p.x - held.x) * 9)), dy: Math.max(-.35, Math.min(.35, (p.y - held.y) * 9)), strength: 1.4 };
        }
        held.x = p.x;
        held.y = p.y;
    }
    function pointerUp(event, sample) {
        const held = pointer.current;
        if (!held || held.id !== event.pointerId)
            return;
        if (!held.dragged && worlds.current) {
            const p = point(event), cell = findCell(worlds.current[sample], p.x, p.y);
            if (cell)
                chooseCell(sample, cell.id);
        }
        const flow = pendingFlow.current;
        actions.current.release();
        pendingFlow.current = flow;
    }
    function current(dx, dy) {
        if (paused) {
            setStatus("Resume the sample to create a current.");
            return;
        }
        pendingFlow.current = { x: .5, y: .5, dx, dy, strength: 1 };
        setStatus("The same current acts on both samples.");
        actions.current.invalidate();
    }
    function keyboard(event, sample) {
        if (event.altKey || event.ctrlKey || event.metaKey)
            return;
        const directions = { ArrowLeft: [-.3, 0], ArrowRight: [.3, 0], ArrowUp: [0, -.3], ArrowDown: [0, .3] };
        if (directions[event.key]) {
            event.preventDefault();
            current(...directions[event.key]);
        }
        else if (event.key === "Enter") {
            event.preventDefault();
            nextCell(sample);
        }
        else if (event.key === " ") {
            event.preventDefault();
            setPaused(value => !value);
        }
    }
    function startChallenge(id) {
        const baseline = createSimulation({ seed: defaults.seed, count: defaults.count });
        const scenario = createChallengeSimulation(id, { seed: defaults.seed, count: defaults.count });
        worlds.current = { baseline, scenario };
        actions.current.release();
        setSelection(null);
        setDna(false);
        setChallenge(id);
        const next = worldMetrics(worlds.current);
        setMetrics(next);
        callback.current?.(next);
        setStatus(`Prepared teaching sample. ${challengeCopy[id].task}`);
        actions.current.invalidate();
    }
    function restoreScenario() {
        worlds.current = makeWorlds(defaults.seed, defaults.count, factorId, progress, intensity);
        actions.current.release();
        setSelection(null);
        setChallenge(null);
        const next = worldMetrics(worlds.current);
        setMetrics(next);
        callback.current?.(next);
        setStatus("The factor comparison is restored.");
        actions.current.invalidate();
    }
    return _jsxs("div", { ref: root, className: `sperm-lab sl-lab ${className}`.trim(), style: style, children: [_jsxs("div", { className: "sl-toolbar", children: [_jsxs("p", { id: `${prefix}-help`, children: [_jsx("strong", { children: "Drag to stir. Click a cell to inspect it." }), _jsx("span", { children: " Touch: tap a cell. Use the current button to stir." })] }), _jsxs("div", { className: "sl-actions", children: [_jsx("button", { type: "button", onClick: () => setPaused(value => !value), "aria-pressed": paused, children: paused ? "Resume" : "Pause" }), _jsx("button", { type: "button", onClick: restoreScenario, children: "Reset sample" })] })] }), unavailable && _jsx("p", { role: "status", children: "Canvas is unavailable in this browser. The factor explanations and sample counts remain available." }), _jsxs("div", { className: "sl-workspace", children: [_jsxs("div", { className: "sl-factor-picker", children: [_jsxs("label", { className: "sl-select-label", htmlFor: `${prefix}-factor`, children: ["Explore a factor ", _jsx("span", { children: "12 factors" })] }), _jsx("select", { id: `${prefix}-factor`, value: factorId, onChange: event => { setFactorId(event.target.value); setStatus("A new fictional cohort shows the selected scenario."); }, children: FACTORS.map(item => _jsx("option", { value: item.id, children: item.title }, item.id)) }), _jsx("p", { className: "sl-factor-summary", children: factor.summary }), _jsx("span", { className: "sl-evidence", children: factor.evidence }), _jsx("p", { className: "sl-evidence-note", children: factor.evidence === "Mixed evidence" ? "Research results differ. This is one possible pathway." : factor.evidence === "Human association" ? "Population association does not prove cause." : "The mechanism is established. Sample counts remain illustrative." })] }), _jsxs("section", { ref: microscope, className: "sl-comparison", "aria-label": "Compare fictional samples", children: [challenge && _jsxs("div", { className: "sl-teaching", children: [_jsx("strong", { children: "Prepared teaching sample" }), _jsx("p", { children: challengeCopy[challenge].task }), _jsx("button", { type: "button", onClick: restoreScenario, children: "Return to factor comparison" })] }), _jsx("div", { className: "sl-samples", children: samples.map(sample => _jsxs("section", { className: "sl-sample", "aria-labelledby": `${prefix}-${sample}-title`, children: [_jsxs("header", { children: [_jsx("h2", { id: `${prefix}-${sample}-title`, children: sample === "baseline" ? "Baseline" : challenge ? "Teaching sample" : "Later example" }), _jsx("p", { children: sample === "baseline" ? "Unchanged reference" : challenge ? challengeCopy[challenge].title : factor.title })] }), _jsx("div", { className: "sl-canvas-wrap", children: _jsx("canvas", { ref: sample === "baseline" ? baselineCanvas : scenarioCanvas, tabIndex: 0, role: "group", "aria-label": `${sample === "baseline" ? "Baseline" : "Example"} microscope. Drag to create currents. Click a cell to inspect it. Arrow keys create currents. Enter selects the next cell. Space pauses.`, "aria-describedby": `${prefix}-help`, onPointerDown: event => pointerDown(event, sample), onPointerMove: pointerMove, onPointerUp: event => pointerUp(event, sample), onPointerCancel: () => actions.current.release(), onLostPointerCapture: () => { pointer.current = null; }, onKeyDown: event => keyboard(event, sample), children: "The microscope scene needs canvas support. Read the sample counts and factor explanations for a text alternative." }) }), _jsx(SampleCounts, { metrics: metrics[sample], dna: dna })] }, sample)) }), _jsxs("div", { className: "sl-scene-footer", children: [_jsxs("span", { children: [paused ? "Paused" : "Live model", " \u00B7 Fictional cells, not a semen test"] }), _jsx("span", { className: "sl-dna-key", children: dna ? _jsxs(_Fragment, { children: [_jsx("i", { "aria-hidden": "true" }), " Crosses mark model DNA damage"] }) : "DNA damage stays hidden until you reveal it" })] }), _jsxs("div", { className: "sl-sample-tools", children: [_jsx("button", { type: "button", onClick: () => current(.3, .1), disabled: paused, children: "Create a current" }), _jsx("button", { type: "button", onClick: () => nextCell(), children: "Inspect next cell" }), _jsx("span", { children: "The same current acts on both samples." })] })] }), _jsxs("aside", { className: "sl-controls", "aria-label": "Experiment controls", children: [_jsxs("div", { className: "sl-control-group", children: [_jsxs("label", { className: "sl-range-label", htmlFor: `${prefix}-intensity`, children: ["Example strength ", _jsxs("output", { htmlFor: `${prefix}-intensity`, children: [Math.round(intensity * 100), "/100"] })] }), _jsx("input", { id: `${prefix}-intensity`, type: "range", min: "0", max: "100", value: Math.round(intensity * 100), onChange: event => setIntensity(Number(event.target.value) / 100), "aria-valuetext": `${Math.round(intensity * 100)} of 100, illustrative strength, not a real exposure dose` }), _jsx("p", { className: "sl-hint", children: "Relative model setting. No real dose or personal risk." })] }), _jsxs("div", { className: "sl-control-group", children: [_jsxs("label", { className: "sl-range-label", htmlFor: `${prefix}-progress`, children: ["Development time ", _jsx("output", { htmlFor: `${prefix}-progress`, children: progress === 0 ? "Before" : progress === 1 ? "Later" : "Between" })] }), _jsx("input", { id: `${prefix}-progress`, type: "range", min: "0", max: "100", value: Math.round(progress * 100), onChange: event => setProgress(Number(event.target.value) / 100), "aria-valuetext": `${Math.round(progress * 100)} of 100, schematic development timeline, not real days` }), _jsxs("div", { className: "sl-range-ends", "aria-hidden": "true", children: [_jsx("span", { children: "Before exposure" }), _jsx("span", { children: "Later cohort" })] }), _jsx("p", { className: "sl-hint", children: "Each change prepares a new fictional cohort. Existing cells do not change shape instantly." })] }), _jsxs("fieldset", { className: "sl-display", children: [_jsx("legend", { children: "View" }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: dna, onChange: event => setDna(event.target.checked) }), "Reveal DNA"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: trails, onChange: event => setTrails(event.target.checked) }), "Movement trails"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: slow, onChange: event => setSlow(event.target.checked) }), "Slow motion"] })] })] })] }), _jsxs("section", { className: "sl-inspector", "aria-labelledby": `${prefix}-inspect-title`, children: [_jsxs("header", { children: [_jsx("h2", { id: `${prefix}-inspect-title`, children: "Inside one cell" }), _jsx("p", { children: selectedCell && selection ? `${selection.sample === "baseline" ? "Baseline" : "Example"} cell ${selectedCell.id + 1}` : "Select a cell in either sample, or use Inspect next cell." })] }), _jsxs("div", { className: "sl-inspector-content", children: [_jsx(Anatomy, { cell: selectedCell, dna: dna }), _jsx("div", { className: "sl-cell-facts", children: selectedCell ? _jsxs(_Fragment, { children: [_jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Movement" }), _jsx("dd", { children: movementLabel(selectedCell) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Vitality" }), _jsx("dd", { children: selectedCell.alive ? "Alive" : "Nonviable" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Shape" }), _jsx("dd", { children: selectedCell.morphology === "typical" ? "Typical in this model" : selectedCell.morphology === "head" ? "Head difference" : "Tail difference" })] }), _jsxs("div", { children: [_jsx("dt", { children: "DNA" }), _jsx("dd", { children: dna ? selectedCell.dnaDamage ? "Damage in the model" : "No modeled damage" : "Hidden. Select Reveal DNA." })] })] }), _jsx("p", { children: "These are separate model traits. Appearance and movement do not reveal DNA integrity." })] }) : _jsxs("p", { children: ["The head carries DNA. The midpiece contains mitochondria. The tail creates movement.", _jsx("br", {}), "Mitochondria and glycolysis along the tail supply energy. The diagram shows enlarged model traits."] }) })] })] }), _jsxs("section", { className: "sl-discoveries", "aria-labelledby": `${prefix}-discover-title`, children: [_jsxs("header", { children: [_jsx("h2", { id: `${prefix}-discover-title`, children: "Three things to discover" }), _jsxs("span", { children: [completed.length, " of 3 discovered"] })] }), _jsx("ol", { children: challengeIds.map((id, index) => _jsxs("li", { "data-complete": completed.includes(id), "data-active": challenge === id, children: [_jsx("span", { className: "sl-discovery-number", "aria-hidden": "true", children: completed.includes(id) ? _jsx("svg", { viewBox: "0 0 20 20", children: _jsx("path", { d: "m4 10 4 4 8-9" }) }) : index + 1 }), _jsxs("div", { children: [_jsx("h3", { children: challengeCopy[id].title }), _jsx("p", { children: challengeCopy[id].task }), _jsx("button", { type: "button", onClick: () => startChallenge(id), children: challenge === id ? "Restart challenge" : "Try this challenge" })] })] }, id)) })] }), _jsx("p", { className: "sl-status", role: "status", "aria-live": "polite", children: status || "Select a factor. Compare the samples. Inspect a cell to see its separate traits." }), _jsxs("section", { className: "sl-explanation", "aria-labelledby": `${prefix}-explanation-title`, children: [_jsxs("div", { children: [_jsxs("h2", { id: `${prefix}-explanation-title`, children: ["What happens with ", factor.title.toLowerCase(), "?"] }), _jsx("p", { children: factor.mechanism }), _jsxs("p", { children: [_jsx("strong", { children: "Time scale:" }), " ", factor.timescale] })] }), _jsxs("div", { children: [_jsx("h3", { children: "What this example means" }), _jsx("p", { children: factor.limits }), _jsx("p", { children: "Cell counts and differences are authored examples. They do not predict fertility, treatment results, or an individual response." }), _jsx("ul", { className: "sl-sources", children: factor.sources.map(source => _jsx("li", { children: _jsx("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", children: source.title }) }, source.url)) })] })] })] });
}
function movementLabel(cell) {
    return cell.speed === 0 || !cell.alive ? "Still" : cell.progressive ? "Forward movement" : "Nonprogressive movement";
}
function SampleCounts({ metrics, dna }) {
    return _jsxs("div", { className: "sl-readouts", children: [_jsxs("p", { children: [metrics.total, " fictional cells"] }), _jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Move" }), _jsxs("dd", { children: [metrics.motile, _jsxs("span", { children: ["/", metrics.total] })] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Forward" }), _jsxs("dd", { children: [metrics.progressive, _jsxs("span", { children: ["/", metrics.total] })] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Alive" }), _jsxs("dd", { children: [metrics.alive, _jsxs("span", { children: ["/", metrics.total] })] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Typical shape" }), _jsxs("dd", { children: [metrics.typical, _jsxs("span", { children: ["/", metrics.total] })] })] }), _jsxs("div", { children: [_jsx("dt", { children: "DNA damage" }), _jsx("dd", { children: dna ? _jsxs(_Fragment, { children: [metrics.dnaDamaged, _jsxs("span", { children: ["/", metrics.total] })] }) : _jsx("span", { className: "sl-hidden-value", children: "Hidden" }) })] })] })] });
}
function Anatomy({ cell, dna }) {
    const damaged = dna && cell?.dnaDamage;
    const head = cell?.morphology === "head";
    const tail = cell?.morphology === "tail";
    return _jsxs("svg", { className: "sl-anatomy", viewBox: "0 0 500 190", role: "img", "aria-label": `Schematic sperm anatomy. Head contains DNA. Midpiece contains mitochondria. Tail creates movement.${damaged ? " Model DNA breaks are visible." : ""}`, children: [_jsx("g", { className: "sl-anatomy-lines", children: _jsx("path", { d: "M82 83V40H35M133 96V155H181M339 100V45H392" }) }), _jsx("text", { x: "25", y: "28", children: "Head \u00B7 DNA" }), _jsx("text", { x: "147", y: "177", children: "Midpiece \u00B7 energy" }), _jsx("text", { x: "366", y: "33", children: "Tail \u00B7 movement" }), _jsx("path", { className: "sl-anatomy-tail", d: tail ? "M151 99C190 95 210 118 230 107C255 87 273 132 296 107C319 80 345 68 374 94S431 125 468 97" : "M151 99C191 96 209 117 239 110S282 76 313 84S357 121 389 111S434 84 468 97" }), _jsx("rect", { className: "sl-anatomy-midpiece", x: "113", y: "90", width: "47", height: "18", rx: "8" }), [121, 130, 139, 148].map(x => _jsx("path", { className: "sl-mitochondria", d: `M${x} 93l3 4-3 4 3 4` }, x)), _jsx("ellipse", { className: "sl-anatomy-head", cx: "82", cy: "99", rx: head ? 38 : 34, ry: head ? 27 : 21, transform: head ? "rotate(-12 82 99)" : undefined }), _jsx("path", { className: `sl-anatomy-dna${damaged ? " sl-anatomy-damaged" : ""}`, d: damaged ? "M61 94c7-12 14 12 21 0M89 94c7 12 11 3 15 0M61 104c7 12 14-12 21 0M89 104c7-12 11-3 15 0" : "M61 94c7-12 14 12 21 0s14-12 22 0M61 104c7 12 14-12 21 0s14 12 22 0" }), damaged && _jsx("g", { className: "sl-dna-break", children: _jsx("path", { d: "m82 82 8 8m-8 0 8-8M82 110l8 8m-8 0 8-8" }) }), _jsx("text", { className: "sl-diagram-caption", x: "25", y: "188", children: "Schematic anatomy. Details are enlarged." })] });
}
