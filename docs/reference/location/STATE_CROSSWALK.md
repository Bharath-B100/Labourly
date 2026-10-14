# Reviewed state crosswalk — 2026-10-08

GeoNames, LGD and subdivision codes are distinct namespaces. Existing free-text application values remain unchanged; subdivision codes below are canonical output for new writes. Legacy city selectors retain GeoNames keys. District IDs remain explicitly GeoNames IDs, not guessed LGD IDs. SOURCE_VERIFIED means an explicit relationship in the saved GeoNames source, not independently surveyed boundaries.

| GeoNames | Name | LGD | Official name | New application / CLDR suffix |
|---|---|---|---|---|
| 01 | Andaman and Nicobar | 35 | ANDAMAN & NICOBAR ISLANDS | AN |
| 02 | Andhra Pradesh | 28 | ANDHRA PRADESH | AP |
| 30 | Arunachal Pradesh | 12 | ARUNACHAL PRADESH | AR |
| 03 | Assam | 18 | ASSAM | AS |
| 34 | Bihar | 10 | BIHAR | BR |
| 05 | Chandigarh | 4 | CHANDIGARH | CH |
| 37 | Chhattisgarh | 22 | CHHATTISGARH | CG |
| 52 | Dadra and Nagar Haveli and Daman and Diu | 38 | THE DADRA AND NAGAR HAVELI AND DAMAN AND DIU | DH |
| 07 | Delhi | 7 | NCT OF DELHI | DL |
| 33 | Goa | 30 | GOA | GA |
| 09 | Gujarat | 24 | GUJARAT | GJ |
| 10 | Haryana | 6 | HARYANA | HR |
| 11 | Himachal Pradesh | 2 | HIMACHAL PRADESH | HP |
| 12 | Jammu and Kashmir | 1 | JAMMU & KASHMIR | JK |
| 38 | Jharkhand | 20 | JHARKHAND | JH |
| 19 | Karnataka | 29 | KARNATAKA | KA |
| 13 | Kerala | 32 | KERALA | KL |
| 41 | Ladakh | 37 | LADAKH | LA |
| 14 | Lakshadweep | 31 | LAKSHADWEEP | LD |
| 35 | Madhya Pradesh | 23 | MADHYA PRADESH | MP |
| 16 | Maharashtra | 27 | MAHARASHTRA | MH |
| 17 | Manipur | 14 | MANIPUR | MN |
| 18 | Meghalaya | 17 | MEGHALAYA | ML |
| 31 | Mizoram | 15 | MIZORAM | MZ |
| 20 | Nagaland | 13 | NAGALAND | NL |
| 21 | Odisha | 21 | ODISHA | OD |
| 22 | Puducherry | 34 | PUDUCHERRY | PY |
| 23 | Punjab | 3 | PUNJAB | PB |
| 24 | Rajasthan | 8 | RAJASTHAN | RJ |
| 29 | Sikkim | 11 | SIKKIM | SK |
| 25 | Tamil Nadu | 33 | TAMILNADU | TN |
| 40 | Telangana | 36 | TELANGANA | TS |
| 26 | Tripura | 16 | TRIPURA | TR |
| 36 | Uttar Pradesh | 9 | UTTAR PRADESH | UP |
| 39 | Uttarakhand | 5 | UTTARAKHAND | UK |
| 28 | West Bengal | 19 | WEST BENGAL | WB |

- Current Jammu and Kashmir UT; Ladakh is a separate record (GeoNames 41, LGD 37).
- Current Odisha / OD. Historical Orissa / OR is not a new administrative entity.
- LGD spelling TAMILNADU corresponds to Tamil Nadu in GeoNames and CLDR.
- CLDR regular CG; CT is deprecated. Do not overwrite legacy free-text CT values.
- CLDR regular UK; UT is deprecated. Do not overwrite legacy free-text UT values.
- CLDR regular TS; TG is deprecated. Do not overwrite legacy free-text TG values.
- Merged UT only: LGD 38 / CLDR DH. Historical DN and DD must not be treated as separate current states.
- GeoNames omits Islands; official LGD and CLDR specify Andaman and Nicobar Islands.
- GeoNames/CLDR Delhi is LGD NCT OF DELHI.

Sources and per-record evidence are in state-crosswalk-v1.json. Direct LGD download succeeded. Direct raw.githubusercontent.com download failed TLS/reset; CLDR release-48 XML was inspected through the web reader. The CLDR chart is not used as production source.
