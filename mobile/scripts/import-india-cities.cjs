// Usage: node scripts/import-india-cities.cjs <GeoNames dump directory>
// Input: cities15000.txt and admin1CodesASCII.txt from download.geonames.org/export/dump/.
const fs = require('node:fs');
const path = require('node:path');
const directory = process.argv[2];
if (!directory) throw new Error('Provide the GeoNames dump directory');
const lines = (name) =>
  fs
    .readFileSync(path.join(directory, name), 'utf8')
    .trim()
    .split(/\r?\n/)
    .map((line) => line.split('\t'));
const states = lines('admin1CodesASCII.txt')
  .filter((row) => row[0].startsWith('IN.'))
  .map((row) => ({ code: row[0].slice(3), name: row[2] }))
  .sort((a, b) => a.name.localeCompare(b.name));
const stateCodes = new Set(states.map((state) => state.code));
const districts = new Map(
  lines('admin2Codes.txt').map((row) => [row[0], row[2]]),
);
const cities = lines('cities15000.txt')
  .filter((row) => row[8] === 'IN' && row[6] === 'P' && stateCodes.has(row[10]))
  .map((row) => ({
    id: row[0],
    name: row[2],
    stateCode: row[10],
    latitude: Number(row[4]),
    longitude: Number(row[5]),
  }))
  .sort((a, b) => a.name.localeCompare(b.name) || a.id.localeCompare(b.id));
// This small UT capital is below the cities15000 population cutoff.
// https://www.geonames.org/1267390/kavaratti.html (accessed 2026-10-07).
cities.push({
  id: '1267390',
  name: 'Kavaratti',
  stateCode: '14',
  latitude: 10.56688,
  longitude: 72.64203,
});
const originalRows = new Map(
  lines('cities15000.txt').map((row) => [row[0], row]),
);
const nameCounts = new Map();
for (const city of cities)
  nameCounts.set(
    `${city.stateCode}/${city.name}`,
    (nameCounts.get(`${city.stateCode}/${city.name}`) || 0) + 1,
  );
for (const city of cities) {
  if (nameCounts.get(`${city.stateCode}/${city.name}`) > 1) {
    const row = originalRows.get(city.id);
    const district = districts.get(`IN.${city.stateCode}.${row[11]}`);
    city.name += district ? ` (${district})` : ` (area ${row[11]})`;
  }
  if (
    !Number.isFinite(city.latitude) ||
    !Number.isFinite(city.longitude) ||
    Math.abs(city.latitude) > 90 ||
    Math.abs(city.longitude) > 180
  )
    throw new Error(`Invalid city ${city.id}`);
}
cities.sort((a, b) => a.name.localeCompare(b.name));
if (states.length !== 36 || cities.length < 1000)
  throw new Error('Incomplete India source data');
fs.writeFileSync(
  path.join(__dirname, '../src/location/india-cities.json'),
  JSON.stringify({ states, cities }, null, 2) + '\n',
);
console.log(
  `Imported ${cities.length} places across ${states.length} states/union territories`,
);
