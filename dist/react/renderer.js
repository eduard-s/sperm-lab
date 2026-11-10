import { getCellGeometry } from "./geometry.js";
export { getCellAnchor, getCellGeometry, hitTestCell } from "./geometry.js";
export function paintSimulation(context, world, width, height, palette, display) {
    context.clearRect(0, 0, width, height);
    if (![width, height].every(Number.isFinite) || width <= 0 || height <= 0)
        return;
    context.lineCap = "round";
    context.lineJoin = "round";
    if (display.trails) {
        context.strokeStyle = palette.sage;
        context.lineWidth = .7;
        context.globalAlpha = .12;
        for (const cell of world.cells) {
            if (cell.trail.length < 2)
                continue;
            context.beginPath();
            let previous;
            for (const point of cell.trail) {
                if (!previous || Math.abs(point.x - previous.x) > .3 || Math.abs(point.y - previous.y) > .3)
                    context.moveTo(point.x * width, point.y * height);
                else
                    context.lineTo(point.x * width, point.y * height);
                previous = point;
            }
            context.stroke();
        }
    }
    context.globalAlpha = 1;
    for (const cell of world.cells)
        paintCell(context, cell, world.time, width, height, palette, display);
}
function headOutline(context, rx, ry, asymmetric) {
    context.beginPath();
    context.moveTo(-rx * .95, 0);
    context.bezierCurveTo(-rx * .9, -ry * .63, -rx * .25, -ry * (asymmetric ? 1.2 : 1), rx * .35, -ry * .95);
    context.bezierCurveTo(rx * 1.05, -ry * .9, rx * 1.08, ry * .9, rx * .35, ry * .95);
    context.bezierCurveTo(-rx * .25, ry * (asymmetric ? .78 : 1), -rx * .9, ry * .63, -rx * .95, 0);
    context.closePath();
}
function paintCell(context, cell, time, width, height, palette, display) {
    const selected = cell.id === display.selected;
    const color = selected ? palette.accent : palette.ink;
    const damage = palette.damage ?? "#b82735";
    const paper = palette.paper ?? "#eff2ed";
    const geometry = getCellGeometry(cell, time, width, height);
    const { anchor, scale, headRx: rx, headRy: ry } = geometry;
    const opacity = cell.alive ? .97 : .66;
    const tailDefect = cell.tailShape !== "typical" || cell.tailCount > 1;
    context.globalAlpha = tailDefect ? .98 : opacity;
    context.strokeStyle = tailDefect ? damage : color;
    for (const tail of geometry.tails) {
        for (let segment = 1; segment < tail.length; segment++) {
            const previous = tail[segment - 1], point = tail[segment];
            context.lineWidth = Math.max(.8, 2.1 * scale * (1 - segment / (tail.length - 1) * .55));
            context.beginPath();
            context.moveTo(previous.x, previous.y);
            context.lineTo(point.x, point.y);
            context.stroke();
        }
    }
    if (geometry.midpiece.length) {
        const injured = cell.midpieceDamage || cell.midpieceShape !== "typical";
        context.globalAlpha = injured ? 1 : opacity;
        context.strokeStyle = injured ? damage : palette.sage;
        context.lineWidth = geometry.midpieceWidth;
        context.beginPath();
        geometry.midpiece.forEach((point, index) => index ? context.lineTo(point.x, point.y) : context.moveTo(point.x, point.y));
        context.stroke();
        if (cell.midpieceDamage) {
            // One small pale interruption distinguishes injury without a segmented sleeve.
            const point = geometry.midpiece[7], next = geometry.midpiece[8];
            context.strokeStyle = paper;
            context.lineWidth = Math.max(1.2, 1.35 * scale);
            context.beginPath();
            context.moveTo(point.x, point.y);
            context.lineTo(next.x, next.y);
            context.stroke();
        }
    }
    for (const connection of geometry.connections) {
        context.globalAlpha = .95;
        context.strokeStyle = damage;
        context.lineWidth = 1.7 * scale;
        context.beginPath();
        context.moveTo(connection[0].x, connection[0].y);
        context.lineTo(connection[1].x, connection[1].y);
        context.stroke();
    }
    context.save();
    context.translate(anchor.x, anchor.y);
    context.rotate(cell.angle);
    for (const head of geometry.heads) {
        context.save();
        context.translate(0, head.localY);
        const damaged = display.dna && cell.dnaDamage;
        const abnormal = cell.headShape !== "typical" || cell.headCount === 2 || cell.tailCount === 0;
        context.globalAlpha = abnormal ? .98 : opacity;
        context.fillStyle = paper;
        context.strokeStyle = abnormal ? damage : color;
        context.lineWidth = (selected ? 1.6 : 1.25) * scale;
        headOutline(context, rx, ry, head.asymmetric);
        context.fill();
        context.stroke();
        context.save();
        headOutline(context, rx * .95, ry * .95, head.asymmetric);
        context.clip();
        context.globalAlpha = opacity * .12;
        context.fillStyle = palette.sage;
        context.fillRect(-rx, -ry, rx * 2, ry * 2);
        context.globalAlpha = opacity * .2;
        context.fillStyle = paper;
        context.beginPath();
        context.ellipse(rx * .53, 0, rx * .55, ry * .9, 0, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = opacity * (damaged ? .11 : .29);
        context.fillStyle = palette.ink;
        context.beginPath();
        context.ellipse(-rx * .05, 0, rx * .78, ry * .74, 0, 0, Math.PI * 2);
        context.fill();
        if (!damaged) {
            context.globalAlpha = opacity * .3;
            for (let speck = 0; speck < 12; speck++) {
                const sx = Math.sin(speck * 2.4 + cell.id) * rx * .5 - rx * .05;
                const sy = Math.cos(speck * 1.8 + cell.phase) * ry * .43;
                context.beginPath();
                context.ellipse(sx, sy, .38 * scale, .28 * scale, 0, 0, Math.PI * 2);
                context.fill();
            }
        }
        else {
            context.save();
            context.beginPath();
            context.ellipse(-rx * .05, 0, rx * .78, ry * .74, 0, 0, Math.PI * 2);
            context.clip();
            context.globalAlpha = 1;
            context.strokeStyle = damage;
            context.lineWidth = Math.max(1.4, 1.6 * scale);
            const halfWidth = Math.max(1.05, rx * .12);
            const pieces = Math.max(3, Math.min(6, cell.dnaFragmentation));
            for (let index = 0; index < pieces; index++) {
                const column = index % 3 - 1, row = index < 3 ? -1 : 1;
                const cx = column * rx * .54 - rx * .05, cy = row * ry * .27;
                context.beginPath();
                context.moveTo(cx - halfWidth, cy + ry * .035);
                context.quadraticCurveTo(cx, cy - ry * .08, cx + halfWidth, cy - ry * .025);
                context.stroke();
            }
            context.restore();
        }
        context.restore();
        context.restore();
    }
    context.restore();
    if (selected) {
        context.globalAlpha = .8;
        context.strokeStyle = palette.accent;
        context.lineWidth = 1.2;
        context.setLineDash([3, 3]);
        context.beginPath();
        context.ellipse(anchor.x, anchor.y, rx + 7, cell.headCount === 2 ? ry * 2.22 + 7 : ry + 7, cell.angle, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
    }
    context.globalAlpha = 1;
}
