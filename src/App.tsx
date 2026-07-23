import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useCallback, useEffect, useRef, useState } from 'react';
import { InformationPanel } from "./components/InformationPanel";
import { Toolbar } from "./components/Toolbar";
import "./styling/App.css"
import type { Point } from "./model/geometry";
import { buildTracePath } from "./model/geometry";

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

    const id = `trace-${nextObjectNumber.current++}`;
    const points = buildTracePath(startPad, pad, traceDraft.waypoints, id);

    setScene((objects) => [
      ...objects,
      {
        id,
        type: "trace",
        startPadId: startPad.id,
        endPadId: pad.id,
        waypoints: traceDraft.waypoints,
        points,
        width: 25,
      },
    ]);
    setTraceDraft(null);
    setSelectedObject(id);
  }

  function moveObject(objectID: string, dx: number, dy: number) {
    setScene((objects) => {
      const movedObjects = objects.map((object) => {
        if (object.id === objectID && object.type === "pad") {
          return {
            ...object,
            center: { ...object.center, x: object.center.x + dx, y: object.center.y + dy },
          };
        }

        if (object.id === objectID && object.type === "trace") {
          const baseWaypoints = object.waypoints.length > 0
            ? object.waypoints
            : [{
                id: `${object.id}-waypoint-1`,
                x: (object.points[0].x + object.points.at(-1)!.x) / 2,
                y: (object.points[0].y + object.points.at(-1)!.y) / 2,
              }];
          return {
            ...object,
            waypoints: baseWaypoints.map((point) => ({
              ...point,
              x: point.x + dx,
              y: point.y + dy,
            })),
          };
        }
        return object;
      });

      return movedObjects.map((object) => {
        if (object.type !== "trace") return object;
        const startPad = movedObjects.find((candidate) => candidate.id === object.startPadId);
        const endPad = movedObjects.find((candidate) => candidate.id === object.endPadId);
        if (startPad?.type !== "pad" || endPad?.type !== "pad") return object;
        return {
          ...object,
          points: buildTracePath(startPad, endPad, object.waypoints, object.id),
        };
      });
    });
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
          objectMoveCallback={moveObject}
        />
      </main>
      <div className="canvas-hint">Scroll to zoom · Drag empty space or hold Space to pan</div>
    </div>
  );
}

export default App;
