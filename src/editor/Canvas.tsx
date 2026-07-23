import type { MouseEvent } from "react";
import type { Point, SceneObject } from "../model/geometry";
import { padEdgePoint } from "../model/geometry";

type CanvasProps = {
  objects: SceneObject[];
  activeTool: "select" | "pad" | "trace" | "delete";
  selectedObjectID: string | null;
  traceDraft: { startPadId: string; waypoints: Point[] } | null;
  objectSelectedCallback: (id: string) => void;
  canvasClickCallback: (x: number, y: number) => void;
  padConnectionCallback: (id: string) => void;
  objectDeleteCallback: (id: string) => void;
};

export function Canvas({ objects, activeTool, selectedObjectID, traceDraft, objectSelectedCallback, canvasClickCallback, padConnectionCallback, objectDeleteCallback }: CanvasProps) {
  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    if (activeTool === "select") return;

    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const canvasPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    canvasClickCallback(canvasPoint.x, canvasPoint.y);
  }

  function handleObjectClick(event: MouseEvent<SVGElement>, object: SceneObject) {
    if (activeTool === "select") {
      event.stopPropagation();
      objectSelectedCallback(object.id);
      return;
    }

    if (activeTool === "trace" && object.type === "pad") {
      event.stopPropagation();
      padConnectionCallback(object.id);
      return;
    }

    if (activeTool === "delete") {
      event.stopPropagation();
      objectDeleteCallback(object.id);
    }
  }

  const draftStartPad = traceDraft === null
    ? undefined
    : objects.find((object) => object.id === traceDraft.startPadId && object.type === "pad");
  const draftPoints = draftStartPad?.type === "pad" && traceDraft && traceDraft.waypoints.length > 0
    ? [padEdgePoint(draftStartPad, traceDraft.waypoints[0]), ...traceDraft.waypoints]
    : [];

  return (
    <svg
      viewBox="0 0 600 400"
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label="Printed electronics design canvas"
      onClick={handleCanvasClick}
      style={{ cursor: activeTool === "select" ? "default" : activeTool === "delete" ? "pointer" : "crosshair" }}
    >
      <defs>
        <pattern id="minor-grid" width="10" height="10" patternUnits="userSpaceOnUse">
          <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#dce3e9" strokeWidth="0.35" />
        </pattern>
        <pattern id="major-grid" width="50" height="50" patternUnits="userSpaceOnUse">
          <rect width="50" height="50" fill="url(#minor-grid)" />
          <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#c9d2dc" strokeWidth="0.55" />
        </pattern>
      </defs>
      <rect width="600" height="400" fill="#edf1f5" />
      <rect width="600" height="400" fill="url(#major-grid)" />
      {objects.map((object) => {
        switch (object.type) {
          case "substrate":
            return (
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)}>
                <rect
                  x={object.x}
                  y={object.y}
                  width={object.width}
                  height={object.height}
                  fill="#ffffff"
                  stroke="#8fa0b2"
                  strokeWidth={1.2}
                />
                {selectedObjectID === object.id && (
                  <rect
                    x={object.x}
                    y={object.y}
                    width={object.width}
                    height={object.height}
                    fill="#ffffff"
                    fillOpacity={0.24}
                    stroke="#1687d9"
                    strokeWidth={2.5}
                    pointerEvents="none"
                  />
                )}
              </g>
            );

          case "pad":
            return (
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)}>
                <rect
                  x={object.center.x - object.width / 2}
                  y={object.center.y - object.height / 2}
                  width={object.width}
                  height={object.height}
                  fill="#218ed5"
                  stroke="#0868ad"
                  strokeWidth={1.5}
                />
                {(selectedObjectID === object.id || traceDraft?.startPadId === object.id) && (
                  <rect
                    x={object.center.x - object.width / 2}
                    y={object.center.y - object.height / 2}
                    width={object.width}
                    height={object.height}
                    fill="#ffffff"
                    fillOpacity={0.22}
                    stroke={traceDraft?.startPadId === object.id ? "#00a6c8" : "#075d9b"}
                    strokeWidth={3}
                    strokeDasharray={traceDraft?.startPadId === object.id ? "5 3" : undefined}
                    pointerEvents="none"
                  />
                )}
              </g>
            );

          case "trace":
            return (
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)}>
                {selectedObjectID === object.id && (
                  <polyline
                    points={object.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#075d9b"
                    strokeWidth={object.width + 5}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )}
                <polyline
                  points={object.points.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill="none"
                  stroke="#1687d9"
                  strokeWidth={object.width}
                  strokeLinecap="butt"
                  strokeLinejoin="round"
                />
                {selectedObjectID === object.id && (
                  <polyline
                    points={object.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity={0.2}
                    strokeWidth={object.width}
                    strokeLinecap="butt"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )}
              </g>
            );
        }
      })}
      {draftPoints.length > 1 && (
        <g pointerEvents="none">
          <polyline
            points={draftPoints.map((point) => `${point.x},${point.y}`).join(" ")}
            fill="none"
            stroke="#1687d9"
            strokeWidth={4}
            strokeDasharray="7 5"
            strokeLinecap="butt"
            strokeLinejoin="round"
          />
          {traceDraft?.waypoints.map((point) => (
            <circle key={point.id} cx={point.x} cy={point.y} r={3.5} fill="#ffffff" stroke="#1687d9" strokeWidth={1.5} />
          ))}
        </g>
      )}
    </svg>
  );
}
