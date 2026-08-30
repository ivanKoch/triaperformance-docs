#!/usr/bin/env python3
"""
GA4 country NAME -> ISO-3166-1 alpha-3, so GA4 and Search Console geography can
be compared without string-matching.

Why this file exists at all: the GA4 BigQuery export emits `geo.country` as a
display name ("Argentina", "United States"), while Search Console emits alpha-3
("ARG", "USA"). Nothing in either feed carries the other's encoding, so the join
has to be made somewhere. Making it here — one small, readable, editable map —
is better than making it inside a SQL CASE that nobody will find again.

Deliberately NOT a full ISO table. It covers the markets this business actually
reads plus the countries that plausibly appear in its traffic. Anything unmapped
resolves to None and is LOGGED, never guessed: a wrong country code in the
affiliate analysis is worse than a NULL, because a NULL is visible.

To extend: run the sync, read the "unmapped country" warnings in the log, add
the names it names. The map grows from evidence rather than from a guess about
what might show up.
"""

COUNTRY_TO_ISO3 = {
    # Core markets — these are the ones the affiliate question turns on
    "Argentina": "ARG",
    "Colombia": "COL",
    "Brazil": "BRA",
    "Mexico": "MEX",
    "Spain": "ESP",
    "United States": "USA",
    # Rest of Spanish-speaking Latin America
    "Chile": "CHL",
    "Peru": "PER",
    "Uruguay": "URY",
    "Ecuador": "ECU",
    "Paraguay": "PRY",
    "Bolivia": "BOL",
    "Venezuela": "VEN",
    "Costa Rica": "CRI",
    "Panama": "PAN",
    "Guatemala": "GTM",
    "Honduras": "HND",
    "Nicaragua": "NIC",
    "El Salvador": "SLV",
    "Dominican Republic": "DOM",
    "Cuba": "CUB",
    "Puerto Rico": "PRI",
    # Portuguese-speaking
    "Portugal": "PRT",
    "Angola": "AGO",
    "Mozambique": "MOZ",
    # English-speaking / general
    "Canada": "CAN",
    "United Kingdom": "GBR",
    "Ireland": "IRL",
    "Australia": "AUS",
    "New Zealand": "NZL",
    "South Africa": "ZAF",
    "India": "IND",
    "Philippines": "PHL",
    # Europe
    "France": "FRA",
    "Germany": "DEU",
    "Italy": "ITA",
    "Netherlands": "NLD",
    "Belgium": "BEL",
    "Switzerland": "CHE",
    "Austria": "AUT",
    "Poland": "POL",
    "Sweden": "SWE",
    "Norway": "NOR",
    "Denmark": "DNK",
    "Finland": "FIN",
    "Czechia": "CZE",
    "Romania": "ROU",
    "Greece": "GRC",
    "Russia": "RUS",
    "Ukraine": "UKR",
    "Turkey": "TUR",
    # Other
    "Japan": "JPN",
    "China": "CHN",
    "South Korea": "KOR",
    "Indonesia": "IDN",
    "Israel": "ISR",
    "United Arab Emirates": "ARE",
}

# GA4 uses this literal string for traffic it cannot geolocate. It is a real
# bucket, not an error, so it maps to nothing and is not warned about.
UNKNOWN_NAMES = {"(not set)", "", None}


def to_iso3(country_name):
    """Return alpha-3 for a GA4 country name, or None if unmapped.

    Returns (iso3, is_unexpected). is_unexpected is True only when the name is a
    real country name we simply do not have — that is the case worth logging.
    """
    if country_name in UNKNOWN_NAMES:
        return None, False
    iso3 = COUNTRY_TO_ISO3.get(country_name)
    return iso3, iso3 is None
