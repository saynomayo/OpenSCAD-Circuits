**7/15/25**
- Initialized project and repository
- Installed NodeJS

**TODO**
- Create React Project
- Remove starter content and replace with simple page structure
- Create first data model (Point, Substrate, Pad, Trace)
  - e.g export type Point = {
            x: number;
            y: number;
        };
    I believe the renderer references this to determine what objects are present every time something is added to the editor
- Create a hardcoded scene (simply add pads and trace, substrate beneath) and render
  - Proves that the architecture for the project works thus far

**7/16/25**
- data models added to geometry
  - trace
  - pad
  - substrate
  - point
- point is a representation of x and y coordinate
- substrate has a center point? and then height and width added to it
  - but currently it has explicit x and y
  - instead a center should be given, and should represent the circuit platform
  - all other objects must reside inside of the center of this platform
  - so the substrate also influences a bounding box
- pads have a center, alongside height and width
- A trace is made up of points, with interpolated length between them

- sampleScene.ts builds objects out of the geometry models, filling out the fields for each one

- Canvas.tsx actually draws the SVG using the objects built from sampleScene
  - uses objects.map((object)) to iterate through each object in an object list (function input) and places on SVG

- App.tsx displays the app on the webpage. This calls Canvas function from Canvas.tsx with sampleScene.

**TODO**
- Add object selection **[X]**
- upon selection, a panel opens **[]** and displayed selected object's information **[]**
- Maybe instead of making an editor or circuit builder, the 

**7/20/26**
- Project will require a structural overhaul




