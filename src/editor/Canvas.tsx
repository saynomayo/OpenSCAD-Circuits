import type { MouseEvent } from "react";
import type { SceneObject } from "../model/geometry";

type CanvasProps = {
  objects: SceneObject[];
  activeTool: "select" | "pad" | "trace";
  objectSelectedCallback: (id: string) => void;
  canvasClickCallback: (x: number, y: number) => void;
};

export function Canvas({ objects, activeTool, objectSelectedCallback, canvasClickCallback }: CanvasProps) {
  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    if (activeTool === "select") return;

    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const canvasPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    canvasClickCallback(canvasPoint.x, canvasPoint.y);
  }

  function handleObjectClick(event: MouseEvent<SVGElement>, id: string) {
    if (activeTool !== "select") return;
    event.stopPropagation();
    objectSelectedCallback(id);
  }

  return (
    <svg
      viewBox="0 0 600 400"
      width="100%"
      height="500"
      role="img"
      aria-label="Printed electronics design canvas"
      onClick={handleCanvasClick}
      style={{ cursor: activeTool === "select" ? "default" : "crosshair" }}
    >
      {objects.map((object) => {
        switch (object.type) {
          case "substrate":
            return (
              <rect
              
                onClick={(event) => handleObjectClick(event, object.id)}
                key={object.id}
                x={object.x}
                y={object.y}
                width={object.width}
                height={object.height}
                fill="white"
                stroke="black"
                strokeWidth={2}
              />
            );

          case "pad":
            return (
              <rect
                onClick={(event) => handleObjectClick(event, object.id)}
                key={object.id}
                x={object.center.x - object.width / 2}
                y={object.center.y - object.height / 2}
                width={object.width}
                height={object.height}
                fill="black"
                stroke="black"
                strokeWidth={2}
              />
            );

          case "trace":
            return (
              <polyline
                onClick={(event) => handleObjectClick(event, object.id)}
                key={object.id}
                points={object.points
                  .map((point) => `${point.x},${point.y}`)
                  .join(" ")}
                fill="none"
                stroke="black"
                strokeWidth={object.width}
                strokeLinecap="square"
                strokeLinejoin="round"
              />
            );
        }
      })}
    </svg>
  );
}
