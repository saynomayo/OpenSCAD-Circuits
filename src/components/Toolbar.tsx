import "../styling/Banner.css"
import type { DipConfig } from "../model/geometry";

type toolbarProps = {
    toolbarClickCallback: (tool: "select" | "pad" | "dip" | "trace" | "delete") => void;
    selectedTool: "select" | "pad" | "dip" | "trace" | "delete" | null;
    exportCallback: () => void;
    dipConfig: DipConfig;
    dipConfigCallback: (config: DipConfig) => void;
};

export function Toolbar({toolbarClickCallback, selectedTool, exportCallback, dipConfig, dipConfigCallback}: toolbarProps) {
    return (
        <div className="toolbar-stack">
        <nav className="tool-palette" aria-label="Editor tools">
            <button className={`tool-button ${selectedTool === "select" ? "active" : ""}`} onClick={() => toolbarClickCallback("select")} aria-pressed={selectedTool === "select"} title="Select objects">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m5 3 13 8-6 2-3 6-4-16Z" /></svg>
                Select
            </button>
            <span className="tool-divider" aria-hidden="true" />
            <button className={`tool-button ${selectedTool === "pad" ? "active" : ""}`} onClick={() => toolbarClickCallback("pad")} aria-pressed={selectedTool === "pad"} title="Place pads">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="5" y="5" width="14" height="14" rx="2"/><circle cx="12" cy="12" r="2.5"/></svg>
                Pad
            </button>
            <button className={`tool-button ${selectedTool === "dip" ? "active" : ""}`} onClick={() => toolbarClickCallback("dip")} aria-pressed={selectedTool === "dip"} title="Place DIP packages">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="7" y="4" width="10" height="16" rx="2"/><path d="M4 7h3m-3 5h3m-3 5h3m10-10h3m-3 5h3m-3 5h3"/></svg>
                DIP
            </button>
            <button className={`tool-button ${selectedTool === "trace" ? "active" : ""}`} onClick={() => toolbarClickCallback("trace")} aria-pressed={selectedTool === "trace"} title="Draw traces">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17h4l2-10h4"/></svg>
                Trace
            </button>
            <span className="tool-divider" aria-hidden="true" />
            <button className={`tool-button delete-tool ${selectedTool === "delete" ? "active" : ""}`} onClick={() => toolbarClickCallback("delete")} aria-pressed={selectedTool === "delete"} title="Delete objects">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>
                Delete
            </button>
            <span className="tool-divider" aria-hidden="true" />
            <button className="tool-button" onClick={exportCallback} title="Export scene data as JSON">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 19h14"/></svg>
                Export
            </button>
        </nav>
        {selectedTool === "dip" && (
            <div className="dip-presets" aria-label="DIP pin count presets">
                <span>Pin count</span>
                {[4, 6, 8, 14, 16].map((padCount) => (
                    <button
                        key={padCount}
                        className={dipConfig.padCount === padCount ? "active" : ""}
                        onClick={() => dipConfigCallback({ ...dipConfig, padCount })}
                    >
                        {padCount}
                    </button>
                ))}
            </div>
        )}
        </div>
    )
}
