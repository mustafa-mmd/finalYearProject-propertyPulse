"use client";

import { useEffect, useId, useMemo, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  FaBath,
  FaBed,
  FaChevronDown,
  FaHome,
  FaMapMarkerAlt,
  FaSearch,
  FaSlidersH,
  FaTimes,
} from "react-icons/fa";
import {
  DEFAULT_SEARCH_FILTERS,
  buildSearchParams,
  hasAdvancedFilters,
  normalizeSearchFilters,
} from "@/utils/searchFilters";

const EMPTY_OPTIONS = {
  types: [],
  purposes: [],
  categories: [],
  locations: [],
  states: [],
  ranges: {},
  suggestions: [],
};

const PropertySearchForm = ({
  initialFilters = DEFAULT_SEARCH_FILTERS,
  tone = "dark",
}) => {
  const router = useRouter();
  const formId = useId().replace(/:/g, "");
  const suggestionRequest = useRef(null);
  const [isPending, startTransition] = useTransition();
  const normalizedInitialFilters = useMemo(
    () => normalizeSearchFilters(initialFilters),
    [initialFilters],
  );
  const [filters, setFilters] = useState(() => normalizedInitialFilters);
  const [options, setOptions] = useState(EMPTY_OPTIONS);
  const [suggestions, setSuggestions] = useState([]);
  const [isOptionsLoading, setIsOptionsLoading] = useState(true);
  const [isSuggestionsLoading, setIsSuggestionsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(() =>
    hasAdvancedFilters(normalizeSearchFilters(initialFilters)),
  );
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    setFilters(normalizedInitialFilters);
    setShowAdvanced(hasAdvancedFilters(normalizedInitialFilters));
  }, [normalizedInitialFilters]);

  useEffect(() => {
    const controller = new AbortController();

    const loadOptions = async () => {
      try {
        const response = await fetch("/api/search/options", {
          signal: controller.signal,
        });
        if (!response.ok) return;

        const data = await response.json();
        setOptions(data);
        setSuggestions(data.suggestions || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[search-form] Failed to load search options:", error);
        }
      } finally {
        if (!controller.signal.aborted) setIsOptionsLoading(false);
      }
    };

    loadOptions();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    const query = filters.q.trim();

    if (query.length < 2) {
      setIsSuggestionsLoading(false);
      setSuggestions(options.suggestions || []);
      suggestionRequest.current?.abort();
      return undefined;
    }

    setIsSuggestionsLoading(true);
    setSuggestions([]);

    const controller = new AbortController();
    suggestionRequest.current?.abort();
    suggestionRequest.current = controller;

    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/search/options?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("[search-form] Failed to load suggestions:", error);
        }
      } finally {
        if (!controller.signal.aborted) setIsSuggestionsLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [filters.q, options.suggestions]);

  const activeFilterCount = useMemo(
    () =>
      [
        filters.purpose,
        filters.category,
        filters.type,
        filters.beds,
        filters.baths,
        filters.minPrice,
        filters.maxPrice,
        filters.minArea,
        filters.maxArea,
        filters.furnishing,
        filters.petsAllowed,
        filters.parking,
        filters.verified,
        filters.availableBy,
        filters.latitude && filters.longitude ? "nearby" : "",
        filters.sort !== "recommended" ? filters.sort : "",
      ].filter(Boolean).length,
    [filters],
  );

  const updateFilter = (name, value) => {
    setFilters((current) => ({ ...current, [name]: value, page: "1" }));
  };

  const submitSearch = (event) => {
    event.preventDefault();
    setShowSuggestions(false);
    const params = buildSearchParams(filters, { page: "1" });

    startTransition(() => {
      router.push(
        params.size > 0
          ? `/properties/search-results?${params.toString()}`
          : "/properties",
      );
    });
  };

  const clearFilters = () => {
    setFilters({ ...DEFAULT_SEARCH_FILTERS });
    setShowAdvanced(false);
    setSuggestions(options.suggestions || []);
  };

  const chooseSuggestion = (suggestion) => {
    updateFilter("q", suggestion.value);
    setShowSuggestions(false);
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setFilters((current) => ({ ...current, latitude: String(coords.latitude), longitude: String(coords.longitude), radiusKm: current.radiusKm || "10", bounds: "", polygon: "", page: "1" }));
        setLocating(false);
      },
      () => setLocating(false),
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  };

  const hasAnyFilter =
    filters.q || activeFilterCount > 0 || filters.pricePeriod !== "monthly";

  return (
    <form
      onSubmit={submitSearch}
      className="relative mx-auto mt-6 w-full max-w-6xl"
      role="search"
    >
      <div className="rounded-2xl border border-white/20 bg-white/95 p-2 shadow-2xl shadow-blue-950/20 backdrop-blur">
        <div className="flex flex-col gap-2 lg:flex-row">
          <div className="relative min-w-0 flex-1">
            <label htmlFor={`${formId}-query`} className="sr-only">
              Search by property, city, area, or amenity
            </label>
            <FaSearch
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              id={`${formId}-query`}
              type="search"
              value={filters.q}
              onChange={(event) => updateFilter("q", event.target.value)}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setShowSuggestions(false)}
              placeholder="Search city, neighbourhood, property, or amenity"
              autoComplete="off"
              aria-autocomplete="list"
              aria-controls={`${formId}-suggestions`}
              className="h-14 w-full rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
            {filters.q && (
              <button
                type="button"
                onClick={() => updateFilter("q", "")}
                aria-label="Clear search text"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
              >
                <FaTimes aria-hidden="true" />
              </button>
            )}

            {showSuggestions && (isSuggestionsLoading || suggestions.length > 0) && (
              <div
                id={`${formId}-suggestions`}
                role="listbox"
                className="absolute left-0 right-0 z-30 mt-2 overflow-hidden rounded-xl border border-slate-200 bg-white py-2 text-left shadow-xl"
              >
                <p className="px-4 pb-2 pt-1 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {isSuggestionsLoading
                    ? "Searching current listings"
                    : filters.q.trim().length >= 2
                      ? "Matching listings"
                      : "Popular searches"}
                </p>
                {isSuggestionsLoading ? (
                  <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-500">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-200 border-t-blue-600" />
                    Finding the best matches…
                  </div>
                ) : suggestions.map((suggestion) => (
                  <button
                    key={`${suggestion.kind}-${suggestion.value}`}
                    type="button"
                    role="option"
                    aria-selected="false"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => chooseSuggestion(suggestion)}
                    className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-blue-50 focus:bg-blue-50 focus:outline-none"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                      {suggestion.kind === "property" ? (
                        <FaHome aria-hidden="true" />
                      ) : (
                        <FaMapMarkerAlt aria-hidden="true" />
                      )}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-slate-900">
                        {suggestion.label}
                      </span>
                      {suggestion.detail && (
                        <span className="block truncate text-sm text-slate-500">
                          {suggestion.detail}
                        </span>
                      )}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="relative lg:w-64">
            <label htmlFor={`${formId}-type`} className="sr-only">
              Property type
            </label>
            <FaHome
              aria-hidden="true"
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <select
              id={`${formId}-type`}
              value={filters.type}
              onChange={(event) => updateFilter("type", event.target.value)}
              className="h-14 w-full appearance-none rounded-xl border border-slate-200 bg-white pl-11 pr-10 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">
                {isOptionsLoading ? "Loading property types…" : "All property types"}
              </option>
              {options.types.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label} ({type.count})
                </option>
              ))}
            </select>
            <FaChevronDown
              aria-hidden="true"
              className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400"
            />
          </div>

          <div className="relative lg:w-56">
            <label htmlFor={`${formId}-purpose`} className="sr-only">Listing purpose</label>
            <select
              id={`${formId}-purpose`}
              value={filters.purpose}
              onChange={(event) => updateFilter("purpose", event.target.value)}
              className="h-14 w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 pr-9 text-slate-800 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            >
              <option value="">All listing purposes</option>
              {options.purposes.map((purpose) => (
                <option key={purpose.value} value={purpose.value}>
                  {purpose.label.replaceAll("_", " ")} ({purpose.count})
                </option>
              ))}
            </select>
            <FaChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-xs text-slate-400" />
          </div>

          <button
            type="button"
            onClick={() => setShowAdvanced((current) => !current)}
            aria-expanded={showAdvanced}
            className="relative flex h-14 items-center justify-center gap-2 rounded-xl border border-slate-200 px-5 font-semibold text-slate-700 transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-100"
          >
            <FaSlidersH aria-hidden="true" />
            Filters
            {activeFilterCount > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-xs text-white">
                {activeFilterCount}
              </span>
            )}
          </button>

          <button
            type="submit"
            disabled={isPending}
            className="flex h-14 min-w-36 items-center justify-center gap-2 rounded-xl bg-blue-600 px-7 font-semibold text-white shadow-lg shadow-blue-600/25 transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200 disabled:cursor-wait disabled:opacity-70"
          >
            <FaSearch aria-hidden="true" />
            {isPending ? "Searching…" : "Search"}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-2 border-t border-slate-200 px-2 pb-2 pt-4">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <FilterSelect
                id={`${formId}-beds`}
                label="Minimum bedrooms"
                icon={<FaBed aria-hidden="true" />}
                value={filters.beds}
                onChange={(value) => updateFilter("beds", value)}
                emptyLabel="Any bedrooms"
                maximum={Math.max(
                  Number(options.ranges.maxBeds) || 0,
                  Number(filters.beds) || 0,
                )}
                singularLabel="bedroom"
                pluralLabel="bedrooms"
              />
              <FilterSelect
                id={`${formId}-baths`}
                label="Minimum bathrooms"
                icon={<FaBath aria-hidden="true" />}
                value={filters.baths}
                onChange={(value) => updateFilter("baths", value)}
                emptyLabel="Any bathrooms"
                maximum={Math.max(
                  Number(options.ranges.maxBaths) || 0,
                  Number(filters.baths) || 0,
                )}
                singularLabel="bathroom"
                pluralLabel="bathrooms"
              />

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Price period
                </span>
                <select
                  value={filters.pricePeriod}
                  onChange={(event) => updateFilter("pricePeriod", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="nightly">Per night</option>
                  <option value="weekly">Per week</option>
                  <option value="monthly">Per month</option>
                </select>
              </label>

              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Sort results
                </span>
                <select
                  value={filters.sort}
                  onChange={(event) => updateFilter("sort", event.target.value)}
                  className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                >
                  <option value="recommended">Recommended</option>
                  <option value="newest">Newest first</option>
                  <option value="price_asc">Price: low to high</option>
                  <option value="price_desc">Price: high to low</option>
                  <option value="area_desc">Largest area</option>
                  <option value="beds_desc">Most bedrooms</option>
                </select>
              </label>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberFilter
                label="Minimum price"
                value={filters.minPrice}
                placeholder={options.ranges[`min${capitalize(filters.pricePeriod)}`]}
                onChange={(value) => updateFilter("minPrice", value)}
              />
              <NumberFilter
                label="Maximum price"
                value={filters.maxPrice}
                placeholder={options.ranges[`max${capitalize(filters.pricePeriod)}`]}
                onChange={(value) => updateFilter("maxPrice", value)}
              />
              <NumberFilter
                label="Minimum area (sq ft)"
                value={filters.minArea}
                placeholder={options.ranges.minArea}
                onChange={(value) => updateFilter("minArea", value)}
              />
              <NumberFilter
                label="Maximum area (sq ft)"
                value={filters.maxArea}
                placeholder={options.ranges.maxArea}
                onChange={(value) => updateFilter("maxArea", value)}
              />
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Category</span>
                <select value={filters.category} onChange={(event) => updateFilter("category", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">All categories</option>
                  {options.categories.map((category) => <option key={category.value} value={category.value}>{category.label.replaceAll("_", " ")} ({category.count})</option>)}
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Furnishing</span>
                <select value={filters.furnishing} onChange={(event) => updateFilter("furnishing", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Any furnishing</option>
                  <option value="FURNISHED">Furnished</option>
                  <option value="SEMI_FURNISHED">Semi furnished</option>
                  <option value="UNFURNISHED">Unfurnished</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Pets</span>
                <select value={filters.petsAllowed} onChange={(event) => updateFilter("petsAllowed", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">Any pet policy</option>
                  <option value="true">Pets allowed</option>
                  <option value="false">No pets</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Trust</span>
                <select value={filters.verified} onChange={(event) => updateFilter("verified", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100">
                  <option value="">All listings</option>
                  <option value="true">Verified only</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Search radius (km)</span>
                <input type="number" min="1" max="500" value={filters.radiusKm} disabled={!filters.latitude || !filters.longitude} onChange={(event) => updateFilter("radiusKm", event.target.value)} placeholder="10" className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm disabled:bg-slate-100" />
              </label>
              <div className="flex items-end">
                <button type="button" onClick={useCurrentLocation} disabled={locating} className="h-11 w-full rounded-lg border border-blue-200 bg-blue-50 px-3 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-60"><FaMapMarkerAlt className="mr-2 inline" />{locating ? "Finding your location…" : filters.latitude && filters.longitude ? "Update nearby location" : "Search near me"}</button>
              </div>
            </div>

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <NumberFilter label="Minimum parking spaces" value={filters.parking} onChange={(value) => updateFilter("parking", value)} />
              <label className="block">
                <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">Available by</span>
                <input type="date" value={filters.availableBy} onChange={(event) => updateFilter("availableBy", event.target.value)} className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100" />
              </label>
            </div>

            {hasAnyFilter && (
              <div className="mt-4 flex justify-end">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                >
                  <FaTimes aria-hidden="true" />
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <p
        className={
          tone === "light"
            ? "mt-3 text-center text-sm text-slate-500"
            : "mt-3 text-center text-sm text-blue-100"
        }
      >
        Search suggestions and property types update automatically from current listings.
      </p>
    </form>
  );
};

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const FilterSelect = ({
  id,
  label,
  icon,
  value,
  onChange,
  emptyLabel,
  maximum,
  singularLabel,
  pluralLabel,
}) => (
  <label htmlFor={id} className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <span className="relative block">
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
        {icon}
      </span>
      <select
        id={id}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-slate-200 bg-white pl-10 pr-8 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
      >
        <option value="">{emptyLabel}</option>
        {Array.from({ length: maximum }, (_, index) => index + 1).map((number) => (
          <option key={number} value={number}>
            {number}+ {number === 1 ? singularLabel : pluralLabel}
          </option>
        ))}
      </select>
      <FaChevronDown
        aria-hidden="true"
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400"
      />
    </span>
  </label>
);

const NumberFilter = ({ label, value, placeholder, onChange }) => (
  <label className="block">
    <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-slate-500">
      {label}
    </span>
    <input
      type="number"
      min="0"
      inputMode="numeric"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder ? String(placeholder) : "Any"}
      className="h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-800 outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
    />
  </label>
);

export default PropertySearchForm;
