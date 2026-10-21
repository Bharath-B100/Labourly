/**
 * Formats requirement location for user-facing screens.
 * Replaces generic placeholders like "GPS job location, IN" with meaningful saved locations,
 * or "Location selected on map" when only GPS coordinates were captured.
 * Does NOT invent city or district values.
 */
export function formatRequirementLocation(
  city?: string | null,
  district?: string | null,
  state?: string | null,
): string {
  const isGenericGps = (val: string) =>
    val.toLowerCase().includes('gps job location') ||
    val.toLowerCase() === 'gps';

  const isCountryCode = (val: string) =>
    val.toUpperCase() === 'IN' || val.toLowerCase() === 'india';

  const clean = (val?: string | null) => {
    if (!val) return '';
    const trimmed = String(val).trim();
    if (
      trimmed.toLowerCase() === 'null' ||
      trimmed.toLowerCase() === 'undefined' ||
      trimmed.length === 0
    ) {
      return '';
    }
    return trimmed;
  };

  const c = clean(city);
  const d = clean(district);
  const s = clean(state);

  if (c && isGenericGps(c)) {
    if (d && !isGenericGps(d)) {
      return [d, s && !isCountryCode(s) ? s : ''].filter(Boolean).join(', ');
    }
    if (s && !isCountryCode(s)) {
      return `Location selected on map, ${s}`;
    }
    return 'Location selected on map';
  }

  const rawParts = [c, d, s && !isCountryCode(s) ? s : c || d ? '' : s]
    .map((p) => clean(p))
    .filter((p) => p.length > 0 && !isGenericGps(p));

  const deduplicated = rawParts.filter(
    (item, index) => rawParts.indexOf(item) === index,
  );

  return deduplicated.join(', ') || 'Location selected on map';
}
