import { getTailPoints } from "../core/index.js";
/** CSS pixel anchor shared by the scene, hit detection, and the moving inspector. */
export function getCellAnchor(cell, width, height) {
    return { x: cell.x * width, y: cell.y * height };
}
function rotatePoint(x, y, angle, origin) {
    const cos = Math.cos(angle), sin = Math.sin(angle);
    return { x: origin.x + x * cos - y * sin, y: origin.y + x * sin + y * cos };
}
function cubic(a, b, c, d, t) {
    const u = 1 - t;
    return { x: u ** 3 * a.x + 3 * u * u * t * b.x + 3 * u * t * t * c.x + t ** 3 * d.x,
        y: u ** 3 * a.y + 3 * u * u * t * b.y + 3 * u * t * t * c.y + t ** 3 * d.y };
}
function headContour(rx, ry, asymmetric) {
    const start = { x: -rx * .95, y: 0 };
    const curves = [
        [start, { x: -rx * .9, y: -ry * .63 }, { x: -rx * .25, y: -ry * (asymmetric ? 1.2 : 1) }, { x: rx * .35, y: -ry * .95 }],
        [{ x: rx * .35, y: -ry * .95 }, { x: rx * 1.05, y: -ry * .9 }, { x: rx * 1.08, y: ry * .9 }, { x: rx * .35, y: ry * .95 }],
        [{ x: rx * .35, y: ry * .95 }, { x: -rx * .25, y: ry * (asymmetric ? .78 : 1) }, { x: -rx * .9, y: ry * .63 }, start],
    ];
    return curves.flatMap(curve => Array.from({ length: 13 }, (_, index) => cubic(curve[0], curve[1], curve[2], curve[3], index / 12)));
}
/** One isotropic display scale keeps cell outlines independent of canvas aspect ratio. */
export function getCellGeometry(cell, time, width, height) {
    const anchor = getCellAnchor(cell, width, height);
    const scale = Math.max(.9, Math.min(1.1, Math.min(width, height) / 440));
    const shape = cell.headShape;
    const headRx = (shape === "small" ? 9 : shape === "large" ? 15.5 : shape === "tapered" ? 14.4 : shape === "round" ? 9.7 : 11.5) * scale;
    const headRy = (shape === "small" ? 5.5 : shape === "large" ? 9.6 : shape === "tapered" ? 4.8 : shape === "round" ? 9.4 : 7.6) * scale;
    const transform = (point) => rotatePoint(point.x, point.y, cell.angle, anchor);
    const heads = Array.from({ length: cell.headCount }, (_, index) => {
        const localY = cell.headCount === 2 ? (index === 0 ? -headRy * 1.22 : headRy * 1.22) : 0;
        const asymmetric = cell.headShape === "irregular";
        return { center: transform({ x: 0, y: localY }), localY, rx: headRx, ry: headRy, asymmetric,
            contour: headContour(headRx, headRy, asymmetric).map(point => transform({ x: point.x, y: point.y + localY })) };
    });
    const zoom = 900 * scale;
    const tails = Array.from({ length: cell.tailCount }, (_, index) => getTailPoints(cell, time, index).map(point => ({
        x: anchor.x + (point.x - cell.x) * zoom, y: anchor.y + (point.y - cell.y) * zoom,
    })));
    const midpieceStart = -headRx * .85;
    const midpiece = cell.tailCount > 0 ? Array.from({ length: 13 }, (_, index) => {
        const t = index / 12;
        const x = midpieceStart - 18 * scale * t;
        const y = cell.midpieceShape === "bent" ? 2 * (1 - t) * t * -4.5 * scale + t * t * 4 * scale : 0;
        return transform({ x, y });
    }) : [];
    const connections = cell.headCount === 2 ? heads.map(head => [transform({ x: -headRx * 1.35, y: 0 }), transform({ x: -headRx * .8, y: head.localY })]) : [];
    return { anchor, scale, heads, tails, midpiece, connections, headRx, headRy,
        midpieceWidth: (cell.midpieceShape === "thick" ? 4.1 : cell.midpieceDamage ? 3 : 2.3) * scale };
}
function segmentDistance(point, a, b) {
    const dx = b.x - a.x, dy = b.y - a.y;
    const length = dx * dx + dy * dy;
    const t = length ? Math.max(0, Math.min(1, ((point.x - a.x) * dx + (point.y - a.y) * dy) / length)) : 0;
    return Math.hypot(point.x - a.x - t * dx, point.y - a.y - t * dy);
}
function pathDistance(point, path) {
    let distance = Infinity;
    for (let index = 1; index < path.length; index++)
        distance = Math.min(distance, segmentDistance(point, path[index - 1], path[index]));
    return distance;
}
function inPolygon(point, polygon) {
    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const a = polygon[i], b = polygon[j];
        if ((a.y > point.y) !== (b.y > point.y) && point.x < (b.x - a.x) * (point.y - a.y) / (b.y - a.y) + a.x)
            inside = !inside;
    }
    return inside;
}
/** Hit the visible anatomy in CSS pixels, including each tail branch. */
export function hitTestCell(world, px, py, width, height, padding = 6) {
    if (![px, py, width, height, padding].every(Number.isFinite) || width <= 0 || height <= 0 || padding < 0 || px < 0 || px > width || py < 0 || py > height)
        return undefined;
    const point = { x: px, y: py };
    let nearest, bestDistance = padding;
    for (const cell of [...world.cells].reverse()) {
        const geometry = getCellGeometry(cell, world.time, width, height);
        let distance = Infinity;
        for (const head of geometry.heads)
            distance = Math.min(distance, inPolygon(point, head.contour) ? 0 : Math.max(0, pathDistance(point, head.contour) - .7));
        distance = Math.min(distance, Math.max(0, pathDistance(point, geometry.midpiece) - geometry.midpieceWidth / 2));
        for (const connection of geometry.connections)
            distance = Math.min(distance, Math.max(0, pathDistance(point, connection) - .8));
        for (const tail of geometry.tails)
            distance = Math.min(distance, Math.max(0, pathDistance(point, tail) - 1.05 * geometry.scale));
        if (distance === 0)
            return cell;
        if (distance <= bestDistance && (!nearest || distance < bestDistance)) {
            nearest = cell;
            bestDistance = distance;
        }
    }
    return nearest;
}
