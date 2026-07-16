import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";
import { useState } from 'react';

function App() {
  const [selectedObject, setSelectedObject] = useState(null);
  return (
    <main>
      <h1>Printed Electronics CAD</h1>
      <p>Selected: {selectedObject}</p>
      <Canvas objects={sampleScene} ObjectSelectedCallback={setSelectedObject}/>
    </main>
  );
}

export default App;