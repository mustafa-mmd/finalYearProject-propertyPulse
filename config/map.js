import * as maplibregl from "maplibre-gl";

if (typeof window !== "undefined") {
  maplibregl.setWorkerUrl("/maplibre-gl-worker.mjs");
}

export const OSM_RASTER_STYLE = Object.freeze({
  version: 8,
  sources: {
    "osm-tiles": {
      type: "raster",
      tiles: [
        "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://b.tile.openstreetmap.org/{z}/{x}/{y}.png",
        "https://c.tile.openstreetmap.org/{z}/{x}/{y}.png",
      ],
      tileSize: 256,
    },
  },
  layers: [
    {
      id: "osm-tiles-layer",
      type: "raster",
      source: "osm-tiles",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
});

export const MAP_STYLES = Object.freeze({
  osm: OSM_RASTER_STYLE,
  positron: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
  liberty: "https://tiles.openfreemap.org/styles/liberty",
});

export const DEFAULT_MAP_STYLE = MAP_STYLES.osm;

export const DEFAULT_MAP_LOCATION = Object.freeze({
  latitude: 24.7136,
  longitude: 46.6753,
  zoom: 11,
});

export const PROPERTY_MAP_ZOOM = 15;



