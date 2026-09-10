"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Map, {
  FullscreenControl,
  Marker,
  NavigationControl,
} from "react-map-gl/maplibre";
import { FaCrosshairs, FaMapMarkerAlt } from "react-icons/fa";
import {
  DEFAULT_MAP_LOCATION,
  DEFAULT_MAP_STYLE,
  PROPERTY_MAP_ZOOM,
} from "@/config/map";
import {
  EMPTY_LOCATION,
  hasCoordinates,
  normalizeLocation,
} from "@/utils/location";

const isValidCoordinatePair = (latitude, longitude) =>
  Number.isFinite(Number(latitude)) &&
  Number.isFinite(Number(longitude)) &&
  Number(latitude) >= -90 &&
  Number(latitude) <= 90 &&
  Number(longitude) >= -180 &&
  Number(longitude) <= 180;

export default function LocationPicker({
  value = EMPTY_LOCATION,
  onChange,
  height = 390,
}) {
  const mapRef = useRef(null);
  const normalizedValue = useMemo(() => normalizeLocation(value), [value]);
  const validCoordinates = hasCoordinates(normalizedValue);
  const [latitudeInput, setLatitudeInput] = useState(
    validCoordinates ? String(normalizedValue.latitude) : "",
  );
  const [longitudeInput, setLongitudeInput] = useState(
    validCoordinates ? String(normalizedValue.longitude) : "",
  );
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState("");

  useEffect(() => {
    // Safety timer to clear loading overlay when tiles load or after a short timeout
    const timer = setTimeout(() => setMapLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!validCoordinates) return;

    setLatitudeInput(String(normalizedValue.latitude));
    setLongitudeInput(String(normalizedValue.longitude));

    // react-map-gl wraps the map — use .getMap() to get the raw MapLibre instance
    // Also wait until map is loaded before flying
    if (!mapLoaded) return;
    const map = mapRef.current?.getMap();
    if (!map) return;

    map.flyTo({
      center: [normalizedValue.longitude, normalizedValue.latitude],
      zoom: Math.max(map.getZoom(), PROPERTY_MAP_ZOOM),
      duration: 700,
    });
  }, [
    normalizedValue.latitude,
    normalizedValue.longitude,
    validCoordinates,
    mapLoaded,
  ]);

  const reverseGeocode = async (latitude, longitude, provisional) => {
    setStatus("loading");
    setMessage("Updating the readable address...");

    try {
      const response = await fetch("/api/location/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ latitude, longitude }),
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Reverse geocoding is unavailable.");
      }

      const resolved = normalizeLocation({
        ...provisional,
        ...data.location,
        latitude,
        longitude,
        isManual: true,
      });
      onChange?.(resolved);
      setStatus("success");
      setMessage("Pin and address updated.");
    } catch {
      setStatus("warning");
      setMessage(
        "The exact coordinates are saved. A street address was not available for this point.",
      );
    }
  };

  const selectCoordinates = (latitude, longitude, shouldReverse = true) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    if (!isValidCoordinatePair(lat, lng)) {
      setStatus("error");
      setMessage("Latitude must be -90 to 90 and longitude -180 to 180.");
      return;
    }

    const provisional = normalizeLocation({
      ...normalizedValue,
      latitude: lat,
      longitude: lng,
      placeId: "",
      provider: "manual",
      accuracy: "user_selected",
      resolutionStatus: "coordinates_only",
      isManual: true,
    });

    setLatitudeInput(String(lat));
    setLongitudeInput(String(lng));
    setStatus("success");
    setMessage("Coordinates selected.");
    onChange?.(provisional);

    if (shouldReverse) {
      reverseGeocode(lat, lng, provisional);
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setStatus("error");
      setMessage("This browser does not support location access.");
      return;
    }

    setStatus("loading");
    setMessage("Getting your current location...");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => selectCoordinates(coords.latitude, coords.longitude),
      () => {
        setStatus("error");
        setMessage(
          "Current location was unavailable. Search for an address or click the map.",
        );
      },
      { enableHighAccuracy: true, timeout: 10_000, maximumAge: 60_000 },
    );
  };

  const initialViewState = validCoordinates
    ? {
        latitude: normalizedValue.latitude,
        longitude: normalizedValue.longitude,
        zoom: PROPERTY_MAP_ZOOM,
      }
    : DEFAULT_MAP_LOCATION;

  return (
    <section>
      <input
        type="hidden"
        name="location"
        value={JSON.stringify(normalizedValue)}
      />

      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Set the exact map pin</h3>
          <p className="text-sm text-slate-600">
            Click the map or drag the marker to the property entrance.
          </p>
        </div>
        <button
          type="button"
          onClick={useCurrentLocation}
          className="inline-flex w-fit items-center gap-2 rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 focus:outline-none focus:ring-4 focus:ring-blue-100"
        >
          <FaCrosshairs aria-hidden="true" />
          Use my location
        </button>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
        {!mapLoaded && !mapError && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-slate-100 text-sm font-medium text-slate-600">
            Loading interactive map...
          </div>
        )}

        {mapError ? (
          <div
            className="flex items-center justify-center px-6 text-center text-sm text-slate-600"
            style={{ height }}
            role="alert"
          >
            The map tiles could not load. You can still enter valid coordinates
            below.
          </div>
        ) : (
          <Map
            ref={mapRef}
            initialViewState={initialViewState}
            mapStyle={DEFAULT_MAP_STYLE}
            style={{ width: "100%", height }}
            reuseMaps
            attributionControl={false}
            cursor={status === "loading" ? "wait" : "crosshair"}
            onLoad={() => setMapLoaded(true)}
            onError={() => setMapError("Map unavailable")}
            onClick={(event) =>
              selectCoordinates(event.lngLat.lat, event.lngLat.lng)
            }
          >
            <NavigationControl position="top-right" showCompass={false} />
            <FullscreenControl position="top-right" />

            {validCoordinates && (
              <Marker
                longitude={normalizedValue.longitude}
                latitude={normalizedValue.latitude}
                anchor="bottom"
                draggable
                onDragEnd={(event) =>
                  selectCoordinates(event.lngLat.lat, event.lngLat.lng)
                }
              >
                <button
                  type="button"
                  aria-label="Property location marker. Drag to adjust the location."
                  className="flex h-11 w-11 cursor-grab items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-xl active:cursor-grabbing"
                  onClick={(event) => event.stopPropagation()}
                >
                  <FaMapMarkerAlt aria-hidden="true" />
                </button>
              </Marker>
            )}
          </Map>
        )}
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="text-sm font-semibold text-slate-700">
          Latitude
          <input
            type="number"
            inputMode="decimal"
            min="-90"
            max="90"
            step="any"
            value={latitudeInput}
            onChange={(event) => setLatitudeInput(event.target.value)}
            onBlur={() =>
              longitudeInput &&
              selectCoordinates(latitudeInput, longitudeInput, false)
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
        <label className="text-sm font-semibold text-slate-700">
          Longitude
          <input
            type="number"
            inputMode="decimal"
            min="-180"
            max="180"
            step="any"
            value={longitudeInput}
            onChange={(event) => setLongitudeInput(event.target.value)}
            onBlur={() =>
              latitudeInput &&
              selectCoordinates(latitudeInput, longitudeInput, false)
            }
            className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
          />
        </label>
      </div>

      <p
        className={`mt-3 text-sm ${
          status === "error"
            ? "text-red-700"
            : status === "success"
              ? "text-emerald-700"
              : "text-slate-600"
        }`}
        role="status"
      >
        {message ||
          (validCoordinates
            ? `Current coordinates: ${normalizedValue.latitude.toFixed(6)}, ${normalizedValue.longitude.toFixed(6)}`
            : "No coordinates selected yet. The map starts in Riyadh.")}
      </p>
    </section>
  );
}

