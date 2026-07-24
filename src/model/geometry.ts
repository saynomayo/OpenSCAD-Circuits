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
    waypoints: Point[];
    points: Point[];
    width: number;
  };

  export type DipConfig = {
    padCount: number;
    padWidth: number;
    padHeight: number;
    columnSpacing: number;
    pitch: number;
  };

  export type Dip = {
    id: string;
    type: "dip";
    center: Point;
    config: DipConfig;
    pins: Pad[];
  };
  
  export type SceneObject = Substrate | Pad | Trace | Dip;

  export const DEFAULT_DIP_CONFIG: DipConfig = {
    padCount: 8,
    padWidth: 28,
    padHeight: 14,
    columnSpacing: 100,
    pitch: 36,
  };

  export function createDipPins(dipID: string, center: Point, config: DipConfig): Pad[] {
    const rows = Math.max(1, Math.floor(config.padCount / 2));
    return Array.from({ length: rows * 2 }, (_, index) => {
      const column = index < rows ? 0 : 1;
      const row = column === 0 ? index : rows * 2 - index - 1;
      const pinNumber = index + 1;
      return {
        id: `${dipID}-pin-${pinNumber}`,
        type: "pad" as const,
        center: {
          id: `${dipID}-pin-${pinNumber}-center`,
          x: center.x + (column === 0 ? -1 : 1) * config.columnSpacing / 2,
          y: center.y + (row - (rows - 1) / 2) * config.pitch,
        },
        width: config.padWidth,
        height: config.padHeight,
      };
    });
  }

  export function findPad(objects: SceneObject[], padID: string): Pad | undefined {
    for (const object of objects) {
      if (object.type === "pad" && object.id === padID) return object;
      if (object.type === "dip") {
        const pin = object.pins.find((candidate) => candidate.id === padID);
        if (pin) return pin;
      }
    }
    return undefined;
  }

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

  function octilinearSegment(start: Point, end: Point): Point[] {
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const diagonalDistance = Math.min(Math.abs(dx), Math.abs(dy));

    if (diagonalDistance === 0 || Math.abs(dx) === Math.abs(dy)) return [start, end];

    return [
      start,
      {
        id: "route-bend",
        x: start.x + Math.sign(dx) * diagonalDistance,
        y: start.y + Math.sign(dy) * diagonalDistance,
      },
      end,
    ];
  }

  function connectionPortToward(pad: Pad, target: Point, id: string): Point {
    const dx = target.x - pad.center.x;
    const dy = target.y - pad.center.y;
    const horizontalDirection = Math.sign(dx) || 1;
    const verticalDirection = Math.sign(dy) || 1;

    if (Math.abs(dx) >= Math.abs(dy)) {
      return {
        id,
        x: pad.center.x + horizontalDirection * pad.width / 2,
        y: pad.center.y,
      };
    }

    return {
      id,
      x: pad.center.x,
      y: pad.center.y + verticalDirection * pad.height / 2,
    };
  }

  export function buildTracePath(startPad: Pad, endPad: Pad, waypoints: Point[], traceID: string): Point[] {
    const startPort = connectionPortToward(startPad, endPad.center, `${traceID}-start`);
    const endPort = connectionPortToward(endPad, startPad.center, `${traceID}-end`);
    const targets = [startPort, ...waypoints, endPort];
    const routed = targets.slice(0, -1).flatMap((point, index) => {
      const segment = octilinearSegment(point, targets[index + 1]);
      return index === 0 ? segment : segment.slice(1);
    });

    if (routed.length < 2) return [];

    return routed.map((point, index) => ({ ...point, id: `${traceID}-point-${index}` }));
  }

  export function buildOpenTracePath(startPad: Pad, waypoints: Point[], cursor: Point): Point[] {
    const firstTarget = waypoints[0] ?? cursor;
    const startPort = connectionPortToward(startPad, firstTarget, "draft-start");
    const targets = [startPort, ...waypoints, cursor];

    return targets.slice(0, -1).flatMap((point, index) => {
      const segment = octilinearSegment(point, targets[index + 1]);
      return index === 0 ? segment : segment.slice(1);
    }).map((point, index) => ({ ...point, id: `draft-point-${index}` }));
  }
