import type { SceneObject} from "../model/geometry";
import "../styling/Banner.css"

type ObjectBannerProps = {
    pad: SceneObject;
    trace: SceneObject;
}

export function ObjectBanner({}: ObjectBannerProps) {
    return (
        <div className="ui-banner">
            here is the component placement banner
        </div> 
    )
}
