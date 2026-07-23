import "../styling/Banner.css"

type toolbarProps = {
    toolbarClickCallback: (tool: "select" | "pad" | "trace" | "delete") => void;
    selectedTool: "select" | "pad" | "trace" | "delete";
};

export function Toolbar({toolbarClickCallback, selectedTool}: toolbarProps) {
    return (
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
            <button className={`tool-button ${selectedTool === "trace" ? "active" : ""}`} onClick={() => toolbarClickCallback("trace")} aria-pressed={selectedTool === "trace"} title="Draw traces">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="5" cy="17" r="2"/><circle cx="19" cy="7" r="2"/><path d="M7 17h4l2-10h4"/></svg>
                Trace
            </button>
            <span className="tool-divider" aria-hidden="true" />
            <button className={`tool-button delete-tool ${selectedTool === "delete" ? "active" : ""}`} onClick={() => toolbarClickCallback("delete")} aria-pressed={selectedTool === "delete"} title="Delete objects">
                <svg className="tool-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>
                Delete
            </button>
        </nav>
    )
}
