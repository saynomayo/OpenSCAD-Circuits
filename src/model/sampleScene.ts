import type { SceneObject } from "./geometry";

export const sampleScene: SceneObject[] = [
  {
    id: "substrate-1",
    type: "substrate",
    x: 50,
    y: 50,
    width: 500,
    height: 300,
  },
  {
    id: "pad-1",
    type: "pad",
    center: {
      id: "pad-1-1",
      x: 150,
      y: 200,
    },
    width: 50,
    height: 50,
  },
  {
    id: "pad-2",
    type: "pad",
    center: {
      id: "pad-2-1",
      x: 450,
      y: 200,
    },
    width: 50,
    height: 50,
  },
  {
    id: "trace-1",
    type: "trace",
    points: [
      { id: "trace-1-1", x: 175, y: 200 },
      { id: "trace-1-2", x: 300, y: 200 },
      { id: "trace-1-3", x: 425, y: 200 },
    ],
    width: 25,
  },
];