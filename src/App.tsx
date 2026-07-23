import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useRef, useState } from 'react';
import { InformationPanel } from "./components/InformationPanel";
import { Toolbar } from "./components/Toolbar";
import "./styling/App.css"

function App() {
  const [scene, setScene] = useState(() => sampleScene);
  const [selectedObjectID, setSelectedObject] = useState<string | null>(null);
  const selectedObject = scene.find((object) => selectedObjectID === object.id);
  const [activeTool, setActiveTool] = useState<"select" | "pad" | "trace">("select");
  const activeTraceID = useRef<string | null>(null);
  const nextObjectNumber = useRef(sampleScene.length + 1);

  function selectTool(tool: "select" | "pad" | "trace") {
    if (tool !== "trace") activeTraceID.current = null;
    setActiveTool(tool);
  }

  function placeObject(x: number, y: number) {
    if (activeTool === "pad") {
      const id = `pad-${nextObjectNumber.current++}`;
      setScene((objects) => [
        ...objects,
        {
          id,
          type: "pad",
          center: { id: `${id}-center`, x, y },
          width: 50,
          height: 50,
        },
      ]);
      setSelectedObject(id);
      return;
    }

    if (activeTool === "trace") {
      const point = { id: `point-${nextObjectNumber.current++}`, x, y };
      if (activeTraceID.current === null) {
        const id = `trace-${nextObjectNumber.current++}`;
        activeTraceID.current = id;
        setScene((objects) => [
          ...objects,
          { id, type: "trace", points: [point], width: 25 },
        ]);
        setSelectedObject(id);
      } else {
        const traceID = activeTraceID.current;
        setScene((objects) => objects.map((object) =>
          object.id === traceID && object.type === "trace"
            ? { ...object, points: [...object.points, point] }
            : object
        ));
      }
    }
  }
  return (
    <div className="app">
      <div className="banner">
        <Toolbar toolbarClickCallback={selectTool} selectedTool={activeTool}/>
      </div>
      <div className="side-panel">
        <InformationPanel object={selectedObject} activeTool={activeTool}/>
      </div>
      <div className="canvas">
        <Canvas
          objects={scene}
          activeTool={activeTool}
          objectSelectedCallback={setSelectedObject}
          canvasClickCallback={placeObject}
        />
      </div>
    </div>
  );
}

export default App;
