# Regional chart data

Coastline source: GSHHG 2.3.7, full resolution, modern coastline.
Original project: https://www.soest.hawaii.edu/pwessel/gshhg/
Upstream license and attribution: LICENSE.TXT, COPYING.LESSERv3 and README.TXT in this directory.

Rotta projects and clips this data to 32° W–44° E / 25° N–72° N, then derives a packed water mask and navigation edges. Harbour approaches and water-only narrow-strait routes are game annotations. Rendering and collision use the same chart coordinates.

`terrain/` contains the overview and zoom-level WebP tiles rendered from the water mask and NOAA ETOPO 2022 elevation and bathymetry (15 arc-seconds, WGS 84). Relief source: https://www.ncei.noaa.gov/products/etopo-global-relief-model. The surface GeoTIFFs are published at https://www.ngdc.noaa.gov/mgg/global/relief/ETOPO2022/data/15s/15s_surface_elev_gtif/.

`chart.json` contains source geometry and harbour metadata. The game loads `navigation.json` for harbour metadata, `water.bin` for the 1-bit water mask, `graph.bin` for navigation edges and `distances.json` for sailing distances.

Rebuild tools and source attribution are maintained in the Rotta development repository under tools/europe/.
