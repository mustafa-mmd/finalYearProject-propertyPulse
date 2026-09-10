import { getSearchOptions } from "@/utils/propertySearch";

export const dynamic = "force-dynamic";

export const GET = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const options = await getSearchOptions(searchParams.get("q") || "");

    return Response.json(options, {
      headers: {
        "Cache-Control": "public, max-age=60, stale-while-revalidate=300",
      },
    });
  } catch (error) {
    console.error("[search/options] Failed to load search options:", error);
    return Response.json(
      { message: "Search options are temporarily unavailable." },
      { status: 500 },
    );
  }
};

