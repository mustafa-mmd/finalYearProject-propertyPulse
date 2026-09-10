"use client";

import { useEffect, useId, useRef, useState } from "react";
import { FaMapMarkerAlt, FaSearch } from "react-icons/fa";
import { normalizeLocation } from "@/utils/location";

const AUTOCOMPLETE_URL = "https://api.geoapify.com/v1/geocode/autocomplete";

const suggestionToLocation = (feature) => {
  const properties = feature?.properties || {};

  return normalizeLocation({
    formattedAddress:
      properties.formatted ||
      [properties.address_line1, properties.address_line2]
        .filter(Boolean)
        .join(", "),
    country: properties.country,
    countryCode: properties.country_code,
    state: properties.state || properties.state_district,
    city:
      properties.city ||
      properties.town ||
      properties.village ||
      properties.municipality,
    area:
      properties.suburb ||
      properties.quarter ||
      properties.neighbourhood ||
      properties.locality,
    district: properties.district || properties.county,
    street:
      properties.street || properties.address_line1 || properties.name,
    postalCode: properties.postcode,
    latitude: properties.lat ?? feature?.geometry?.coordinates?.[1],
    longitude: properties.lon ?? feature?.geometry?.coordinates?.[0],
    placeId: properties.place_id
      ? `geoapify:${properties.place_id}`
      : "",
    provider: "geoapify",
    accuracy:
      properties.rank?.confidence?.toString() ||
      properties.result_type ||
      "autocomplete",
    resolutionStatus: "resolved",
    isManual: false,
  });
};

export default function AddressSearch({ value = "", onSelect }) {
  const inputId = useId();
  const requestRef = useRef(null);
  const [query, setQuery] = useState(value || "");
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const apiKey = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY;

  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  useEffect(() => {
    const searchText = query.trim();
    requestRef.current?.abort();

    if (!isOpen || searchText.length < 3) {
      setSuggestions([]);
      setStatus("idle");
      setMessage(
        isOpen && searchText.length > 0
          ? "Enter at least 3 characters to search."
          : "",
      );
      return undefined;
    }

    if (!apiKey) {
      setSuggestions([]);
      setStatus("error");
      setMessage("Address search needs a Geoapify API key.");
      return undefined;
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setStatus("loading");
    setMessage("");

    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({
          text: searchText,
          apiKey,
          format: "geojson",
          limit: "8",
          lang: "en",
        });
        const response = await fetch(`${AUTOCOMPLETE_URL}?${params}`, {
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(
            response.status === 429
              ? "Search limit reached. Wait a moment and try again."
              : "Address suggestions are temporarily unavailable.",
          );
        }

        const data = await response.json();
        const nextSuggestions = (data.features || [])
          .map((feature) => ({
            feature,
            location: suggestionToLocation(feature),
          }))
          .filter(({ location }) => location.formattedAddress);

        setSuggestions(nextSuggestions);
        setStatus(nextSuggestions.length ? "success" : "empty");
        setMessage(
          nextSuggestions.length
            ? ""
            : "No matches found. Try a nearby city, postal code, or landmark.",
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          setSuggestions([]);
          setStatus("error");
          setMessage(error.message || "Address search failed.");
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [apiKey, isOpen, query]);

  const chooseSuggestion = (location) => {
    setQuery(location.formattedAddress);
    setSuggestions([]);
    setIsOpen(false);
    setStatus("idle");
    setMessage("");
    onSelect?.(location);
  };

  return (
    <div className="relative">
      <label
        htmlFor={inputId}
        className="mb-2 block font-bold text-slate-700"
      >
        Find an address
      </label>
      <div className="relative">
        <FaSearch
          className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          id={inputId}
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 120)}
          placeholder="Street, city, landmark, or postal code"
          autoComplete="off"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={isOpen && suggestions.length > 0}
          aria-controls={`${inputId}-suggestions`}
          className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      {isOpen && (status !== "idle" || suggestions.length > 0) && (
        <div
          id={`${inputId}-suggestions`}
          role="listbox"
          className="absolute left-0 right-0 z-40 mt-2 max-h-80 overflow-y-auto rounded-xl border border-slate-200 bg-white py-2 shadow-2xl"
        >
          {status === "loading" && (
            <div className="flex items-center gap-3 px-4 py-4 text-sm text-slate-600">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
              Searching addresses...
            </div>
          )}

          {suggestions.map(({ feature, location }, idx) => (
            <button
              key={`${idx}-${
                feature.properties?.place_id ||
                `${location.longitude}-${location.latitude}-${location.formattedAddress}`
              }`}
              type="button"
              role="option"
              aria-selected="false"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => chooseSuggestion(location)}
              className="flex w-full gap-3 px-4 py-3 text-left transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
            >
              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <FaMapMarkerAlt aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block truncate font-semibold text-slate-900">
                  {feature.properties?.address_line1 ||
                    feature.properties?.name ||
                    location.formattedAddress}
                </span>
                <span className="block truncate text-sm text-slate-500">
                  {feature.properties?.address_line2 ||
                    location.formattedAddress}
                </span>
              </span>
            </button>
          ))}

          {status !== "loading" && message && (
            <p className="px-4 py-3 text-sm text-slate-600" role="status">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
