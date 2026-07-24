import type { Dip, Pad, Point, SceneObject, Substrate, Trace } from "./geometry";
import { createDipPins } from "./geometry";

export const SCENE_STORAGE_KEY = "openscad-circuits.scene.v1";

type Coordinate = {
  x: number;
  y: number;
};

export type CircuitDocument = {
  format: "openscad-circuits";
  version: 1;
  units: "canvas-units";
  updatedAt: string;
  circuit: {
    substrates: Array<Pick<Substrate, "id" | "x" | "y" | "width" | "height">>;
    pads: Array<{
      id: string;
      x: number;
      y: number;
      width: number;
      height: number;
    }>;
    dips: Array<{
      id: string;
      x: number;
      y: number;
      padCount: number;
      padWidth: number;
      padHeight: number;
      columnSpacing: number;
      pitch: number;
    }>;
    traces: Array<{
      id: string;
      startPadId: string;
      endPadId: string;
      width: number;
      waypoints: Coordinate[];
      resolvedPath: Coordinate[];
    }>;
  };
};

export function serializeScene(objects: SceneObject[]): CircuitDocument {
  return {
    format: "openscad-circuits",
    version: 1,
    units: "canvas-units",
    updatedAt: new Date().toISOString(),
    circuit: {
      substrates: objects
        .filter((object): object is Substrate => object.type === "substrate")
        .map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
      pads: objects
        .filter((object): object is Pad => object.type === "pad")
        .map(({ id, center, width, height }) => ({ id, x: center.x, y: center.y, width, height })),
      dips: objects
        .filter((object): object is Dip => object.type === "dip")
        .map(({ id, center, config }) => ({ id, x: center.x, y: center.y, ...config })),
      traces: objects
        .filter((object): object is Trace => object.type === "trace")
        .map(({ id, startPadId, endPadId, width, waypoints, points }) => ({
          id,
          startPadId,
          endPadId,
          width,
          waypoints: waypoints.map(({ x, y }) => ({ x, y })),
          resolvedPath: points.map(({ x, y }) => ({ x, y })),
        })),
    },
  };
}

function point(id: string, coordinate: Coordinate): Point {
  return { id, x: coordinate.x, y: coordinate.y };
}

export function deserializeScene(document: CircuitDocument): SceneObject[] {
  const substrates: Substrate[] = document.circuit.substrates.map((substrate) => ({
    ...substrate,
    type: "substrate",
  }));
  const pads: Pad[] = document.circuit.pads.map((pad) => ({
    id: pad.id,
    type: "pad",
    center: point(`${pad.id}-center`, pad),
    width: pad.width,
    height: pad.height,
  }));
  const dips: Dip[] = (document.circuit.dips ?? []).map((dip) => {
    const center = point(`${dip.id}-center`, dip);
    const config = {
      padCount: dip.padCount,
      padWidth: dip.padWidth,
      padHeight: dip.padHeight,
      columnSpacing: dip.columnSpacing,
      pitch: dip.pitch,
    };
    return { id: dip.id, type: "dip", center, config, pins: createDipPins(dip.id, center, config) };
  });
  const traces: Trace[] = document.circuit.traces.map((trace) => ({
    id: trace.id,
    type: "trace",
    startPadId: trace.startPadId,
    endPadId: trace.endPadId,
    width: trace.width,
    waypoints: trace.waypoints.map((coordinate, index) => point(`${trace.id}-waypoint-${index + 1}`, coordinate)),
    points: trace.resolvedPath.map((coordinate, index) => point(`${trace.id}-point-${index}`, coordinate)),
  }));

  return [...substrates, ...pads, ...dips, ...traces];
}

function isCircuitDocument(value: unknown): value is CircuitDocument {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Partial<CircuitDocument>;
  return candidate.format === "openscad-circuits"
    && candidate.version === 1
    && typeof candidate.circuit === "object"
    && candidate.circuit !== null
    && Array.isArray(candidate.circuit.substrates)
    && Array.isArray(candidate.circuit.pads)
    && Array.isArray(candidate.circuit.traces);
}

export function loadStoredScene(): SceneObject[] | null {
  try {
    const stored = localStorage.getItem(SCENE_STORAGE_KEY);
    if (stored === null) return null;
    const parsed: unknown = JSON.parse(stored);
    return isCircuitDocument(parsed) ? deserializeScene(parsed) : null;
  } catch {
    return null;
  }
}

export function storeScene(objects: SceneObject[]): void {
  try {
    localStorage.setItem(SCENE_STORAGE_KEY, JSON.stringify(serializeScene(objects)));
  } catch {
    // Editing remains available if storage is unavailable or full.
  }
}

export function downloadScene(objects: SceneObject[]): void {
  const document = serializeScene(objects);
  const blob = new Blob([JSON.stringify(document, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = "circuit.scene.json";
  anchor.click();
  URL.revokeObjectURL(url);
}
