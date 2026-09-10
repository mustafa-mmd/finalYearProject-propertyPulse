export async function getProperties({ showFeatured = false } = {}) {
  try {
    const response = await fetch(
      `/api/prop${showFeatured ? "/featured" : ""}`,
      { cache: "no-store" }
    );
    if (!response.ok) throw new Error("Property request failed");
    return response.json();
  } catch (error) {
    console.error("Could not load properties", error);
    return showFeatured ? [] : { total: 0, properties: [] };
  }
}

export async function getProperty(id) {
  if (!id) return null;

  try {
    const response = await fetch(`/api/prop/${encodeURIComponent(id)}`, {
      cache: "no-store",
    });
    if (!response.ok) return null;
    return response.json();
  } catch (error) {
    console.error("Could not load property", error);
    return null;
  }
}
