import Link from "next/link";
import {
  FaArrowLeft,
  FaArrowRight,
  FaHome,
  FaSearch,
  FaTimes,
} from "react-icons/fa";
import PropertyCard from "@/components/PropertyCard";
import PropertySearchForm from "@/components/PropertySearchForm";
import SaveSearchButton from "@/components/SaveSearchButton";
import { buildSearchParams, normalizeSearchFilters } from "@/utils/searchFilters";
import { searchProperties } from "@/utils/propertySearch";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Search rental properties | PropertyPulse",
  description:
    "Search available rental properties by location, type, price, bedrooms, bathrooms, and area.",
};

const SearchResultsPage = async ({ searchParams }) => {
  const resolvedSearchParams = await searchParams;
  const initialFilters = normalizeSearchFilters(resolvedSearchParams);

  let results;
  let errorMessage = "";

  try {
    results = await searchProperties(resolvedSearchParams);
  } catch (error) {
    console.error("[search-results] Failed to load properties:", error);
    errorMessage =
      "Search is temporarily unavailable. Please try again in a moment.";
    results = {
      properties: [],
      pagination: {
        page: 1,
        pageSize: 9,
        total: 0,
        totalPages: 1,
        hasPreviousPage: false,
        hasNextPage: false,
      },
      appliedFilters: initialFilters,
    };
  }

  const { properties, pagination, appliedFilters } = results;
  const firstResult =
    pagination.total === 0 ? 0 : (pagination.page - 1) * pagination.pageSize + 1;
  const lastResult = Math.min(
    pagination.page * pagination.pageSize,
    pagination.total,
  );
  const filterBadges = getFilterBadges(appliedFilters);

  return (
    <>
      <section className="bg-gradient-to-br from-blue-800 via-blue-700 to-indigo-800 px-4 py-8">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">
              Property search
            </p>
            <h1 className="mt-2 text-3xl font-bold text-white sm:text-4xl">
              Find a place that fits your life
            </h1>
          </div>
          <PropertySearchForm initialFilters={appliedFilters} />
        </div>
      </section>

      <section className="min-h-[32rem] bg-slate-50 px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col gap-5 border-b border-slate-200 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-blue-600">
                {pagination.total === 0
                  ? "No matches"
                  : `${firstResult}–${lastResult} of ${pagination.total}`}
              </p>
              <h2 className="text-2xl font-bold text-slate-950 sm:text-3xl">
                {appliedFilters.q
                  ? `Properties matching “${appliedFilters.q}”`
                  : "Properties matching your filters"}
              </h2>
              <p className="mt-2 text-slate-600">
                Results come directly from currently available listings.
              </p>
            </div>

            <div className="flex max-w-2xl flex-wrap items-center gap-2">
              <SaveSearchButton filters={appliedFilters} />
              {filterBadges.length > 0 && (
                <>
                {filterBadges.map((badge) => (
                  <span
                    key={badge}
                    className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-800"
                  >
                    {badge}
                  </span>
                ))}
                <Link
                  href="/properties"
                  className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-semibold text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
                >
                  <FaTimes aria-hidden="true" />
                  Clear all
                </Link>
                </>
              )}
            </div>
          </div>

          {errorMessage ? (
            <SearchState
              icon={<FaSearch aria-hidden="true" />}
              title="We couldn’t load search results"
              description={errorMessage}
            />
          ) : properties.length === 0 ? (
            <SearchState
              icon={<FaHome aria-hidden="true" />}
              title="No properties match these filters"
              description="Try widening the price or area range, reducing the bedroom count, or clearing one of the filters above."
            />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-7 md:grid-cols-2 xl:grid-cols-3">
                {properties.map((property) => (
                  <PropertyCard key={property._id.toString()} property={property} />
                ))}
              </div>

              {pagination.totalPages > 1 && (
                <SearchPagination
                  filters={appliedFilters}
                  page={pagination.page}
                  totalPages={pagination.totalPages}
                />
              )}
            </>
          )}
        </div>
      </section>
    </>
  );
};

