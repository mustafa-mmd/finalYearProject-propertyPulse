"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  FullscreenControl,
  Layer,
  NavigationControl,
  Popup,
  Source,
} from "react-map-gl/maplibre";
import { DEFAULT_MAP_LOCATION, DEFAULT_MAP_STYLE } from "@/config/map";
import {
  buildLocationLabel,
  hasCoordinates,
  normalizeLocation,
} from "@/utils/location";

const clusterLayer = {
  id: "property-clusters",
  type: "circle",
  source: "properties",
  filter: ["has", "point_count"],
  paint: {
    "circle-color": [
      "step",
      ["get", "point_count"],
      "#2563eb",
      20,
      "#1d4ed8",
      75,
      "#1e3a8a",
    ],
    "circle-radius": ["step", ["get", "point_count"], 20, 20, 26, 75, 34],
    "circle-stroke-width": 3,
    "circle-stroke-color": "#ffffff",
  },
};

const clusterCountLayer = {
  id: "property-cluster-count",
  type: "symbol",
  source: "properties",
  filter: ["has", "point_count"],
  layout: {
    "text-field": ["get", "point_count_abbreviated"],
    "text-size": 13,
  },
  paint: { "text-color": "#ffffff" },
};

const propertyLayer = {
  id: "unclustered-property",
  type: "circle",
  source: "properties",
  filter: ["!", ["has", "point_count"]],
  paint: {
    "circle-color": "#f97316",
    "circle-radius": 9,
    "circle-stroke-width": 3,
    "circle-stroke-color": "#ffffff",
  },
};

const rateLabel = (rates = {}) => {
  const entries = [
    [rates.nightly, "night"],
    [rates.weekly, "week"],
    [rates.monthly, "month"],
  ];
  const match = entries.find(([value]) => Number(value) > 0);
  return match
    ? `$${Number(match[0]).toLocaleString()}/${match[1]}`
    : "Contact for price";
};

export default function PropertiesMap({ properties = [], height = 560 }) {
  const mapRef = useRef(null);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapError, setMapError] = useState(false);

  const validProperties = useMemo(
    () =>
      properties
        .map((property) => ({
          property,
          location: normalizeLocation(property?.location),
        }))
        .filter(({ location }) => hasCoordinates(location)),
    [properties],
  );

  const geojson = useMemo(
    () => ({
      type: "FeatureCollection",
      features: validProperties.map(({ property, location }) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [location.longitude, location.latitude],
        },
        properties: {
          id: String(property._id || property.id || ""),
          name: property.name || "Property",
          address:
            location.formattedAddress || buildLocationLabel(location) || "",
          rate: rateLabel(property.rates),
        },
      })),
    }),
    [validProperties],
  );

  useEffect(() => {
    if (!mapRef.current || validProperties.length === 0) return;

    if (validProperties.length === 1) {
      const { location } = validProperties[0];
      mapRef.current.flyTo({
        center: [location.longitude, location.latitude],
        zoom: 14,
        duration: 0,
      });
      return;
    }

    const bounds = validProperties.reduce(
      (current, { location }) => ({
        west: Math.min(current.west, location.longitude),
        south: Math.min(current.south, location.latitude),
        east: Math.max(current.east, location.longitude),
        north: Math.max(current.north, location.latitude),
      }),
      { west: 180, south: 90, east: -180, north: -90 },
    );

    mapRef.current.fitBounds(
      [
        [bounds.west, bounds.south],
        [bounds.east, bounds.north],
      ],
      { padding: 60, maxZoom: 14, duration: 0 },
    );
  }, [validProperties]);

  if (validProperties.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center text-slate-600">
        No properties with saved coordinates are available to map.
      </div>
    );
  }

  if (mapError) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-slate-50 px-6 py-12 text-center text-slate-600">
        The property map is temporarily unavailable.
      </div>
    );
  }

  const handleMapClick = async (event) => {
    const feature = event.features?.[0];
    if (!feature) {
      setSelectedProperty(null);
      return;
    }

    if (feature.layer.id === clusterLayer.id) {
      const source = mapRef.current?.getSource("properties");
      if (!source) return;
      const zoom = await source.getClusterExpansionZoom(
        feature.properties.cluster_id,
      );
      mapRef.current.easeTo({
        center: feature.geometry.coordinates,
        zoom,
        duration: 500,
      });
      return;
    }

    setSelectedProperty({
      ...feature.properties,
      longitude: feature.geometry.coordinates[0],
      latitude: feature.geometry.coordinates[1],
    });
  };

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      <Map
        ref={mapRef}
        initialViewState={DEFAULT_MAP_LOCATION}
        mapStyle={DEFAULT_MAP_STYLE}
        style={{ width: "100%", height }}
        reuseMaps
        attributionControl={false}
        interactiveLayerIds={[clusterLayer.id, propertyLayer.id]}
        onClick={handleMapClick}
        onError={() => setMapError(true)}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <FullscreenControl position="top-right" />
        <Source
          id="properties"
          type="geojson"
          data={geojson}
          cluster
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer {...clusterLayer} />
          <Layer {...clusterCountLayer} />
          <Layer {...propertyLayer} />
        </Source>

        {selectedProperty && (
          <Popup
            longitude={selectedProperty.longitude}
            latitude={selectedProperty.latitude}
            closeOnClick={false}
            onClose={() => setSelectedProperty(null)}
            maxWidth="300px"
          >
            <div className="min-w-52 p-1">
              <h3 className="font-bold text-slate-900">
                {selectedProperty.name}
              </h3>
              <p className="mt-1 text-sm text-slate-600">
                {selectedProperty.address || "Address unavailable"}
              </p>
              <p className="mt-2 font-bold text-blue-700">
                {selectedProperty.rate}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}

