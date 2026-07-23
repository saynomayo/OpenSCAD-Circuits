import { useEffect, useRef, useState } from "react";
import type { MouseEvent, PointerEvent, WheelEvent } from "react";
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
  objectMoveCallback: (id: string, dx: number, dy: number) => void;
};

export function Canvas({ objects, activeTool, selectedObjectID, traceDraft, objectSelectedCallback, canvasClickCallback, padConnectionCallback, objectDeleteCallback, objectMoveCallback }: CanvasProps) {
  const canvasRef = useRef<SVGSVGElement>(null);
  const [camera, setCamera] = useState({ centerX: 300, centerY: 200, zoom: 1 });
  const [canvasSize, setCanvasSize] = useState({ width: 600, height: 400 });
  const panState = useRef<{ pointerID: number; clientX: number; clientY: number; centerX: number; centerY: number } | null>(null);
  const objectDragState = useRef<{ pointerID: number; objectID: string; clientX: number; clientY: number } | null>(null);
  const spacePressed = useRef(false);
  const suppressNextClick = useRef(false);

  const viewWidth = 600 / camera.zoom;
  const viewHeight = viewWidth * canvasSize.height / canvasSize.width;
  const viewX = camera.centerX - viewWidth / 2;
  const viewY = camera.centerY - viewHeight / 2;

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

    const svg = event.currentTarget;
    const point = svg.createSVGPoint();
    point.x = event.clientX;
    point.y = event.clientY;
    const canvasPoint = point.matrixTransform(svg.getScreenCTM()?.inverse());
    canvasClickCallback(canvasPoint.x, canvasPoint.y);
  }

  function handleWheel(event: WheelEvent<SVGSVGElement>) {
    event.preventDefault();
    const bounds = event.currentTarget.getBoundingClientRect();
    const normalizedX = (event.clientX - bounds.left) / bounds.width - 0.5;
    const normalizedY = (event.clientY - bounds.top) / bounds.height - 0.5;
    const worldX = camera.centerX + normalizedX * viewWidth;
    const worldY = camera.centerY + normalizedY * viewHeight;
    const nextZoom = Math.min(8, Math.max(0.25, camera.zoom * Math.exp(-event.deltaY * 0.0015)));
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
    const isBackground = target === event.currentTarget || target.dataset.canvasBackground === "true";
    const canPan = event.button === 1 || (event.button === 0 && spacePressed.current) || (event.button === 0 && activeTool === "select" && isBackground);
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

    const pan = panState.current;
    if (pan === null || pan.pointerID !== event.pointerId) return;
    const dx = event.clientX - pan.clientX;
    const dy = event.clientY - pan.clientY;
    if (Math.abs(dx) + Math.abs(dy) > 3) suppressNextClick.current = true;
    setCamera((current) => ({
      ...current,
      centerX: pan.centerX - dx * viewWidth / canvasSize.width,
      centerY: pan.centerY - dy * viewHeight / canvasSize.height,
    }));
  }

  function handlePointerUp(event: PointerEvent<SVGSVGElement>) {
    if (objectDragState.current?.pointerID === event.pointerId) {
      objectDragState.current = null;
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      return;
    }
    if (panState.current?.pointerID !== event.pointerId) return;
    panState.current = null;
    event.currentTarget.releasePointerCapture(event.pointerId);
  }

  function resetCamera() {
    setCamera({ centerX: 300, centerY: 200, zoom: 1 });
  }

  function handleObjectClick(event: MouseEvent<SVGElement>, object: SceneObject) {
    if (suppressNextClick.current) {
      suppressNextClick.current = false;
      event.stopPropagation();
      return;
    }
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

  function handleObjectPointerDown(event: PointerEvent<SVGGElement>, object: SceneObject) {
    if (activeTool !== "select" || selectedObjectID !== object.id || object.type === "substrate" || event.button !== 0) return;
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

  const draftStartPad = traceDraft === null
    ? undefined
    : objects.find((object) => object.id === traceDraft.startPadId && object.type === "pad");
  const draftPoints = draftStartPad?.type === "pad" && traceDraft && traceDraft.waypoints.length > 0
    ? [padEdgePoint(draftStartPad, traceDraft.waypoints[0]), ...traceDraft.waypoints]
    : [];
  const renderOrder = { substrate: 0, trace: 1, pad: 2 } as const;
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
      onDoubleClick={activeTool === "select" ? resetCamera : undefined}
      style={{ cursor: activeTool === "select" ? "grab" : activeTool === "delete" ? "pointer" : "crosshair", touchAction: "none" }}
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
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)} onPointerDown={(event) => handleObjectPointerDown(event, object)} style={{ cursor: activeTool === "select" && selectedObjectID === object.id ? "move" : undefined }}>
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
              <g key={object.id} onClick={(event) => handleObjectClick(event, object)} onPointerDown={(event) => handleObjectPointerDown(event, object)} style={{ cursor: activeTool === "select" && selectedObjectID === object.id ? "move" : undefined }}>
                {selectedObjectID === object.id && (
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
                {selectedObjectID === object.id && (
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
            strokeWidth={4}
            strokeDasharray="7 5"
            strokeLinecap="square"
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
