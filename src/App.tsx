import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useCallback, useEffect, useRef, useState } from 'react';
import { InformationPanel } from "./components/InformationPanel";
import { Toolbar } from "./components/Toolbar";
import "./styling/App.css"
import type { Point } from "./model/geometry";
import { padEdgePoint } from "./model/geometry";

type TraceDraft = {
  startPadId: string;
  waypoints: Point[];
};

type Tool = "select" | "pad" | "trace" | "delete";

function App() {
  const [scene, setScene] = useState(() => sampleScene);
  const [selectedObjectID, setSelectedObject] = useState<string | null>(null);
  const selectedObject = scene.find((object) => selectedObjectID === object.id);
  const [activeTool, setActiveTool] = useState<Tool>("select");
  const [traceDraft, setTraceDraft] = useState<TraceDraft | null>(null);
  const nextObjectNumber = useRef(sampleScene.length + 1);

  function selectTool(tool: Tool) {
    if (tool !== "trace") setTraceDraft(null);
    setActiveTool(tool);
  }

  const deleteObject = useCallback((objectID: string) => {
    setScene((objects) => {
      const target = objects.find((object) => object.id === objectID);
      if (target?.type === "pad") {
        return objects.filter((object) =>
          object.id !== objectID
          && !(object.type === "trace"
            && (object.startPadId === objectID || object.endPadId === objectID))
        );
      }
      return objects.filter((object) => object.id !== objectID);
    });
    setSelectedObject(null);
    setTraceDraft((draft) => draft?.startPadId === objectID ? null : draft);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" || selectedObjectID === null) return;
      event.preventDefault();
      deleteObject(selectedObjectID);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteObject, selectedObjectID]);

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

    if (activeTool === "trace" && traceDraft !== null) {
      const point = { id: `point-${nextObjectNumber.current++}`, x, y };
      setTraceDraft((draft) => draft === null
        ? null
        : { ...draft, waypoints: [...draft.waypoints, point] });
    }
  }

  function connectPad(padID: string) {
    if (activeTool !== "trace") return;

    const pad = scene.find((object) => object.id === padID && object.type === "pad");
    if (pad?.type !== "pad") return;

    if (traceDraft === null) {
      setTraceDraft({ startPadId: padID, waypoints: [] });
      setSelectedObject(padID);
      return;
    }

    if (traceDraft.startPadId === padID) return;

    const startPad = scene.find(
      (object) => object.id === traceDraft.startPadId && object.type === "pad",
    );
    if (startPad?.type !== "pad") {
      setTraceDraft(null);
      return;
    }

    const firstTarget = traceDraft.waypoints[0] ?? pad.center;
    const lastTarget = traceDraft.waypoints.at(-1) ?? startPad.center;
    const id = `trace-${nextObjectNumber.current++}`;
    const points = [
      { ...padEdgePoint(startPad, firstTarget), id: `${id}-start` },
      ...traceDraft.waypoints,
      { ...padEdgePoint(pad, lastTarget), id: `${id}-end` },
    ];

    setScene((objects) => [
      ...objects,
      {
        id,
        type: "trace",
        startPadId: startPad.id,
        endPadId: pad.id,
        points,
        width: 25,
      },
    ]);
    setTraceDraft(null);
    setSelectedObject(id);
  }
  return (
    <div className="app">
      <div className="app-brand" aria-label="OpenSCAD Circuits">
        <div className="brand-mark">OC</div>
        <div className="brand-copy">
          <strong>OpenSCAD Circuits</strong>
          <span>Research workspace</span>
        </div>
      </div>
      <div className="toolbar-layer">
        <Toolbar toolbarClickCallback={selectTool} selectedTool={activeTool}/>
      </div>
      <aside className="panel-layer">
        <InformationPanel object={selectedObject} activeTool={activeTool} traceStartPadID={traceDraft?.startPadId ?? null}/>
      </aside>
      <main className="workspace-canvas">
        <Canvas
          objects={scene}
          activeTool={activeTool}
          selectedObjectID={selectedObjectID}
          traceDraft={traceDraft}
          objectSelectedCallback={setSelectedObject}
          canvasClickCallback={placeObject}
          padConnectionCallback={connectPad}
          objectDeleteCallback={deleteObject}
        />
      </main>
    </div>
  );
}

export default App;
