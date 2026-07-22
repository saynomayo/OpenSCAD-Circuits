import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useState } from 'react';
import { InformationPanel } from "./components/InformationPanel";
import { Toolbar } from "./components/Toolbar";
import "./styling/App.css"

function App() {
  const [selectedObjectID, setSelectedObject] = useState<string>(null);
  const selectedObject = sampleScene.find((object) => selectedObjectID === object.id);
  const [activeTool, setActiveTool] = useState("select");
  return (
    <div className="app">
      <div className="banner">
        <Toolbar toolbarClickCallback={setActiveTool} selectedTool={activeTool}/>
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