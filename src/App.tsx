import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useState } from 'react';
import { InformationPanel } from "./components/InformationPanel";
import "./styling/App.css"
import { ObjectBanner } from "./components/ObjectBanner";

function App() {
  const [selectedObjectID, setSelectedObject] = useState<string>(null);
  const selectedObject = sampleScene.find((object) => selectedObjectID === object.id);
  return (
    <div className="app">
      <div className="banner">
        <ObjectBanner pad={null} trace={null}/>
      </div>
      <div className="side-panel">
        <InformationPanel object={selectedObject}/>
      </div>
      <div className="canvas">
        <Canvas objects={sampleScene} ObjectSelectedCallback={setSelectedObject}/>
      </div>
    </div>
  );
}

export default App;