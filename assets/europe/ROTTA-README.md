# Regional chart data

Coastline source: GSHHG 2.3.7, full resolution, modern coastline.
Original project: https://www.soest.hawaii.edu/pwessel/gshhg/
Upstream license and attribution: LICENSE.TXT, COPYING.LESSERv3 and README.TXT in this directory.

Rotta projects and clips this data to 32° W–44° E / 25° N–72° N, then derives SVG land/coastline chunks, a packed water mask and navigation edges. Harbour approaches and water-only narrow-strait routes are game annotations. Rendering and collision use the same chart coordinates.

`chart.json`: geometry and harbour metadata; `water.bin`: 1 bit per pixel, little bit order; `graph.bin`: 8-neighbour edge flags; `distances.json`: sailing-distance table.

Rebuild tools and source attribution are maintained in the Rotta development repository under tools/europe/.
