import { getTailPoints } from "../core/index.js";
export function paintSimulation(context, world, width, height, palette, display) {
    context.clearRect(0, 0, width, height);
    context.lineCap = "round";
    context.lineJoin = "round";
    if (display.trails) {
        context.strokeStyle = palette.sage;
        context.lineWidth = .7;
        context.globalAlpha = .15;
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
    const x = cell.x * width, y = cell.y * height;
    // Geometry uses one display scale. Wide and narrow embeds keep the same cell proportions.
    const zoom = 600;
    const damage = palette.damage ?? "#b82735";
    const shape = cell.headShape;
    const rx = shape === "small" ? 4.2 : shape === "large" ? 7.6 : shape === "tapered" ? 6.7 : shape === "round" ? 4.4 : 5.8;
    const ry = shape === "small" ? 2.5 : shape === "large" ? 4.7 : shape === "tapered" ? 2.2 : shape === "round" ? 4.2 : 3.65;
    const opacity = cell.alive ? .94 : .58;
    context.globalAlpha = opacity;
    for (let index = 0; index < cell.tailCount; index++) {
        const points = getTailPoints(cell, time, index);
        for (let segment = 1; segment < points.length; segment++) {
            const previous = points[segment - 1], point = points[segment];
            context.strokeStyle = cell.tailShape !== "typical" || cell.tailCount > 1 ? damage : color;
            context.lineWidth = 1.45 - segment / points.length * 1.05;
            context.beginPath();
            context.moveTo(x + (previous.x - cell.x) * zoom, y + (previous.y - cell.y) * zoom);
            context.lineTo(x + (point.x - cell.x) * zoom, y + (point.y - cell.y) * zoom);
            context.stroke();
        }
    }
    context.save();
    context.translate(x, y);
    context.rotate(cell.angle);
    // The midpiece is a short, smooth sleeve. Internal banding is not resolved at this scale.
    if (cell.tailCount > 0) {
        context.strokeStyle = cell.midpieceShape !== "typical" ? damage : palette.sage;
        context.lineWidth = cell.midpieceShape === "thick" ? 3.1 : 1.8;
        context.beginPath();
        context.moveTo(-rx * .85, 0);
        if (cell.midpieceShape === "bent")
            context.quadraticCurveTo(-rx * .85 - 6, -3, -rx * .85 - 12, 2.5);
        else
            context.lineTo(-rx * .85 - 12, 0);
        context.stroke();
        if (cell.midpieceDamage) {
            context.strokeStyle = damage;
            context.lineWidth = 1.8;
            context.beginPath();
            context.moveTo(-rx * .85 - 4, 0);
            context.lineTo(-rx * .85 - 8.5, 0);
            context.stroke();
        }
    }
    for (let index = 0; index < cell.headCount; index++) {
        const headY = cell.headCount === 2 ? (index === 0 ? -ry * 1.2 : ry * 1.2) : 0;
        if (cell.headCount === 2) {
            context.strokeStyle = palette.sage;
            context.lineWidth = 1.35;
            context.beginPath();
            context.moveTo(-rx * 1.4, 0);
            context.lineTo(-rx * .8, headY);
            context.stroke();
        }
        context.save();
        context.translate(0, headY);
        const asymmetric = cell.headDefect && cell.headCount === 1;
        context.fillStyle = palette.paper ?? "#eff2ed";
        context.strokeStyle = shape !== "typical" || cell.headCount === 2 || cell.tailCount === 0 ? damage : color;
        context.lineWidth = selected ? 1.05 : .8;
        headOutline(context, rx, ry, asymmetric);
        context.fill();
        context.stroke();
        context.save();
        headOutline(context, rx * .94, ry * .94, asymmetric);
        context.clip();
        context.globalAlpha = opacity * .13;
        context.fillStyle = palette.sage;
        context.fillRect(-rx, -ry, rx * 2, ry * 2);
        // The acrosomal cap has a subtle optical boundary at the anterior part of the head.
        context.globalAlpha = opacity * .16;
        context.fillStyle = palette.paper ?? "#eff2ed";
        context.beginPath();
        context.ellipse(rx * .53, 0, rx * .55, ry * .9, 0, 0, Math.PI * 2);
        context.fill();
        const damaged = display.dna && cell.dnaDamage;
        context.globalAlpha = opacity * (damaged ? .18 : .32);
        context.fillStyle = palette.ink;
        context.beginPath();
        context.ellipse(-rx * .08, 0, rx * .65, ry * .68, 0, 0, Math.PI * 2);
        context.fill();
        // Compact chromatin texture is schematic. Individual DNA helices are not resolved.
        context.globalAlpha = opacity * .36;
        for (let speck = 0; !damaged && speck < 10; speck++) {
            const sx = Math.sin(speck * 2.4 + cell.id) * rx * .47 - rx * .08;
            const sy = Math.cos(speck * 1.8 + cell.phase) * ry * .43;
            context.beginPath();
            context.ellipse(sx, sy, .24, .18, 0, 0, Math.PI * 2);
            context.fill();
        }
        if (damaged) {
            context.globalAlpha = opacity;
            context.strokeStyle = damage;
            context.lineWidth = .85;
            const pieces = [[-2.8, -1.1, -1.35, -.75], [-.65, -1.45, .7, -1.1], [1.4, -.6, 2.65, -.15], [-2.2, .6, -.8, 1], [.1, .4, 1.3, .85], [1.4, 1.5, 2.8, 1.05]];
            for (const [ax, ay, bx, by] of pieces.slice(0, Math.max(3, cell.dnaFragmentation))) {
                context.beginPath();
                context.moveTo(ax * rx / 5.8, ay * ry / 3.65);
                context.quadraticCurveTo((ax + bx) / 2 * rx / 5.8, (ay - .4) * ry / 3.65, bx * rx / 5.8, by * ry / 3.65);
                context.stroke();
            }
        }
        context.restore();
        context.restore();
    }
    context.restore();
    if (selected) {
        context.globalAlpha = .85;
        context.strokeStyle = palette.accent;
        context.lineWidth = 1.15;
        context.setLineDash([3, 3]);
        context.beginPath();
        context.ellipse(x, y, rx + 6, cell.headCount === 2 ? ry * 2.2 + 6 : ry + 6, cell.angle, 0, Math.PI * 2);
        context.stroke();
        context.setLineDash([]);
    }
    context.globalAlpha = 1;
}
