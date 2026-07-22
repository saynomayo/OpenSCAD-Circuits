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
    switch(object.type) {
        case "substrate":
            return (
                <div 
                className="ui-panel">
                <div className="panel-header">Object Information</div>
                <div className="panel-body"><p>Object: {object.id}</p></div>
                <div className="panel-footer">Object Type: {object.type}</div>
                </div>
            );
        case "pad":
            return (
                <div 
                className="ui-panel">
                <div className="panel-header">Object Information</div>
                <div className="panel-body"><p>Object: {object.id}</p></div>
                <div className="panel-footer">Object Type: {object.type}<br />X Pos: <input type="number" value={object.center.x}></input><br />Y Pos:<input type="number" value={object.center.y}></input></div>
                </div>
            );
        case "trace":
            return (
                <div 
                className="ui-panel">
                <div className="panel-header">Object Information</div>
                <div className="panel-body"><p>Object: {object.id}</p></div>
                <div className="panel-footer">Object Type: {object.type}
                    <br />
                    Num of Points: {object.points.length} 
                    <div style={{color:"black"}}><ul>
                        {object.points.map((point, index) => (
                            <li key={index}>
                                Point: {point.id}: X Pos: {point.x}, Y Pos: {point.y}
                            </li>
                        ))}
                    </ul></div>
                    <br />
                </div>
                </div>
            );
    }
}