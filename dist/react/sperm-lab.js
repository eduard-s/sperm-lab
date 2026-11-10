"use client";
import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useEffect, useId, useRef, useState } from "react";
import { FACTORS, ANATOMY_SOURCES, createSimulation, createDefectSimulation, stepSimulation, getMetrics, findCell, isSlow, } from "../core/index.js";
import { paintSimulation } from "./renderer.js";
const groups = [
    { title: "Exercise", ids: ["exercise", "endurance", "cycling"], side: "left" },
    { title: "Habits", ids: ["smoking", "alcohol", "sleep", "stress"], side: "left" },
    { title: "Body", ids: ["heat", "fever", "metabolic"], side: "right" },
    { title: "Chemicals", ids: ["androgens", "pesticides"], side: "right" },
];
const shortLabels = {
    exercise: "Regular exercise", endurance: "Heavy running", cycling: "Long cycling", smoking: "Smoking", alcohol: "Heavy alcohol",
    stress: "Chronic stress", sleep: "Poor sleep", heat: "Prolonged heat", fever: "Fever", metabolic: "Metabolic stress",
    androgens: "External androgens", pesticides: "Certain pesticides",
};
const defects = [
    { id: "head", label: "Head shape", metric: "headDefects", matches: cell => cell.headDefect },
    { id: "two-heads", label: "Two heads", metric: "multiHead", matches: cell => cell.headCount === 2 },
    { id: "tail", label: "Tail shape", metric: "tailDefects", matches: cell => cell.tailDefect },
    { id: "two-tails", label: "Two tails", metric: "multiTail", matches: cell => cell.tailCount === 2 },
    { id: "midpiece", label: "Midpiece damage", metric: "midpieceDamaged", matches: cell => cell.midpieceDamage },
    { id: "dna", label: "DNA damage", metric: "dnaDamaged", matches: cell => cell.dnaDamage },
    { id: "slow", label: "Slow", metric: "slow", matches: isSlow },
    { id: "still", label: "Still", metric: "immotile", matches: cell => cell.speed === 0 || !cell.alive },
    { id: "circling", label: "Nonprogressive", metric: "nonprogressive", matches: cell => cell.alive && cell.speed > 0 && !cell.progressive },
];
function finite(value, fallback, min, max) {
    return Number.isFinite(value) ? Math.min(max, Math.max(min, value)) : fallback;
}
function resolveFactors(input, initialFactor) {
    return Object.fromEntries(FACTORS.map(factor => [factor.id, finite(input?.[factor.id], input ? 0 : factor.id === initialFactor ? .65 : 0, 0, 1)]));
}
function newWorld(seed, count, factors, progress) {
    return createSimulation({ seed, count, factors, progress });
}
export function SpermLab({ seed = 42, count = 48, initialFactors, initialFactor, className = "", style, onMetrics } = {}) {
    const [defaults] = useState(() => ({ seed: finite(seed, 42, 0, 0xffffffff), count: Math.round(finite(count, 48, 8, 120)), factors: resolveFactors(initialFactors, initialFactor) }));
    const prefix = useId();
    const [factors, setFactors] = useState(defaults.factors);
    const [progress, setProgress] = useState(1);
    const [paused, setPaused] = useState(false);
    const [slowMotion, setSlowMotion] = useState(false);
    const [trails, setTrails] = useState(true);
    const [dna, setDna] = useState(true);
    const [selectedId, setSelectedId] = useState(null);
    const [prepared, setPrepared] = useState(false);
    const [status, setStatus] = useState("");
    const [unavailable, setUnavailable] = useState(false);
    const [metrics, setMetrics] = useState(() => getMetrics(newWorld(defaults.seed, defaults.count, defaults.factors, 1)));
    const world = useRef(null);
    const resetMotion = useRef(false);
    const root = useRef(null);
    const canvas = useRef(null);
    const callback = useRef(onMetrics);
    callback.current = onMetrics;
    const settings = useRef({ paused, slowMotion, trails, dna, selectedId });
    settings.current = { paused, slowMotion, trails, dna, selectedId };
    const actions = useRef({ invalidate: () => { }, release: () => { } });
    const flow = useRef(undefined);
    const pointer = useRef(null);
    const selected = world.current?.cells.find(cell => cell.id === selectedId);
    const active = FACTORS.filter(factor => (factors[factor.id] ?? 0) > 0);
    function publish(next, preserveMotion = false) {
        const previous = world.current;
        if (preserveMotion && previous) {
            next.time = previous.time;
            next.trailClock = previous.trailClock;
            for (const cell of next.cells) {
                const old = previous.cells.find(item => item.id === cell.id);
                if (!old)
                    continue;
                cell.x = old.x;
                cell.y = old.y;
                cell.angle = old.angle;
                cell.phase = old.phase;
                cell.trail = old.trail.map(point => ({ ...point }));
            }
        }
        world.current = next;
        const counts = getMetrics(next);
        setMetrics(counts);
        callback.current?.(counts);
        if (!preserveMotion || !next.cells.some(cell => cell.id === selectedId))
            setSelectedId(null);
        actions.current.release();
        actions.current.invalidate();
    }
    useEffect(() => {
        publish(newWorld(defaults.seed, defaults.count, factors, progress), !resetMotion.current);
        resetMotion.current = false;
        setPrepared(false);
    }, [defaults, factors, progress]);
    useEffect(() => {
        const surface = canvas.current, context = surface.getContext("2d");
        if (!context) {
            setUnavailable(true);
            return;
        }
        const media = window.matchMedia("(prefers-reduced-motion: reduce)");
        if (media.matches) {
            settings.current.paused = true;
            setPaused(true);
        }
        let frame = 0, idleFrame = 0, last = 0, visible = true, destroyed = false, width = 0, height = 0;
        let palette = { ink: "#303832", sage: "#6f897c", clay: "#a67769", accent: "#785448", paper: "#eff2ed" };
        function draw() {
            if (!world.current)
                return;
            paintSimulation(context, world.current, width, height, palette, {
                dna: settings.current.dna, trails: settings.current.trails, selected: settings.current.selectedId,
            });
            const current = flow.current;
            if (current && current.strength > .04) {
                const x = current.x * width, y = current.y * height;
                context.save();
                context.globalAlpha = Math.min(.7, current.strength * .6);
                context.strokeStyle = palette.clay;
                context.lineWidth = 1.2;
                context.beginPath();
                context.arc(x, y, 8 + (1 - Math.min(1, current.strength)) * 20, 0, Math.PI * 2);
                context.moveTo(x, y);
                context.lineTo(x + current.dx * 90, y + current.dy * 90);
                context.stroke();
                context.restore();
            }
        }
        function stop() { cancelAnimationFrame(frame); cancelAnimationFrame(idleFrame); frame = idleFrame = last = 0; surface.dataset.running = "false"; }
        function release() {
            const held = pointer.current;
            pointer.current = null;
            flow.current = undefined;
            if (held && surface.hasPointerCapture(held.id))
                surface.releasePointerCapture(held.id);
        }
        function run() {
            if (destroyed || frame || settings.current.paused || !visible || document.hidden)
                return;
            last = 0;
            surface.dataset.running = "true";
            frame = requestAnimationFrame(tick);
        }
        function tick(now) {
            frame = 0;
            if (settings.current.paused || !visible || document.hidden || destroyed) {
                stop();
                return;
            }
            const dt = Math.min(last ? (now - last) / 1000 : 1 / 60, 1 / 30) * (settings.current.slowMotion ? .3 : 1);
            last = now;
            if (world.current)
                stepSimulation(world.current, dt, flow.current);
            if (flow.current) {
                flow.current.strength *= Math.exp(-dt * 4.5);
                if (flow.current.strength < .015)
                    flow.current = undefined;
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
            palette = { ink: computed.color, sage: token("--sl-sage", "#6f897c"), clay: token("--sl-clay", "#a67769"), accent: token("--sl-accent", "#785448"), paper: token("--sl-paper", "#eff2ed") };
            width = surface.clientWidth;
            height = surface.clientHeight;
            if (!width || !height)
                return;
            const dpr = Math.min(window.devicePixelRatio || 1, 1.75, Math.sqrt(1_300_000 / (width * height)));
            surface.width = Math.round(width * dpr);
            surface.height = Math.round(height * dpr);
            context.setTransform(dpr, 0, 0, dpr, 0, 0);
            release();
            draw();
        }
        function visibility() { release(); if (document.hidden)
            stop();
        else {
            draw();
            run();
        } }
        function motionChange() {
            if (media.matches) {
                settings.current.paused = true;
                setPaused(true);
                release();
                stop();
            }
            draw();
        }
        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(surface);
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
        observer?.observe(surface);
        document.addEventListener("visibilitychange", visibility);
        window.addEventListener("blur", release);
        media.addEventListener("change", motionChange);
        actions.current = { invalidate, release };
        resize();
        run();
        return () => {
            destroyed = true;
            release();
            stop();
            resizeObserver.disconnect();
            observer?.disconnect();
            document.removeEventListener("visibilitychange", visibility);
            window.removeEventListener("blur", release);
            media.removeEventListener("change", motionChange);
            actions.current = { invalidate: () => { }, release: () => { } };
        };
    }, []);
    useEffect(() => { if (paused)
        actions.current.release(); actions.current.invalidate(); }, [paused, slowMotion, trails, dna, selectedId, prepared]);
    function changeFactor(id, value) {
        setFactors(previous => ({ ...previous, [id]: value }));
        setStatus("The combined settings prepare a new illustrated cohort.");
    }
    function choose(id) {
        setSelectedId(id);
        const cell = world.current?.cells.find(item => item.id === id);
        if (cell)
            setStatus(`Cell ${id + 1}. ${movementLabel(cell)}. ${traitLabels(cell).join(". ")}.`);
    }
    function nextCell() {
        const cells = world.current?.cells;
        if (!cells?.length)
            return;
        const index = cells.findIndex(cell => cell.id === selectedId);
        choose(cells[(index + 1) % cells.length].id);
    }
    function inspectDefect(id) {
        const definition = defects.find(item => item.id === id);
        const cells = world.current?.cells.filter(definition.matches) ?? [];
        if (!cells.length)
            return;
        const index = cells.findIndex(cell => cell.id === selectedId);
        choose(cells[(index + 1) % cells.length].id);
        if (id === "dna")
            setDna(true);
    }
    function prepareExamples() {
        publish(createDefectSimulation({ seed: defaults.seed, count: defaults.count }));
        setPrepared(true);
        setDna(true);
        setSelectedId(0);
        setStatus("Prepared defect examples. These developmental traits do not represent a specific lifestyle exposure.");
    }
    function reset() {
        resetMotion.current = true;
        setFactors({ ...defaults.factors });
        setProgress(1);
        setPrepared(false);
        setDna(true);
        setTrails(true);
        setSlowMotion(false);
        setStatus("The sample and controls returned to their initial settings.");
    }
    function restore() {
        publish(newWorld(defaults.seed, defaults.count, factors, progress));
        setPrepared(false);
        setStatus("The sample now uses all current factor settings.");
    }
    function current(dx, dy) {
        if (paused) {
            setStatus("Resume the sample to create a current.");
            return;
        }
        flow.current = { x: .5, y: .5, dx, dy, strength: 1.4 };
        setStatus("The current moves the cells. Their biological traits stay the same.");
        actions.current.invalidate();
    }
    function point(event) {
        const bounds = event.currentTarget.getBoundingClientRect();
        return { x: finite((event.clientX - bounds.left) / bounds.width, .5, 0, 1), y: finite((event.clientY - bounds.top) / bounds.height, .5, 0, 1) };
    }
    function pointerDown(event) {
        if (!event.isPrimary || event.button !== 0)
            return;
        const position = point(event);
        pointer.current = { id: event.pointerId, ...position, startX: event.clientX, startY: event.clientY, dragged: false, type: event.pointerType };
        if (event.pointerType !== "touch")
            event.currentTarget.setPointerCapture(event.pointerId);
    }
    function pointerMove(event) {
        const held = pointer.current;
        if (!held || held.id !== event.pointerId)
            return;
        const position = point(event);
        held.dragged ||= Math.hypot(event.clientX - held.startX, event.clientY - held.startY) > 5;
        if (held.type !== "touch" && !paused)
            flow.current = { ...position, dx: finite((position.x - held.x) * 9, 0, -.35, .35), dy: finite((position.y - held.y) * 9, 0, -.35, .35), strength: 1.4 };
        held.x = position.x;
        held.y = position.y;
    }
    function pointerUp(event) {
        const held = pointer.current;
        if (!held || held.id !== event.pointerId)
            return;
        if (!held.dragged && world.current) {
            const position = point(event), cell = findCell(world.current, position.x, position.y);
            if (cell)
                choose(cell.id);
        }
        const remaining = flow.current;
        actions.current.release();
        flow.current = remaining;
    }
    function keyboard(event) {
        if (event.altKey || event.ctrlKey || event.metaKey)
            return;
        const directions = { ArrowLeft: [-.3, 0], ArrowRight: [.3, 0], ArrowUp: [0, -.3], ArrowDown: [0, .3] };
        if (directions[event.key]) {
            event.preventDefault();
            current(...directions[event.key]);
        }
        else if (event.key === "Enter") {
            event.preventDefault();
            nextCell();
        }
        else if (event.key === " ") {
            event.preventDefault();
            setPaused(value => !value);
        }
    }
    function controlColumn(side) {
        return _jsx("aside", { className: `sl-controls sl-controls-${side}`, "aria-label": `${side === "left" ? "Exercise and habits" : "Body and chemicals"} factors`, children: groups.filter(group => group.side === side).map(group => _jsxs("fieldset", { className: "sl-factor-group", children: [_jsx("legend", { children: group.title }), group.ids.map(id => {
                        const factor = FACTORS.find(item => item.id === id), value = Math.round((factors[id] ?? 0) * 100);
                        const rangeId = `${prefix}-${id}`;
                        return _jsxs("div", { className: "sl-factor", children: [_jsxs("div", { className: "sl-factor-row", children: [_jsx("label", { htmlFor: rangeId, children: shortLabels[id] }), _jsx("input", { id: rangeId, "data-factor": id, type: "range", min: "0", max: "100", step: "1", value: value, "aria-label": shortLabels[id] === factor.title ? factor.title : `${shortLabels[id]}: ${factor.title}`, "aria-valuetext": `${value} of 100, relative illustrative setting`, onChange: event => changeFactor(id, Number(event.target.value) / 100) }), _jsx("output", { htmlFor: rangeId, children: value })] }), _jsxs("details", { className: "sl-factor-help", children: [_jsxs("summary", { children: [_jsxs("span", { children: ["About ", shortLabels[id].toLowerCase()] }), _jsx("svg", { viewBox: "0 0 16 16", "aria-hidden": "true", children: _jsx("path", { d: "m5 6 3 3 3-3" }) })] }), _jsx("p", { children: factor.summary }), _jsx("p", { children: factor.mechanism }), _jsx("p", { className: "sl-evidence", children: factor.evidence }), _jsx("p", { children: factor.limits }), _jsx("p", { className: "sl-help-timescale", children: factor.timescale }), _jsx("ul", { children: factor.sources.map(source => _jsx("li", { children: _jsx("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", children: source.title }) }, source.url)) })] })] }, id);
                    })] }, group.title)) });
    }
    return _jsxs("div", { ref: root, className: `sperm-lab sl-lab sl-lab-v2 ${className}`.trim(), style: style, children: [_jsxs("div", { className: "sl-intro-line", children: [_jsxs("p", { children: [_jsx("strong", { children: "Change the factors. Watch one sample." }), " Each slider acts independently."] }), _jsx("span", { children: "All 12 settings use relative scales." })] }), _jsxs("div", { className: "sl-workbench", children: [controlColumn("left"), _jsxs("section", { className: "sl-field", "aria-label": "Live sperm sample", children: [_jsxs("div", { className: "sl-sample-bar", children: [_jsxs("div", { children: [_jsx("h2", { children: prepared ? "Prepared defect examples" : "Live sample" }), _jsxs("span", { children: [metrics.total, " fictional cells"] })] }), _jsxs("div", { className: "sl-actions", children: [_jsx("button", { type: "button", "aria-pressed": paused, onClick: () => setPaused(value => !value), children: paused ? "Resume" : "Pause" }), _jsx("button", { type: "button", onClick: reset, children: "Reset sample" })] })] }), unavailable && _jsx("p", { role: "status", children: "Canvas is unavailable. The sample counts, cell inspector, and factor explanations remain available." }), _jsx("div", { className: "sl-canvas-wrap", children: _jsx("canvas", { ref: canvas, tabIndex: 0, role: "group", "aria-label": "Interactive sperm sample. Drag to stir. Click a cell to inspect it. Arrow keys create currents. Enter selects the next cell. Space pauses.", "aria-describedby": `${prefix}-help`, onPointerDown: pointerDown, onPointerMove: pointerMove, onPointerUp: pointerUp, onPointerCancel: () => actions.current.release(), onLostPointerCapture: () => { pointer.current = null; }, onKeyDown: keyboard, children: "The sample needs canvas support. Use the cell inspector and model counts for a text alternative." }) }), _jsx("p", { id: `${prefix}-help`, className: "sl-canvas-help", children: "Drag to stir. Click a cell to inspect it. On touch screens, tap a cell or use Create a current." }), _jsxs("div", { className: "sl-sample-tools", children: [_jsx("button", { type: "button", onClick: () => current(.3, .1), disabled: paused, children: "Create a current" }), _jsx("button", { type: "button", onClick: nextCell, children: "Inspect next cell" }), _jsx("button", { type: "button", onClick: prepareExamples, children: "Inspect defect examples" })] }), _jsxs("div", { className: "sl-display", children: [_jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: dna, onChange: event => setDna(event.target.checked) }), "DNA overlay"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: trails, onChange: event => setTrails(event.target.checked) }), "Trails"] }), _jsxs("label", { children: [_jsx("input", { type: "checkbox", checked: slowMotion, onChange: event => setSlowMotion(event.target.checked) }), "Slow motion"] })] }), _jsx("p", { className: "sl-overlay-note", children: "The head contains tightly packed DNA. Clay flecks show model DNA damage when the overlay is on. The damage overlay is schematic." }), _jsxs("div", { className: "sl-development", children: [_jsx("label", { htmlFor: `${prefix}-progress`, children: "Development point" }), _jsx("input", { id: `${prefix}-progress`, type: "range", min: "0", max: "100", value: Math.round(progress * 100), "aria-valuetext": `${Math.round(progress * 100)} of 100, schematic development, not real days`, onChange: event => setProgress(Number(event.target.value) / 100) }), _jsx("output", { htmlFor: `${prefix}-progress`, children: progress === 0 ? "Before" : progress === 1 ? "Later" : "Between" })] }), _jsx("p", { className: "sl-model-note", children: "Sliders prepare an illustrative later cohort. Counts do not predict personal fertility." }), prepared && _jsxs("div", { className: "sl-prepared-note", children: [_jsx("p", { children: "These examples contain head, tail, midpiece, and DNA traits. They do not show the effects of a specific exposure." }), _jsx("button", { type: "button", onClick: restore, children: "Return to current settings" })] })] }), controlColumn("right"), _jsxs("section", { className: "sl-readouts", "aria-labelledby": `${prefix}-counts-title`, children: [_jsx("h2", { id: `${prefix}-counts-title`, children: "In this sample" }), _jsx("dl", { children: [
                                    ["Cells", metrics.total], ["Active motion", metrics.motile], ["Forward", metrics.progressive], ["Slow", metrics.slow],
                                    ["Nonprogressive", metrics.nonprogressive], ["Still", metrics.immotile], ["Alive", metrics.alive],
                                ].map(([label, value]) => _jsxs("div", { children: [_jsx("dt", { children: label }), _jsx("dd", { children: value })] }, label)) }), _jsx("h3", { children: "Inspect a trait" }), _jsx("p", { className: "sl-legend-help", children: "Select a count to find an example in this sample. Traits can overlap. Empty traits stay disabled." }), _jsx("div", { className: "sl-defect-legend", children: defects.map(defect => _jsxs("button", { type: "button", disabled: metrics[defect.metric] === 0, onClick: () => inspectDefect(defect.id), children: [_jsx(TraitIcon, { kind: defect.id }), _jsx("span", { children: defect.label }), _jsx("b", { children: defect.id === "dna" && !dna ? "Hidden" : metrics[defect.metric] })] }, defect.id)) })] }), _jsxs("section", { className: "sl-inspector", "aria-labelledby": `${prefix}-inspect-title`, children: [_jsxs("header", { children: [_jsx("h2", { id: `${prefix}-inspect-title`, children: "Inside one cell" }), _jsx("p", { children: selected ? `Cell ${selected.id + 1}` : "Click a cell, or select a trait count." })] }), _jsxs("div", { className: "sl-inspector-content", children: [_jsx(Anatomy, { cell: selected, dna: dna }), _jsx("div", { className: "sl-cell-facts", children: selected ? _jsxs(_Fragment, { children: [_jsxs("dl", { children: [_jsxs("div", { children: [_jsx("dt", { children: "Movement" }), _jsx("dd", { children: movementLabel(selected) })] }), _jsxs("div", { children: [_jsx("dt", { children: "Relative speed" }), _jsxs("dd", { children: [selected.alive ? Math.round(selected.speed / .07 * 100) : 0, "/100"] })] }), _jsxs("div", { children: [_jsx("dt", { children: "Vitality" }), _jsx("dd", { children: selected.alive ? "Alive" : "Nonviable" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Head" }), _jsx("dd", { children: selected.headCount === 2 ? "Two heads" : selected.headDefect ? "Head shape difference" : "One typical head" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Tail" }), _jsx("dd", { children: selected.tailCount === 2 ? "Two tails" : selected.tailDefect ? "Bent tail" : "One typical tail" })] }), _jsxs("div", { children: [_jsx("dt", { children: "Midpiece" }), _jsx("dd", { children: selected.midpieceDamage ? "Damage in the model" : "No modeled damage" })] }), _jsxs("div", { children: [_jsx("dt", { children: "DNA" }), _jsx("dd", { children: dna ? selected.dnaDamage ? "Damage in the model" : "No modeled damage" : "Hidden. Use DNA overlay." })] })] }), _jsx("p", { children: "Shape, vitality, movement, and DNA are separate traits. An immotile cell can remain alive." })] }) : _jsxs("p", { children: ["The head contains tightly packed DNA. The thin section behind the head is the midpiece. It contains mitochondria. Glycolysis along the tail also supplies energy.", _jsx("br", {}), "Select a trait to compare the head, tail, midpiece, DNA, and movement of one cell."] }) })] })] })] }), _jsxs("p", { className: "sl-anatomy-sources", children: ["Anatomy and energy: ", ANATOMY_SOURCES.map((source, index) => _jsxs("span", { children: [index > 0 ? ", " : "", _jsx("a", { href: source.url, target: "_blank", rel: "noopener noreferrer", children: source.title })] }, source.url))] }), _jsx("p", { className: "sl-status", role: "status", "aria-live": "polite", children: status || (active.length ? "The sample uses the initial factor settings. Change several sliders to explore their combined effects." : "All factors start at zero. Change several sliders to explore one combined example.") }), _jsxs("section", { className: "sl-mechanisms", "aria-labelledby": `${prefix}-mechanism-title`, children: [_jsx("h2", { id: `${prefix}-mechanism-title`, children: "What acts on this sample?" }), prepared ? _jsx("p", { children: "The prepared sample contains separate teaching examples. Its traits are not a prediction from the current factor settings." }) : active.length ? _jsx("ul", { children: active.map(factor => _jsxs("li", { children: [_jsx("strong", { children: factor.title }), _jsx("span", { children: factor.mechanism }), _jsxs("small", { children: [factor.evidence, ". ", factor.evidence === "Established mechanism" ? "The sample counts remain illustrative." : "Association does not prove cause."] })] }, factor.id)) }) : _jsx("p", { children: "No exposure scenario is active. The sample still contains authored variation in movement, shape, and DNA." }), _jsx("p", { className: "sl-final-note", children: "The model explains possible mechanisms. It does not predict fertility, diagnose a condition, or recommend a treatment." })] })] });
}
function movementLabel(cell) {
    return !cell.alive || cell.speed === 0 ? "Still" : !cell.progressive ? "Nonprogressive movement" : isSlow(cell) ? "Slow forward movement" : "Forward movement";
}
function traitLabels(cell) {
    const labels = [cell.alive ? "Alive in the model" : "Nonviable in the model"];
    if (cell.headCount === 2)
        labels.push("Two heads");
    else if (cell.headDefect)
        labels.push("Head shape difference");
    if (cell.tailCount === 2)
        labels.push("Two tails");
    else if (cell.tailDefect)
        labels.push("Tail shape difference");
    if (cell.midpieceDamage)
        labels.push("Midpiece damage");
    return labels;
}
function TraitIcon({ kind }) {
    return _jsx("svg", { viewBox: "0 0 32 24", "aria-hidden": "true", children: _jsx("g", { children: kind === "dna" ? _jsx(_Fragment, { children: _jsx("path", { d: "m11 5 10 14M21 5 11 19M12 8h8m-6 4h4m-6 4h8" }) }) : kind === "still" ? _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "9", cy: "11", rx: "4", ry: "3" }), _jsx("path", { d: "M13 11h14" })] }) : _jsxs(_Fragment, { children: [_jsx("ellipse", { cx: "8", cy: kind === "two-heads" ? 8 : 11, rx: kind === "head" ? 5 : 4, ry: kind === "head" ? 4 : 3 }), kind === "two-heads" && _jsx("ellipse", { cx: "8", cy: "16", rx: "4", ry: "3" }), _jsx("path", { d: kind === "tail" ? "M12 11l7 2-3 6 8-4 5 3" : "M12 11c5-8 9 10 17 0" }), kind === "two-tails" && _jsx("path", { d: "M12 12c5 8 9-10 17 6" }), kind === "midpiece" && _jsx("path", { d: "m13 6 3 10m-3-1 3-8" })] }) }) });
}
function Anatomy({ cell, dna }) {
    const heads = cell?.headCount ?? 1, tails = cell?.tailCount ?? 1;
    const headDefect = Boolean(cell?.headDefect && heads === 1), tailDefect = cell?.tailDefect ?? false;
    const midpiece = cell?.midpieceDamage ?? false, damaged = Boolean(dna && cell?.dnaDamage);
    return _jsxs("svg", { className: "sl-anatomy", viewBox: "0 0 520 220", role: "img", "aria-label": `Enlarged sperm cell: ${heads} head${heads === 2 ? "s" : ""} with compact chromatin, a short thin midpiece, and ${tails} long tail${tails === 2 ? "s" : ""}.${midpiece ? " Model midpiece injury is marked in clay." : ""}${damaged ? " Model DNA damage is marked inside the nucleus." : ""}`, children: [_jsx("g", { className: "sl-anatomy-lines", children: _jsx("path", { d: "M60 96V36H27M109 111V171H161M359 108V36H420" }) }), _jsx("text", { x: "22", y: "24", children: "Head \u00B7 packed DNA" }), _jsx("text", { x: "128", y: "191", children: "Midpiece \u00B7 mitochondria" }), _jsx("text", { x: "377", y: "24", children: "Long, fine tail" }), _jsx("path", { className: `sl-anatomy-tail${tailDefect ? " sl-trait-damage" : ""}`, d: tailDefect ? "M125 111C164 111 192 108 221 111C238 114 245 131 259 122C279 99 300 95 325 108S381 129 413 111S466 97 499 110" : "M125 111C174 111 196 114 230 109S281 97 316 108S368 127 405 113S461 96 499 110" }), tails === 2 && _jsx("path", { className: "sl-anatomy-tail", d: "M123 113C166 118 195 142 231 136S283 115 320 136S383 151 418 136S467 120 499 135" }), _jsx("path", { className: "sl-anatomy-midpiece-smooth", d: "M82 111H127" }), midpiece && _jsx("path", { className: "sl-anatomy-midpiece-injury", d: "M100 111H114" }), heads === 2 && _jsx("g", { className: "sl-anatomy-fork", children: _jsx("path", { d: "M88 111 81 96M88 111 81 125" }) }), Array.from({ length: heads }, (_, index) => {
                const cy = heads === 2 ? index === 0 ? 96 : 125 : 111;
                const outline = `M85 ${cy}C82 ${cy - 7} 74 ${cy - (headDefect ? 14 : 12)} 62 ${cy - 12}C40 ${cy - 13} 40 ${cy + 13} 62 ${cy + 12}C74 ${cy + (headDefect ? 8 : 12)} 82 ${cy + 7} 85 ${cy}Z`;
                return _jsxs("g", { children: [_jsx("path", { className: `sl-anatomy-head${headDefect || heads === 2 ? " sl-trait-damage" : ""}`, d: outline }), _jsx("path", { className: "sl-acrosomal-cap", d: `M60 ${cy - 10}C43 ${cy - 12} 43 ${cy + 12} 60 ${cy + 10}C55 ${cy + 5} 55 ${cy - 5} 60 ${cy - 10}Z` }), _jsx(CompactNucleus, { cy: cy, damaged: damaged })] }, index);
            }), _jsx("text", { className: "sl-diagram-caption", x: "22", y: "216", children: "Enlarged anatomy. Chromatin texture and injury colors are schematic." })] });
}
function CompactNucleus({ cy, damaged }) {
    return _jsxs("g", { className: damaged ? "sl-compact-nucleus sl-compact-nucleus-damaged" : "sl-compact-nucleus", children: [_jsx("ellipse", { cx: "65", cy: cy, rx: "13.5", ry: "8.2" }), Array.from({ length: 17 }, (_, index) => {
                const x = 65 + Math.sin(index * 2.4) * 10.5, y = cy + Math.cos(index * 1.8) * 5.8;
                return _jsx("ellipse", { className: "sl-chromatin-speck", cx: x, cy: y, rx: ".8", ry: ".6" }, index);
            }), damaged && _jsx("g", { className: "sl-chromatin-fragments", children: _jsx("path", { d: `m59 ${cy - 4} 4 2m2 4 4-2m-7 5 3-1` }) })] });
}
