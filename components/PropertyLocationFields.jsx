"use client";

import dynamic from "next/dynamic";
import AddressSearch from "@/components/AddressSearch";
// maplibre-gl uses `new URL(e, import.meta.url)` to spawn a WebWorker — a
// browser-only API. Importing it during SSR causes a build/MIME-type error.
// `ssr: false` ensures it is only ever evaluated in the browser.
const LocationPicker = dynamic(() => import("@/components/LocationPicker"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[390px] items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-sm font-medium text-slate-500">
      Loading map…
    </div>
  ),
});
import {
  buildLocationLabel,
  normalizeLocation,
} from "@/utils/location";

const addressInputs = [
  {
    key: "street",
    label: "Street",
    placeholder: "Street address",
    autoComplete: "street-address",
  },
  {
    key: "city",
    label: "City / town",
    placeholder: "City, town, or village",
    autoComplete: "address-level2",
  },
  {
    key: "state",
    label: "State / province",
    placeholder: "State, province, or region",
    autoComplete: "address-level1",
  },
  {
    key: "zipcode",
    label: "Postal / ZIP code",
    placeholder: "Postal code",
    autoComplete: "postal-code",
  },
];

export default function PropertyLocationFields({ value, onChange }) {
  const location = normalizeLocation(value);

  const selectAddress = (selectedLocation) => {
    onChange?.(normalizeLocation(selectedLocation));
  };

  const updateAddressField = (key, nextValue) => {
    const nextLocation = {
      ...location,
      [key]: nextValue,
      ...(key === "zipcode" ? { postalCode: nextValue } : {}),
      formattedAddress: "",
      latitude: null,
      longitude: null,
      coordinates: undefined,
      placeId: "",
      provider: "",
      accuracy: "",
      resolutionStatus: "pending",
      isManual: false,
    };

    nextLocation.formattedAddress = buildLocationLabel(nextLocation);
    onChange?.(normalizeLocation(nextLocation));
  };

  return (
    <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 sm:p-6">
      <div>
        <h3 className="text-lg font-bold text-slate-900">Property location</h3>
        <p className="mt-1 text-sm text-slate-600">
          Search for the address, confirm its details, then place the exact pin.
        </p>
      </div>

      <div className="mt-5">
        <AddressSearch
          value={location.formattedAddress || buildLocationLabel(location)}
          onSelect={selectAddress}
        />
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        {addressInputs.map((input) => (
          <label
            key={input.key}
            className="text-sm font-bold text-slate-700"
          >
            {input.label}
            <input
              type="text"
              value={location[input.key] || ""}
              onChange={(event) =>
                updateAddressField(input.key, event.target.value)
              }
              placeholder={input.placeholder}
              autoComplete={input.autoComplete}
              maxLength={input.key === "zipcode" ? 40 : 200}
              className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
            />
          </label>
        ))}
      </div>

      <div className="mt-6 border-t border-slate-200 pt-6">
        <LocationPicker value={location} onChange={onChange} />
      </div>
    </section>
  );
}
