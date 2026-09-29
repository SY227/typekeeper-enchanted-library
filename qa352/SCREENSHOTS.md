# QA screenshots in this full handoff

The test runners originally captured PNG frames. To avoid shipping hundreds of
megabytes of duplicate art, QA captures are supplied as adjacent `.preview.webp`
images. `screenshot-preview-index.json` maps every original PNG path and SHA-256
to its preview. These are compressed presentation previews, not claims of bitwise
identical PNG pixels. Original raster/geometry assertions were executed before
compression and their numeric JSON/logs are retained. Game artwork, public/dist
assets and editable masters are not altered. Running a harness recreates its PNGs.
