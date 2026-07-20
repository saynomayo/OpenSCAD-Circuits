import type { SceneObject} from "../model/geometry";
import "../styling/InformationPanel.css"

type InformationPanelProps = {
    object: SceneObject | undefined;
};

export function InformationPanel({object}: InformationPanelProps) {
    if (object === undefined) {
        return (
            <div className="ui-panel">
                <div className="panel-header">Object Information</div>
                <div className="panel-body"><p>No Object Selected.</p></div>
                <div className="panel-footer">sub-info here</div>
            </div>
        )
    }
    return (
        <div 
        className="ui-panel">
        <div className="panel-header">Object Information</div>
        <div className="panel-body"><p>Object: {object.id}</p></div>
        <div className="panel-footer">Object Type: {object.type}</div>
        </div>
    );
}