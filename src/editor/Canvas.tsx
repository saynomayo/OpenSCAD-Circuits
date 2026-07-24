import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";
import type { Point, SceneObject } from "../model/geometry";
import { buildOpenTracePath, findPad } from "../model/geometry";

type CanvasProps = {
  objects: SceneObject[];
  activeTool: "select" | "pad" | "dip" | "trace" | "delete" | null;
  selectedObjectIDs: string[];
  traceDraft: { startPadId: string; waypoints: Point[] } | null;
  objectSelectedCallback: (id: string, additive: boolean) => void;
  boxSelectionCallback: (ids: string[], additive: boolean) => void;
  canvasClickCallback: (x: number, y: number) => void;
  padConnectionCallback: (id: string) => void;
  objectDeleteCallback: (id: string) => void;
  objectMoveCallback: (id: string, dx: number, dy: number) => void;
};

export function Canvas({ objects, activeTool, selectedObjectIDs, traceDraft, objectSelectedCallback, boxSelectionCallback, canvasClickCallback, padConnectionCallback, objectDeleteCallback, objectMoveCallback }: CanvasProps) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [camera, setCamera] = useState({ centerX: 300, centerY: 200, zoom: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const [traceCursor, setTraceCursor] = useState<Point | null>(null);
  const panState = useRef<{ pointerID: number; clientX: number; clientY: number; centerX: number; centerY: number } | null>(null);
  const objectDragState = useRef<{ pointerID: number; objectID: string; clientX: number; clientY: number } | null>(null);
  const selectionStart = useRef<{ pointerID: number; x: number; y: number; additive: boolean } | null>(null);
  const [selectionBox, setSelectionBox] = useState<{ startX: number; startY: number; endX: number; endY: number } | null>(null);
  const spacePressed = useRef(false);
  const suppressNextClick = useRef(false);

  const viewWidth = 600 / camera.zoom;
  const viewHeight = viewWidth * canvasSize.height / canvasSize.width;
  const viewX = camera.centerX - viewWidth / 2;
  const viewY = camera.centerY - viewHeight / 2;
  const sceneScale = 1 + objects.length / 8;
  const minimumZoom = Math.max(0.005, 0.25 / (sceneScale * sceneScale));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas === null) return;

    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
        setCanvasSize({ width: entry.contentRect.width, height: entry.contentRect.height });
      }
    });
    observer.observe(canvas);
    return () => observer.disconnect();
  }, []);

  function screenToWorld(svg: SVGSVGElement, clientX: number, clientY: number): Point {
    const point = svg.createSVGPoint();
    point.x = clientX;
    point.y = clientY;
    const canvasPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    return { id: "pointer", x: canvasPoint.x, y: canvasPoint.y };
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.code === "Space") {
        spacePressed.current = true;
        if (event.target === document.body) event.preventDefault();
      }
    }
    function handleKeyUp(event: KeyboardEvent) {
      if (event.code === "Space") spacePressed.current = false;
    }
    function handleBlur() {
      spacePressed.current = false;
    }

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("blur", handleBlur);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("blur", handleBlur);
    };
  }, []);

  function handleCanvasClick(event: MouseEvent<SVGSVGElement>) {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      return;
    }
    if (activeTool === "select") return;

    const canvasPoint = screenToWorld(event.currentTarget, event.clientX, event.clientY);
    canvasClickCallback(canvasPoint.x, canvasPoint.y);
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
    const worldX = camera.centerX + normalizedX * viewWidth;
    const worldY = camera.centerY + normalizedY * viewHeight;
    const nextZoom = Math.min(8, Math.max(minimumZoom, camera.zoom * Math.exp(-event.deltaY * 0.0015)));
    const nextWidth = 600 / nextZoom;
    const nextHeight = nextWidth * canvasSize.height / canvasSize.width;

    setCamera({
      zoom: nextZoom,
      centerX: worldX - normalizedX * nextWidth,
      centerY: worldY - normalizedY * nextHeight,
    });
  }

  function handlePointerDown(event: PointerEvent<SVGSVGElement>) {
    const target = event.target as SVGElement;
    const isBackground = target === event.currentTarget || target.dataset.canvasBackground === "true" || target.dataset.selectionSurface === "true";
    if (event.button === 0 && activeTool === "select" && isBackground && !spacePressed.current) {
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
      const point = screenToWorld(event.currentTarget, event.clientX, event.clientY);
      selectionStart.current = { pointerID: event.pointerId, x: point.x, y: point.y, additive: event.ctrlKey || event.metaKey };
      setSelectionBox({ startX: point.x, startY: point.y, endX: point.x, endY: point.y });
      return;
    }

    const canPan = event.button === 1 || (event.button === 0 && spacePressed.current) || (event.button === 0 && activeTool === null && isBackground);
    if (!canPan) return;

    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    panState.current = {
      pointerID: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      centerX: camera.centerX,
      centerY: camera.centerY,
    };
  }

  function handlePointerMove(event: PointerEvent<SVGSVGElement>) {
    const objectDrag = objectDragState.current;
    if (objectDrag !== null && objectDrag.pointerID === event.pointerId) {
      const dx = event.clientX - objectDrag.clientX;
      const dy = event.clientY - objectDrag.clientY;
      if (Math.abs(dx) + Math.abs(dy) < 1) return;
      suppressNextClick.current = true;
      objectMoveCallback(
        objectDrag.objectID,
        dx * viewWidth / canvasSize.width,
        dy * viewHeight / canvasSize.height,
      );
      objectDrag.clientX = event.clientX;
      objectDrag.clientY = event.clientY;
      return;
    }

    const selection = selectionStart.current;
    if (selection !== null && selection.pointerID === event.pointerId) {
      const point = screenToWorld(event.currentTarget, event.clientX, event.clientY);
      setSelectionBox({ startX: selection.x, startY: selection.y, endX: point.x, endY: point.y });
      return;
    }

    const pan = panState.current;
    if (pan !== null && pan.pointerID === event.pointerId) {
      const dx = event.clientX - pan.clientX;
      const dy = event.clientY - pan.clientY;
      if (Math.abs(dx) + Math.abs(dy) > 3) suppressNextClick.current = true;
      setCamera((current) => ({
        ...current,
        centerX: pan.centerX - dx * viewWidth / canvasSize.width,
        centerY: pan.centerY - dy * viewHeight / canvasSize.height,
      }));
      return;
    }

    if (activeTool === "trace" && traceDraft !== null) {
      const svg = event.currentTarget;
      const point = svg.createSVGPoint();
      point.x = event.clientX;
      point.y = event.clientY;
      const canvasPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
      setTraceCursor({ id: "trace-cursor", x: canvasPoint.x, y: canvasPoint.y });
    }
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (objectDragState.current?.pointerID === event.pointerId) {
      objectDragState.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    if (selectionStart.current?.pointerID === event.pointerId && selectionBox !== null) {
      const left = Math.min(selectionBox.startX, selectionBox.endX);
      const right = Math.max(selectionBox.startX, selectionBox.endX);
      const top = Math.min(selectionBox.startY, selectionBox.endY);
      const bottom = Math.max(selectionBox.startY, selectionBox.endY);
      const selectedIDs = objects.filter((object) => {
        if (object.type === "substrate") {
          return object.x >= left && object.x + object.width <= right && object.y >= top && object.y + object.height <= bottom;
        }
        if (object.type === "pad") {
          const objectLeft = object.center.x - object.width / 2;
          const objectTop = object.center.y - object.height / 2;
          return objectLeft >= left && objectLeft + object.width <= right && objectTop >= top && objectTop + object.height <= bottom;
        }
        if (object.type === "dip") {
          const xs = object.pins.flatMap((pin) => [pin.center.x - pin.width / 2, pin.center.x + pin.width / 2]);
          const ys = object.pins.flatMap((pin) => [pin.center.y - pin.height / 2, pin.center.y + pin.height / 2]);
          return Math.min(...xs) >= left && Math.max(...xs) <= right && Math.min(...ys) >= top && Math.max(...ys) <= bottom;
        }
        const xs = object.points.map((point) => point.x);
        const ys = object.points.map((point) => point.y);
        const halfWidth = object.width / 2;
        return Math.min(...xs) - halfWidth >= left
          && Math.max(...xs) + halfWidth <= right
          && Math.min(...ys) - halfWidth >= top
          && Math.max(...ys) + halfWidth <= bottom;
      }).map((object) => object.id);
      suppressNextClick.current = true;
      boxSelectionCallback(selectedIDs, selectionStart.current.additive);
      selectionStart.current = null;
      setSelectionBox(null);
      if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
      return;
    }
    if (panState.current?.pointerID !== event.pointerId) return;
    panState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function handleObjectClick(event: MouseEvent<SVGElement>, object: SceneObject) {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      event.stopPropagation();
      return;
    }
    if (activeTool === "select") {
      event.stopPropagation();
      objectSelectedCallback(object.id, event.ctrlKey || event.metaKey);
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

  function handleObjectPointerDown(event: PointerEvent<SVGGElement>, object: SceneObject) {
    if (activeTool !== "select" || !selectedObjectIDs.includes(object.id) || object.type === "substrate" || event.button !== 0 || event.ctrlKey || event.metaKey) return;
    event.preventDefault();
    event.stopPropagation();
    canvasRef.current?.setPointerCapture(event.pointerId);
    objectDragState.current = {
      pointerID: event.pointerId,
      objectID: object.id,
      clientX: event.clientX,
      clientY: event.clientY,
    };
  }

  function handleDipPinClick(event: MouseEvent<SVGRectElement>, object: Extract<SceneObject, { type: "dip" }>, pinID: string) {
    if (activeTool === "trace") {
      event.stopPropagation();
      padConnectionCallback(pinID);
      return;
    }
    handleObjectClick(event, object);
  }

  const draftStartPad = traceDraft === null ? undefined : findPad(objects, traceDraft.startPadId);
  const draftPoints = draftStartPad && traceDraft && traceCursor
    ? buildOpenTracePath(draftStartPad, traceDraft.waypoints, traceCursor)
    : [];
  const renderOrder = { substrate: 0, trace: 1, dip: 2, pad: 2 } as const;
  const renderedObjects = [...objects].sort((a, b) => renderOrder[a.type] - renderOrder[b.type]);

  return (
    <svg
      ref={canvasRef}
      viewBox={`${viewX} ${viewY} ${viewWidth} ${viewHeight}`}
      role="img"
      aria-label="Printed electronics design canvas"
      onClick={handleCanvasClick}
      onWheel={handleWheel}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={() => setTraceCursor(null)}
      style={{ cursor: activeTool === null ? "grab" : activeTool === "select" ? "crosshair" : activeTool === "delete" ? "pointer" : "crosshair", touchAction: "none" }}
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
      <rect data-canvas-background="true" x={viewX} y={viewY} width={viewWidth} height={viewHeight} fill="#edf1f5" />
      <rect data-canvas-background="true" x={viewX} y={viewY} width={viewWidth} height={viewHeight} fill="url(#major-grid)" />
      {renderedObjects.map((object) => {
        switch (object.type) {
          case "substrate":
            return (
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)}>
                <rect
                  data-selection-surface="true"
                  x={object.x}
                  y={object.y}
                  width={object.width}
                  height={object.height}
                  fill="#ffffff"
                  stroke="#8fa0b2"
                  strokeWidth={1.2}
                />
                {selectedObjectIDs.includes(object.id) && (
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
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)} onPointerDown={(event) => handleObjectPointerDown(event, object)} style={{ cursor: activeTool === "select" && selectedObjectIDs.includes(object.id) ? "move" : undefined }}>
                <rect
                  x={object.center.x - object.width / 2}
                  y={object.center.y - object.height / 2}
                  width={object.width}
                  height={object.height}
                  fill="#218ed5"
                  stroke="#0868ad"
                  strokeWidth={1.5}
                />
                {(selectedObjectIDs.includes(object.id) || traceDraft?.startPadId === object.id) && (
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

          case "dip": {
            const rows = Math.max(1, object.config.padCount / 2);
            const bodyHeight = Math.max(object.config.pitch, (rows - 1) * object.config.pitch + object.config.padHeight * 0.6);
            const bodyWidth = Math.max(24, object.config.columnSpacing - object.config.padWidth);
            return (
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)} onPointerDown={(event) => handleObjectPointerDown(event, object)} style={{ cursor: activeTool === "select" && selectedObjectIDs.includes(object.id) ? "move" : undefined }}>
                <rect x={object.center.x - bodyWidth / 2} y={object.center.y - bodyHeight / 2} width={bodyWidth} height={bodyHeight} rx={5} fill="#f7f9fb" stroke="#748497" strokeWidth={1.5} />
                <path d={`M ${object.center.x - 7} ${object.center.y - bodyHeight / 2} A 7 7 0 0 0 ${object.center.x + 7} ${object.center.y - bodyHeight / 2}`} fill="none" stroke="#748497" strokeWidth={1.2} />
                {object.pins.map((pin) => (
                  <g key={pin.id}>
                    <rect
                      x={pin.center.x - pin.width / 2}
                      y={pin.center.y - pin.height / 2}
                      width={pin.width}
                      height={pin.height}
                      fill="#218ed5"
                      stroke="#0868ad"
                      strokeWidth={1.5}
                      onClick={(event) => handleDipPinClick(event, object, pin.id)}
                    />
                    {traceDraft?.startPadId === pin.id && (
                      <rect x={pin.center.x - pin.width / 2} y={pin.center.y - pin.height / 2} width={pin.width} height={pin.height} fill="#ffffff" fillOpacity={0.22} stroke="#00a6c8" strokeWidth={3} strokeDasharray="5 3" pointerEvents="none" />
                    )}
                  </g>
                ))}
                {selectedObjectIDs.includes(object.id) && (
                  <rect x={object.center.x - object.config.columnSpacing / 2 - object.config.padWidth / 2} y={object.center.y - ((rows - 1) * object.config.pitch + object.config.padHeight) / 2} width={object.config.columnSpacing + object.config.padWidth} height={(rows - 1) * object.config.pitch + object.config.padHeight} fill="#ffffff" fillOpacity={0.12} stroke="#075d9b" strokeWidth={2.5} pointerEvents="none" />
                )}
              </g>
            );
          }

          case "trace":
            return (
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)} onPointerDown={(event) => handleObjectPointerDown(event, object)} style={{ cursor: activeTool === "select" && selectedObjectIDs.includes(object.id) ? "move" : undefined }}>
                {selectedObjectIDs.includes(object.id) && (
                  <polyline
                    points={object.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#075d9b"
                    strokeWidth={object.width + 5}
                    strokeLinecap="square"
                    strokeLinejoin="round"
                    pointerEvents="none"
                  />
                )}
                <polyline
                  points={object.points.map((point) => `${point.x},${point.y}`).join(" ")}
                  fill="none"
                  stroke="#1687d9"
                  strokeWidth={object.width}
                  strokeLinecap="square"
                  strokeLinejoin="round"
                />
                {selectedObjectIDs.includes(object.id) && (
                  <polyline
                    points={object.points.map((point) => `${point.x},${point.y}`).join(" ")}
                    fill="none"
                    stroke="#ffffff"
                    strokeOpacity={0.2}
                    strokeWidth={object.width}
                    strokeLinecap="square"
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
            strokeWidth={25}
            strokeOpacity={0.55}
            strokeLinecap="square"
            strokeLinejoin="round"
          />
          {traceDraft?.waypoints.map((point) => (
            <circle key={point.id} cx={point.x} cy={point.y} r={3.5} fill="#ffffff" stroke="#1687d9" strokeWidth={1.5} />
          ))}
          <circle cx={draftPoints.at(-1)?.x} cy={draftPoints.at(-1)?.y} r={4} fill="#ffffff" stroke="#0868ad" strokeWidth={1.5} />
          {objects.flatMap((object) => object.type === "pad" ? [object] : object.type === "dip" ? object.pins : []).map((pad) => (
            <rect
              key={`draft-cover-${pad.id}`}
              x={pad.center.x - pad.width / 2}
              y={pad.center.y - pad.height / 2}
              width={pad.width}
              height={pad.height}
              fill="#218ed5"
              stroke="#0868ad"
              strokeWidth={1.5}
            />
          ))}
          {draftStartPad && (
            <rect
              x={draftStartPad.center.x - draftStartPad.width / 2}
              y={draftStartPad.center.y - draftStartPad.height / 2}
              width={draftStartPad.width}
              height={draftStartPad.height}
              fill="#ffffff"
              fillOpacity={0.22}
              stroke="#00a6c8"
              strokeWidth={3}
              strokeDasharray="5 3"
            />
          )}
        </g>
      )}
      {selectionBox !== null && (
        <rect
          x={Math.min(selectionBox.startX, selectionBox.endX)}
          y={Math.min(selectionBox.startY, selectionBox.endY)}
          width={Math.abs(selectionBox.endX - selectionBox.startX)}
          height={Math.abs(selectionBox.endY - selectionBox.startY)}
          fill="#1687d9"
          fillOpacity={0.1}
          stroke="#1687d9"
          strokeWidth={1.2 / camera.zoom}
          strokeDasharray={`${5 / camera.zoom} ${3 / camera.zoom}`}
          pointerEvents="none"
        />
      )}
    </svg>
  );
}
