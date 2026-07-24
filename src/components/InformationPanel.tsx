import type { DipConfig, SceneObject } from "../model/geometry";
import "../styling/InformationPanel.css"

type InformationPanelProps = {
    objects: SceneObject[];
    activeTool: "select" | "pad" | "dip" | "trace" | "delete" | null;
    traceStartPadID: string | null;
    dipUpdateCallback: (id: string, changes: Partial<DipConfig>) => void;
};

function Field({ label, value }: { label: string; value: number }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input className="field-value" type="number" value={value} readOnly />
        </div>
    );
}

function EditableField({ label, value, min = 1, step = 1, onChange }: { label: string; value: number; min?: number; step?: number; onChange: (value: number) => void }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input className="field-value editable" type="number" value={value} min={min} step={step} onChange={(event) => onChange(Number(event.target.value))} />
        </div>
    );
}

export function InformationPanel({objects, activeTool, traceStartPadID, dipUpdateCallback}: InformationPanelProps) {
    const object = objects.length === 1 ? objects[0] : undefined;
    return (
        <section className="inspector" aria-label="Object inspector">
            <header className="inspector-header">
                <div>
                    <p className="inspector-eyebrow">Workspace</p>
                    <h2 className="inspector-title">Object Inspector</h2>
                </div>
                <span className="tool-status">{activeTool ?? "no tool"}</span>
            </header>
            <div className="inspector-body">
                {activeTool === "trace" && (
                    <div className="connection-guide">
                        <span className="connection-step">{traceStartPadID === null ? "1" : "2"}</span>
                        <div>
                            <strong>{traceStartPadID === null ? "Choose a source pad" : "Choose a destination pad"}</strong>
                            <p>{traceStartPadID === null ? "A trace must begin on a pad." : `Connected from ${traceStartPadID}. Click the canvas for routing points, then select another pad.`}</p>
                        </div>
                    </div>
                )}
                {objects.length > 1 ? (
                    <div className="multi-selection">
                        <p className="property-label">Selection · {objects.length} objects</p>
                        <ul>
                            {objects.map((selectedObject) => (
                                <li key={selectedObject.id}>
                                    <span className="object-id">{selectedObject.id}</span>
                                    <span className="object-type">{selectedObject.type}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                ) : object === undefined ? (
                    <div className="empty-state">
                        <div className="empty-state-icon">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7"><path d="m5 3 13 8-6 2-3 6-4-16Z" /></svg>
                        </div>
                        <p>No object selected</p>
                        <span>Choose Select, then click an object on the canvas to inspect it.</span>
                    </div>
                ) : (
                    <>
                        <div className="property-section">
                            <p className="property-label">Selection</p>
                            <div className="object-summary">
                                <span className="object-id">{object.id}</span>
                                <span className="object-type">{object.type}</span>
                            </div>
                        </div>

                        {object.type === "substrate" && (
                            <div className="property-section">
                                <p className="property-label">Geometry</p>
                                <div className="property-grid">
                                    <Field label="X position" value={object.x} />
                                    <Field label="Y position" value={object.y} />
                                    <Field label="Width" value={object.width} />
                                    <Field label="Height" value={object.height} />
                                </div>
                            </div>
                        )}

                        {object.type === "pad" && (
                            <div className="property-section">
                                <p className="property-label">Geometry</p>
                                <div className="property-grid">
                                    <Field label="Center X" value={object.center.x} />
                                    <Field label="Center Y" value={object.center.y} />
                                    <Field label="Width" value={object.width} />
                                    <Field label="Height" value={object.height} />
                                </div>
                            </div>
                        )}

                        {object.type === "dip" && (
                            <>
                                <div className="property-section">
                                    <p className="property-label">Package geometry</p>
                                    <div className="property-grid">
                                        <EditableField label="Pad count" value={object.config.padCount} min={4} step={2} onChange={(value) => dipUpdateCallback(object.id, { padCount: Math.max(4, Math.round(value / 2) * 2) })} />
                                        <EditableField label="Pitch" value={object.config.pitch} onChange={(value) => dipUpdateCallback(object.id, { pitch: Math.max(1, value) })} />
                                        <EditableField label="Row spacing" value={object.config.columnSpacing} onChange={(value) => dipUpdateCallback(object.id, { columnSpacing: Math.max(1, value) })} />
                                        <span />
                                        <EditableField label="Pad width" value={object.config.padWidth} onChange={(value) => dipUpdateCallback(object.id, { padWidth: Math.max(1, value) })} />
                                        <EditableField label="Pad height" value={object.config.padHeight} onChange={(value) => dipUpdateCallback(object.id, { padHeight: Math.max(1, value) })} />
                                    </div>
                                </div>
                                <div className="property-section">
                                    <p className="property-label">Pins · {object.pins.length}</p>
                                    <div className="connection-pair"><span>{object.pins[0]?.id}</span><span>…</span><span>{object.pins.at(-1)?.id}</span></div>
                                </div>
                            </>
                        )}

                        {object.type === "trace" && (
                            <>
                                <div className="property-section">
                                    <p className="property-label">Connections</p>
                                    <div className="connection-pair">
                                        <span>{object.startPadId}</span>
                                        <span aria-hidden="true">→</span>
                                        <span>{object.endPadId}</span>
                                    </div>
                                </div>
                                <div className="property-section">
                                    <p className="property-label">Path · {object.points.length} points</p>
                                    <ul className="trace-points">
                                        {object.points.map((point, index) => (
                                            <li key={point.id}>
                                                <strong>P{index + 1}</strong>
                                                <span>X {Math.round(point.x)}</span>
                                                <span>Y {Math.round(point.y)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        )}
                    </>
                )}
            </div>
        </section>
    );
}
