import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useCallback, useEffect, useRef, useState } from 'react';
import { InformationPanel } from "./components/InformationPanel";
import { Toolbar } from "./components/Toolbar";
import "./styling/App.css"
import type { DipConfig, Point } from "./model/geometry";
import { buildTracePath, createDipPins, DEFAULT_DIP_CONFIG, findPad } from "./model/geometry";
import { downloadScene, loadStoredScene, storeScene } from "./model/scene";

type TraceDraft = {
  startPadId: string;
  waypoints: Point[];
};

type Tool = "select" | "pad" | "dip" | "trace" | "delete";

function App() {
  const [scene, setScene] = useState(() => loadStoredScene() ?? sampleScene);
  const [selectedObjectIDs, setSelectedObjectIDs] = useState<string[]>([]);
  const selectedObjects = scene.filter((object) => selectedObjectIDs.includes(object.id));
  const [activeTool, setActiveTool] = useState<Tool | null>("select");
  const [dipToolConfig, setDipToolConfig] = useState<DipConfig>({ ...DEFAULT_DIP_CONFIG });
  const [traceDraft, setTraceDraft] = useState<TraceDraft | null>(null);
  const nextObjectNumber = useRef(
    scene.reduce((highest, object) => {
      const suffix = Number(object.id.match(/(\d+)$/)?.[1] ?? 0);
      return Math.max(highest, suffix);
    }, 0) + 1,
  );

  useEffect(() => {
    storeScene(scene);
  }, [scene]);

  function selectTool(tool: Tool) {
    setActiveTool((currentTool) => {
      const nextTool = currentTool === tool ? null : tool;
      if (nextTool !== "trace") setTraceDraft(null);
      if (nextTool !== "dip") setDipToolConfig({ ...DEFAULT_DIP_CONFIG });
      return nextTool;
    });
  }

  function selectObject(objectID: string, additive: boolean) {
    setSelectedObjectIDs((selectedIDs) => {
      if (!additive) return [objectID];
      return selectedIDs.includes(objectID)
        ? selectedIDs.filter((id) => id !== objectID)
        : [...selectedIDs, objectID];
    });
  }

  function selectObjects(objectIDs: string[], additive: boolean) {
    setSelectedObjectIDs((selectedIDs) => additive
      ? [...new Set([...selectedIDs, ...objectIDs])]
      : objectIDs
    );
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
      if (target?.type === "dip") {
        const pinIDs = new Set(target.pins.map((pin) => pin.id));
        return objects.filter((object) =>
          object.id !== objectID
          && !(object.type === "trace"
            && (pinIDs.has(object.startPadId) || pinIDs.has(object.endPadId)))
        );
      }
      return objects.filter((object) => object.id !== objectID);
    });
    setSelectedObjectIDs([]);
    setTraceDraft((draft) => draft?.startPadId === objectID ? null : draft);
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key !== "Delete" || selectedObjectIDs.length === 0) return;
      event.preventDefault();
      selectedObjectIDs.forEach(deleteObject);
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteObject, selectedObjectIDs]);

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
      setSelectedObjectIDs([id]);
      return;
    }

    if (activeTool === "dip") {
      const id = `dip-${nextObjectNumber.current++}`;
      const center = { id: `${id}-center`, x, y };
      setScene((objects) => [
        ...objects,
        {
          id,
          type: "dip",
          center,
          config: { ...dipToolConfig },
          pins: createDipPins(id, center, dipToolConfig),
        },
      ]);
      setSelectedObjectIDs([id]);
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

    const pad = findPad(scene, padID);
    if (pad === undefined) return;

    if (traceDraft === null) {
      setTraceDraft({ startPadId: padID, waypoints: [] });
      const owner = scene.find((object) => object.id === padID || (object.type === "dip" && object.pins.some((pin) => pin.id === padID)));
      setSelectedObjectIDs(owner ? [owner.id] : []);
      return;
    }

    if (traceDraft.startPadId === padID) return;

    const startPad = findPad(scene, traceDraft.startPadId);
    if (startPad === undefined) {
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
    setSelectedObjectIDs([id]);
  }

  function moveObject(objectID: string, dx: number, dy: number) {
    const movingIDs = selectedObjectIDs.includes(objectID) ? selectedObjectIDs : [objectID];
    setScene((objects) => {
      const movedObjects = objects.map((object) => {
        if (movingIDs.includes(object.id) && object.type === "pad") {
          return {
            ...object,
            center: { ...object.center, x: object.center.x + dx, y: object.center.y + dy },
          };
        }

        if (movingIDs.includes(object.id) && object.type === "dip") {
          const center = { ...object.center, x: object.center.x + dx, y: object.center.y + dy };
          return { ...object, center, pins: createDipPins(object.id, center, object.config) };
        }

        if (movingIDs.includes(object.id) && object.type === "trace") {
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
        const startPad = findPad(movedObjects, object.startPadId);
        const endPad = findPad(movedObjects, object.endPadId);
        if (startPad === undefined || endPad === undefined) return object;
        return {
          ...object,
          points: buildTracePath(startPad, endPad, object.waypoints, object.id),
        };
      });
    });
  }

  function updateDip(dipID: string, changes: Partial<DipConfig>) {
    setScene((objects) => {
      const updated = objects.map((object) => {
        if (object.id !== dipID || object.type !== "dip") return object;
        const config = { ...object.config, ...changes };
        return { ...object, config, pins: createDipPins(object.id, object.center, config) };
      });
      return updated.filter((object) => object.type !== "trace"
        || (findPad(updated, object.startPadId) !== undefined && findPad(updated, object.endPadId) !== undefined)
      ).map((object) => {
        if (object.type !== "trace") return object;
        const startPad = findPad(updated, object.startPadId);
        const endPad = findPad(updated, object.endPadId);
        if (startPad === undefined || endPad === undefined) return object;
        return { ...object, points: buildTracePath(startPad, endPad, object.waypoints, object.id) };
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
        <Toolbar toolbarClickCallback={selectTool} selectedTool={activeTool} exportCallback={() => downloadScene(scene)} dipConfig={dipToolConfig} dipConfigCallback={setDipToolConfig}/>
      </div>
      <aside className="panel-layer">
        <InformationPanel objects={selectedObjects} activeTool={activeTool} traceStartPadID={traceDraft?.startPadId ?? null} dipUpdateCallback={updateDip}/>
      </aside>
      <main className="workspace-canvas">
        <Canvas
          objects={scene}
          activeTool={activeTool}
          selectedObjectIDs={selectedObjectIDs}
          traceDraft={traceDraft}
          objectSelectedCallback={selectObject}
          boxSelectionCallback={selectObjects}
          canvasClickCallback={placeObject}
          padConnectionCallback={connectPad}
          objectDeleteCallback={deleteObject}
          objectMoveCallback={moveObject}
        />
      </main>
      <div className="canvas-hint">Scroll to zoom · No tool: drag to pan · Select: drag a box or Ctrl-click</div>
    </div>
  );
}

export default App;
