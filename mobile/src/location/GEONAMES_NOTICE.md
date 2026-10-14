# India city catalogue

Contains adapted data from [GeoNames](https://www.geonames.org/), licensed under [Creative Commons Attribution 4.0](https://creativecommons.org/licenses/by/4.0/). GeoNames does not endorse NammaCrew. The data is provided without guarantees of accuracy or completeness.

Downloaded 2026-10-07 from the [GeoNames data export](https://download.geonames.org/export/dump/): `cities15000.zip`, `admin1CodesASCII.txt`, and `admin2Codes.txt`.

Changes: filtered to India populated places with known state codes; retained identifiers, ASCII names and centre coordinates; sorted alphabetically; appended district names to duplicate city names. Added [Kavaratti](https://www.geonames.org/1267390/kavaratti.html), which is below the source population cutoff, for Lakshadweep coverage. The output contains 3,781 places across 36 states/union territories. GeoNames administrative codes are internal catalogue keys, not ISO state codes or values persisted to profiles.

This is a city-centre search catalogue, not a complete village/address directory. It does not identify a customer's precise address. The app offers phone location for finer positioning and explains the coverage limitation.

Regenerate from extracted source files with `node scripts/import-india-cities.cjs <source-directory>` from the mobile folder. No runtime service, API key, paid plan or added npm dependency is used.
