export type Point = {
    id: string;
    x: number;
    y: number;
  };
  
  export type Substrate = {
    id: string;
    type: "substrate";
    x: number;
    y: number;
    width: number;
    height: number;
  };
  
  export type Pad = {
    id: string;
    type: "pad";
    center: Point;
    width: number;
    height: number;
  };
  
  export type Trace = {
    id: string;
    type: "trace";
    startPadId: string;
    endPadId: string;
    points: Point[];
    width: number;
  };
  
  export type SceneObject = Substrate | Pad | Trace;

  export function padEdgePoint(pad: Pad, toward: Point): Point {
    const dx = toward.x - pad.center.x;
    const dy = toward.y - pad.center.y;

    if (dx === 0 && dy === 0) {
      return { id: `${pad.id}-edge`, x: pad.center.x, y: pad.center.y };
    }

    const scale = Math.min(
      dx === 0 ? Number.POSITIVE_INFINITY : pad.width / 2 / Math.abs(dx),
      dy === 0 ? Number.POSITIVE_INFINITY : pad.height / 2 / Math.abs(dy),
    );

    return {
      id: `${pad.id}-edge`,
      x: pad.center.x + dx * scale,
      y: pad.center.y + dy * scale,
    };
  }
