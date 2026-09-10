"use client";

import { useState, useEffect } from "react";
import Map, {
  FullscreenControl,
  Marker,
  NavigationControl,
  Popup,
} from "react-map-gl/maplibre";
import { FaMapMarkerAlt, FaExternalLinkAlt } from "react-icons/fa";
import { DEFAULT_MAP_STYLE, PROPERTY_MAP_ZOOM } from "@/config/map";
import {
  buildLocationLabel,
  hasCoordinates,
  normalizeLocation,
} from "@/utils/location";

const formatPrice = (rates = {}, currency = "ZAR") => {
  const fmt = (n) =>
    new Intl.NumberFormat("en-ZA", {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  if (Number(rates.nightly) > 0) return `${fmt(rates.nightly)}/night`;
  if (Number(rates.weekly) > 0) return `${fmt(rates.weekly)}/week`;
  if (Number(rates.monthly) > 0) return `${fmt(rates.monthly)}/month`;
  return "Contact for price";
};

function OsmFallback({ address }) {
  const query = encodeURIComponent(address);
  const linkHref = `https://www.openstreetmap.org/search?query=${query}`;
  // Use Nominatim to resolve the address to a map view via the OSM embed endpoint
  const embedSrc = `https://www.openstreetmap.org/export/embed.html?layer=mapnik&query=${query}`;

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
        <FaMapMarkerAlt className="text-blue-600" aria-hidden="true" />
        <span className="text-sm font-semibold text-slate-700 truncate flex-1">{address}</span>
        <a
          href={linkHref}
          target="_blank"
          rel="noopener noreferrer"
          className="flex shrink-0 items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
        >
          View on map <FaExternalLinkAlt className="text-[10px]" aria-hidden="true" />
        </a>
      </div>
      <iframe
        title="Property location on OpenStreetMap"
        src={embedSrc}
        width="100%"
        height="380"
        style={{ border: 0, display: "block" }}
        loading="lazy"
        allowFullScreen
      />
      <p className="bg-slate-50 px-4 py-2 text-xs text-slate-500">
        Map powered by{" "}
        <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline">
          OpenStreetMap
        </a>{" "}
        contributors.
      </p>
    </div>
  );
}

function NoCoordinatesPlaceholder({ address }) {
  if (address && address !== "Address unavailable") {
    return <OsmFallback address={address} />;
  }
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-blue-700">
        <FaMapMarkerAlt aria-hidden="true" />
      </span>
      <h3 className="mt-4 text-lg font-bold text-slate-900">Location not specified</h3>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-600">
        The owner has not provided location details for this property. Contact them directly for address information.
      </p>
    </div>
  );
}

export default function PropertyMap({ property }) {
  const [popupOpen, setPopupOpen] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [mapError, setMapError] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMapLoaded(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const location = normalizeLocation(property?.location);
  const address =
    location.formattedAddress ||
    buildLocationLabel(location) ||
    "Address unavailable";

  if (!hasCoordinates(location)) {
    return <NoCoordinatesPlaceholder address={address} />;
  }

  if (mapError) {
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 border-b border-slate-100 bg-slate-50 px-4 py-2.5">
          <FaMapMarkerAlt className="text-blue-600" aria-hidden="true" />
          <span className="text-sm font-semibold text-slate-700 truncate flex-1">{address}</span>
        </div>
        <iframe
          title="Property location on OpenStreetMap"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${location.longitude - 0.005},${location.latitude - 0.005},${location.longitude + 0.005},${location.latitude + 0.005}&layer=mapnik&marker=${location.latitude},${location.longitude}`}
          width="100%"
          height="380"
          style={{ border: 0, display: "block" }}
          loading="lazy"
          allowFullScreen
        />
        <div className="flex items-center justify-between bg-slate-50 px-4 py-2">
          <p className="text-xs text-slate-500">
            Coordinates: {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
          </p>
          <a
            href={`https://www.openstreetmap.org/?mlat=${location.latitude}&mlon=${location.longitude}&zoom=16`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
          >
            Open full map <FaExternalLinkAlt className="text-[10px]" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-100 shadow-sm">
      {!mapLoaded && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-slate-100">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
          <p className="text-sm font-medium text-slate-600">Loading map…</p>
        </div>
      )}
      <Map
        initialViewState={{
          latitude: location.latitude,
          longitude: location.longitude,
          zoom: PROPERTY_MAP_ZOOM,
        }}
        mapStyle={DEFAULT_MAP_STYLE}
        style={{ width: "100%", height: 430 }}
        reuseMaps
        attributionControl={false}
        onLoad={() => setMapLoaded(true)}
        onError={() => setMapError(true)}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <FullscreenControl position="top-right" />

        <Marker
          longitude={location.longitude}
          latitude={location.latitude}
          anchor="bottom"
        >
          <button
            type="button"
            aria-label={`Show details for ${property?.name || "this property"}`}
            onClick={() => setPopupOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-full border-4 border-white bg-blue-600 text-white shadow-xl transition hover:scale-110 focus:outline-none focus:ring-4 focus:ring-blue-200"
          >
            <FaMapMarkerAlt aria-hidden="true" />
          </button>
        </Marker>

        {popupOpen && (
          <Popup
            longitude={location.longitude}
            latitude={location.latitude}
            anchor="bottom"
            offset={54}
            closeOnClick={false}
            onClose={() => setPopupOpen(false)}
            maxWidth="300px"
          >
            <div className="min-w-56 p-1">
              <h3 className="text-base font-bold text-slate-900">
                {property?.name || "Property"}
              </h3>
              <p className="mt-1 text-sm leading-5 text-slate-600">{address}</p>
              <p className="mt-2 font-bold text-blue-700">
                {formatPrice(property?.rates, property?.currency)}
              </p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  );
}