const SearchState = ({ icon, title, description }) => (
  <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-50 text-xl text-blue-600">
      {icon}
    </div>
    <h2 className="mt-5 text-2xl font-bold text-slate-900">{title}</h2>
    <p className="mx-auto mt-2 max-w-xl text-slate-600">{description}</p>
    <Link
      href="/properties"
      className="mt-6 inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white transition hover:bg-blue-700"
    >
      Browse all properties
      <FaArrowRight aria-hidden="true" />
    </Link>
  </div>
);

const SearchPagination = ({ filters, page, totalPages }) => {
  const pages = getVisiblePages(page, totalPages);
  const searchUrl = (targetPage) => {
    const params = buildSearchParams(filters, { page: String(targetPage) });
    return `/properties/search-results?${params.toString()}`;
  };

  return (
    <nav
      className="mt-10 flex flex-wrap items-center justify-center gap-2"
      aria-label="Search result pages"
    >
      <PaginationLink
        href={searchUrl(page - 1)}
        disabled={page <= 1}
        label="Previous page"
      >
        <FaArrowLeft aria-hidden="true" />
        <span className="hidden sm:inline">Previous</span>
      </PaginationLink>

      {pages.map((pageNumber, index) =>
        pageNumber === "ellipsis" ? (
          <span
            key={`ellipsis-${index}`}
            className="flex h-10 w-10 items-center justify-center text-slate-400"
          >
            …
          </span>
        ) : (
          <Link
            key={pageNumber}
            href={searchUrl(pageNumber)}
            aria-current={pageNumber === page ? "page" : undefined}
            className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-3 text-sm font-semibold transition ${
              pageNumber === page
                ? "border-blue-600 bg-blue-600 text-white"
                : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:text-blue-700"
            }`}
          >
            {pageNumber}
          </Link>
        ),
      )}

      <PaginationLink
        href={searchUrl(page + 1)}
        disabled={page >= totalPages}
        label="Next page"
      >
        <span className="hidden sm:inline">Next</span>
        <FaArrowRight aria-hidden="true" />
      </PaginationLink>
    </nav>
  );
};

const PaginationLink = ({ href, disabled, label, children }) =>
  disabled ? (
    <span
      aria-disabled="true"
      className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-100 px-4 text-sm font-semibold text-slate-400"
    >
      {children}
    </span>
  ) : (
    <Link
      href={href}
      aria-label={label}
      className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 transition hover:border-blue-300 hover:text-blue-700"
    >
      {children}
    </Link>
  );

const getVisiblePages = (page, totalPages) => {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = [1];
  if (page > 4) pages.push("ellipsis");
  for (
    let current = Math.max(2, page - 1);
    current <= Math.min(totalPages - 1, page + 1);
    current += 1
  ) {
    pages.push(current);
  }
  if (page < totalPages - 3) pages.push("ellipsis");
  pages.push(totalPages);
  return pages;
};

const getFilterBadges = (filters) => {
  const badges = [];
  const priceLabel = {
    nightly: "night",
    weekly: "week",
    monthly: "month",
  }[filters.pricePeriod];

  if (filters.type) badges.push(filters.type);
  if (filters.beds) badges.push(`${filters.beds}+ bedrooms`);
  if (filters.baths) badges.push(`${filters.baths}+ bathrooms`);

  if (filters.minPrice || filters.maxPrice) {
    const range = formatRange(filters.minPrice, filters.maxPrice, "$");
    badges.push(`${range} / ${priceLabel}`);
  }

  if (filters.minArea || filters.maxArea) {
    badges.push(`${formatRange(filters.minArea, filters.maxArea)} sq ft`);
  }

  const sortLabels = {
    newest: "Newest first",
    price_asc: "Lowest price",
    price_desc: "Highest price",
    area_desc: "Largest area",
    beds_desc: "Most bedrooms",
  };
  if (sortLabels[filters.sort]) badges.push(sortLabels[filters.sort]);

  return badges;
};

const formatRange = (minimum, maximum, prefix = "") => {
  const format = (value) =>
    `${prefix}${Number(value).toLocaleString("en-US", {
      maximumFractionDigits: 0,
    })}`;

  if (minimum && maximum) return `${format(minimum)}–${format(maximum)}`;
  if (minimum) return `From ${format(minimum)}`;
  return `Up to ${format(maximum)}`;
};

export default SearchResultsPage;
