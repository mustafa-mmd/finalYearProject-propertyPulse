import { searchProperties } from "@/utils/propertySearch";

export const dynamic = "force-dynamic";

export const GET = async (request) => {
  try {
    const { searchParams } = new URL(request.url);
    const results = await searchProperties(searchParams);

    return Response.json(results, {
      headers: {
        "Cache-Control": "public, max-age=30, stale-while-revalidate=120",
      },
    });
  } catch (error) {
    console.error("[search] Failed to search properties:", error);
    return Response.json(
      { message: "We could not complete your search. Please try again." },
      { status: 500 },
    );
  }
};
