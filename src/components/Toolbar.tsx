import "../styling/Banner.css"

type toolbarProps = {
    toolbarClickCallback: (string) => void;
    selectedTool: (string);
};

export function Toolbar({toolbarClickCallback, selectedTool}: toolbarProps) {
    return (
        <div className="ui-banner">
            <div className="selected-tool">{selectedTool}</div>
            <button onClick={() => toolbarClickCallback("select")}>Select</button>
            <button onClick={() => toolbarClickCallback("pad")}>Pad</button>
            <button onClick={() => toolbarClickCallback("trace")}>Trace</button>
        </div> 
    )
}
