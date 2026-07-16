import { Canvas } from "./editor/Canvas";
import { sampleScene } from "./model/sampleScene";

function App() {
  return (
    <main>
      <h1>Printed Electronics CAD</h1>
      <Canvas objects={sampleScene} />
    </main>
  );
}

export default App;