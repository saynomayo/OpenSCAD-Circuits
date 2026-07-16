export type Point = {
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
    points: Point[];
    width: number;
  };
  
  export type SceneObject = Substrate | Pad | Trace;