export function parseCsv(input, { maxRows = 500, maxColumns = 80 } = {}) {
  const text = String(input || "").replace(/^\uFEFF/, ""); const rows = []; let row = []; let field = ""; let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (quoted) { if (character === '"' && text[index + 1] === '"') { field += '"'; index += 1; } else if (character === '"') quoted = false; else field += character; }
    else if (character === '"') quoted = true;
    else if (character === ",") { row.push(field.trim()); field = ""; }
    else if (character === "\n") { row.push(field.trim()); field = ""; if (row.some(Boolean)) rows.push(row); row = []; if (rows.length > maxRows + 1) throw new Error(`CSV supports at most ${maxRows} data rows`); }
    else if (character !== "\r") field += character;
  }
  row.push(field.trim()); if (row.some(Boolean)) rows.push(row);
  if (quoted) throw new Error("CSV contains an unclosed quoted value");
  if (rows.length < 2) throw new Error("CSV must contain a header and at least one data row");
  const headers = rows[0].map((value) => value.toLowerCase().replace(/[^a-z0-9_]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, ""));
  if (headers.length > maxColumns || new Set(headers).size !== headers.length || headers.some((value) => !value)) throw new Error("CSV headers are invalid or duplicated");
  return rows.slice(1).map((values, index) => ({ rowNumber: index + 2, values: Object.fromEntries(headers.map((header, column) => [header, values[column] || ""])) }));
}

export function csvTemplate() { return "name,type,listing_purpose,listing_category,description,address,country,state,city,area,street,postal_code,latitude,longitude,beds,baths,square_feet,currency,nightly,weekly,monthly,sale_price,amenities\nModern city apartment,Apartment,LONG_TERM_RENT,APARTMENT,Describe the property with at least twenty characters,Example Street City,Country,State,City,District,Example Street,00000,0,0,2,1,900,ZAR,0,0,1000,0,Parking|Security"; }
