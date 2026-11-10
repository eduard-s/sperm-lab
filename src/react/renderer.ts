import { getTailPoints, type Simulation, type SpermCell } from "../core/index.js";

export type SpermPalette = { ink: string; sage: string; clay: string; accent: string };
export type SpermDisplay = { trails: boolean; dna: boolean; selected: number | null };

export function paintSimulation(
  context: CanvasRenderingContext2D,
  world: Simulation,
  width: number,
  height: number,
  palette: SpermPalette,
  display: SpermDisplay,
) {
  context.clearRect(0, 0, width, height);
  const scale = Math.min(width, height);
  context.lineCap = "round";
  context.lineJoin = "round";
  if (display.trails) {
    for (const cell of world.cells) {
      if (cell.trail.length < 2) continue;
      context.beginPath();
      context.strokeStyle = palette.sage;
      context.globalAlpha = .23;
      context.lineWidth = .8;
      let previous: { x: number; y: number } | undefined;
      for (const point of cell.trail) {
        if (!previous || Math.abs(point.x - previous.x) > .3 || Math.abs(point.y - previous.y) > .3) {
          context.moveTo(point.x * width, point.y * height);
        } else context.lineTo(point.x * width, point.y * height);
        previous = point;
      }
      context.stroke();
    }
  }
  context.globalAlpha = 1;
  for (const cell of world.cells) paintCell(context, cell, world.time, width, height, scale, palette, display);
}

function paintCell(context: CanvasRenderingContext2D, cell: SpermCell, time: number, width: number, height: number,
  scale: number, palette: SpermPalette, display: SpermDisplay) {
  const selected = cell.id === display.selected;
  const color = selected ? palette.accent : cell.alive ? palette.ink : palette.sage;
  const tail = getTailPoints(cell, time);
  context.globalAlpha = cell.alive ? .88 : .47;
  context.strokeStyle = color;
  context.lineWidth = Math.max(1, scale * .0033);
  context.beginPath();
  tail.forEach((point, index) => {
    if (index === 0) context.moveTo(point.x * width, point.y * height);
    else context.lineTo(point.x * width, point.y * height);
  });
  context.stroke();
  context.save();
  context.translate(cell.x * width, cell.y * height);
  context.rotate(Math.atan2(Math.sin(cell.angle) * height, Math.cos(cell.angle) * width));
  context.fillStyle = palette.sage;
  context.fillRect(-scale * .022, -scale * .003, scale * .016, scale * .006);
  context.fillStyle = color;
  context.beginPath();
  context.ellipse(0, 0, scale * (cell.morphology === "head" ? .011 : .009), scale * (cell.morphology === "head" ? .007 : .0055), cell.morphology === "head" ? .35 : 0, 0, Math.PI * 2);
  context.fill();
  if (display.dna && cell.dnaDamage) {
    context.globalAlpha = 1;
    context.strokeStyle = palette.clay;
    context.lineWidth = Math.max(1.5, scale * .0045);
    const size = scale * .013;
    context.beginPath();
    context.moveTo(-size, -size);
    context.lineTo(size, size);
    context.moveTo(-size, size);
    context.lineTo(size, -size);
    context.stroke();
  }
  context.restore();
  if (selected) {
    context.globalAlpha = .85;
    context.strokeStyle = palette.accent;
    context.lineWidth = 1.25;
    context.setLineDash([3, 3]);
    context.beginPath();
    context.arc(cell.x * width, cell.y * height, Math.max(10, scale * .027), 0, Math.PI * 2);
    context.stroke();
    context.setLineDash([]);
  }
  context.globalAlpha = 1;
}
