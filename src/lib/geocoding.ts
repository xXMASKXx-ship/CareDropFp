// Reverse geocoding using OpenStreetMap Nominatim API (free, no key required)

export type AddressResult = {
  display_name: string;
  short_address: string;
  city: string | null;
  state: string | null;
  country: string | null;
  postcode: string | null;
};

export async function reverseGeocode(lat: number, lng: number): Promise<AddressResult | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const response = await fetch(url, {
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      console.error('Reverse geocoding failed:', response.status);
      return null;
    }

    const data = await response.json();
    const address = data.address || {};

    // Build a readable short address: street/house number, suburb, city
    const parts: string[] = [];
    if (address.road) parts.push(address.road);
    if (address.house_number) parts.unshift(`${address.house_number} ${parts[0] || ''}`.trim());
    if (address.neighbourhood) parts.push(address.neighbourhood);
    if (address.suburb) parts.push(address.suburb);
    if (address.city) parts.push(address.city);
    if (address.town && !address.city) parts.push(address.town);
    if (address.village && !address.city && !address.town) parts.push(address.village);

    return {
      display_name: data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      short_address: parts.filter(Boolean).join(', ') || data.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
      city: address.city || address.town || address.village || null,
      state: address.state || null,
      country: address.country || null,
      postcode: address.postcode || null,
    };
  } catch (err) {
    console.error('Reverse geocoding error:', err);
    return null;
  }
}

export function formatAddressForDisplay(address: AddressResult | null, lat: number, lng: number): string {
  if (!address) {
    return `Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`;
  }
  return address.short_address;
}
