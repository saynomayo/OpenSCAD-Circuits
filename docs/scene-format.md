# Circuit scene format

Circuit scenes are automatically persisted in browser local storage under `openscad-circuits.scene.v1` and can be downloaded from the toolbar as `circuit.scene.json`.

The JSON document is intentionally independent of React and SVG. Objects are grouped by their circuit role rather than encoded as renderer-specific variants.

```json
{
  "format": "openscad-circuits",
  "version": 1,
  "units": "canvas-units",
  "updatedAt": "2026-07-23T00:00:00.000Z",
  "circuit": {
    "substrates": [{ "id": "substrate-1", "x": 50, "y": 50, "width": 500, "height": 300 }],
    "pads": [{ "id": "pad-1", "x": 150, "y": 200, "width": 50, "height": 50 }],
    "dips": [{ "id": "dip-1", "x": 300, "y": 200, "padCount": 8, "padWidth": 28, "padHeight": 14, "columnSpacing": 100, "pitch": 36 }],
    "traces": [{
      "id": "trace-1",
      "startPadId": "pad-1",
      "endPadId": "pad-2",
      "width": 25,
      "waypoints": [{ "x": 300, "y": 200 }],
      "resolvedPath": [{ "x": 175, "y": 200 }, { "x": 425, "y": 200 }]
    }]
  }
}
```

`waypoints` records editing intent. `resolvedPath` records the exact interpolated geometry displayed by the renderer. Parent pad IDs make every completed trace connection explicit.
