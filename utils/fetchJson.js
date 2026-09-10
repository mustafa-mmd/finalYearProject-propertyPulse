// utils/fetchJson.js
export async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const contentType = response.headers.get('content-type');
  
  if (!contentType || !contentType.includes('application/json')) {
    const text = await response.text();
    throw new Error(`Expected JSON, got: ${contentType}. Response: ${text.substring(0, 100)}`);
  }

  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || `HTTP error! status: ${response.status}`);
  }

  return data;
}
