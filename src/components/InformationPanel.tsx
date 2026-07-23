import type { SceneObject } from "../model/geometry";
import "../styling/InformationPanel.css"

type InformationPanelProps = {
    object: SceneObject | undefined;
    activeTool: "select" | "pad" | "trace" | "delete";
    traceStartPadID: string | null;
};

function Field({ label, value }: { label: string; value: number }) {
    return (
        <div className="field">
            <label>{label}</label>
            <input className="field-value" type="number" value={value} readOnly />
        </div>
    );
}

export function InformationPanel({object, activeTool, traceStartPadID}: InformationPanelProps) {
    return (
        <section className="inspector" aria-label="Object inspector">
            <header className="inspector-header">
                <div>
                    <p className="inspector-eyebrow">Workspace</p>
                    <h2 className="inspector-title">Object Inspector</h2>
                </div>
                <span className="tool-status">{activeTool}</span>
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
                {object === undefined ? (
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
