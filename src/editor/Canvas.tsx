import type { SceneObject } from "../model/geometry";

type CanvasProps = {
  objects: SceneObject[];
  ObjectSelectedCallback: (string) => void;
};

export function Canvas({ objects, ObjectSelectedCallback }: CanvasProps) {
  return (
    <svg
      viewBox="0 0 600 400"
      width="100%"
      height="500"
      role="img"
      aria-label="Printed electronics design canvas"
    >
      {objects.map((object) => {
        switch (object.type) {
          case "substrate":
            return (
              <rect
              
                onClick={() => {
                ObjectSelectedCallback(object.id);
                }}
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
                onClick={() => {
                    ObjectSelectedCallback(object.id);
                }}
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
                onClick={() => {
                    ObjectSelectedCallback(object.id);
                }}
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