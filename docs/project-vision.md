This project exists to create a simple place, drag, and connect system for OpenSCAD, specifically tailored towards 3D printed circuit/electronics.
This project will also serve to validate preexisting designs

Why is the application directory set up this way?
Four responsibilities
- User interacts
- Editor
- Application data
- Rules & Algorithms
- OpenSCAD Export

**src/**
- Code lives here
**components/**
- Reusable pieces of interface
  - Toolbar
  - Property Panel
  - Object List
  - Status Bar
  - Error List
  - Layer List
- These are not specific to any drawing or part. Properties panel will just display properties of whatever is edited, regadless.
**editor/**
- This folder contains the CAD Editor
  - Canvas
  - Selection
  - DragTool
  - ZoomTool
  - PanTool
  - SnapManager
- Electronics are a total black box to the editor
**geometry**
- This folder contains the math
  - distance()
  - intersects()
  - rotatePoint()
  - boundingBox()
  - closesPointOnSegment()
  - polygonIntersection()
- Reusable algorithms
- DRC, snapping system, routing, exporter will use these
**drc/**
- The design rule checker
- doesn't draw anything, instead asks questions to each component of a drawing
  - checkComponentType
  - checkWidth
  - checkHeight
  - checkResistance
  - checkClearance
  - checkOverlaps
- Every function in the DRC contains a list of violations
- May also affect the scene to highlight where violations are present
**export/**
- Converts scene into other formats
  - OpenSCAD to begin
  - Later, 
    - STL
    - 3MF
    - JSON
    - SVG
    - Netlist
**model/**
- Defines what exists in the world
  - Pad
  - Trace
  - Substrate
  - Connection
  - Material
  - Resistor
  - Component gap
- This is just data
  - Pad may containt
    - id
    - pos
    - width
    - height
    - material
  - Only describes what a pad is, or any other existing model, but does not draw it
**utils/**
- Helper functions that don't necessary belong anywhere else
**public/**
- files copied direcltly into final website
**tests/**
- geometry.test.ts
- drc.test.ts
- export.test.ts