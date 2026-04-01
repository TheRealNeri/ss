import { Language, LocalizedText, RoutingPreference, SearchEntityType } from "@/lib/types/model";

type Formatter = (values: Record<string, string | number>) => string;

const dictionary: Record<Language, Record<string, string | Formatter>> = {
  en: {
    appTitle: "AlbKos Rail Planner",
    appSubtitle: "Concept rail journey planning for Albania–Kosovo",
    from: "From",
    to: "To",
    swap: "Swap",
    searchPlaceholder: "Search station or place",
    routeModes: "Route modes",
    fastest: "Fastest",
    fewerChanges: "Fewer changes",
    noRoute: "No route found for this pair.",
    noSelection: "Choose an origin and destination to plan a trip.",
    noSearchResults: "No matching stations or places.",
    lineFilters: "Line filters",
    showAllLines: "Show all",
    clearFocus: "Clear focus",
    selectedStation: "Station",
    setAsStart: "Set as start",
    setAsDestination: "Set as destination",
    nearbyStations: "Nearby stations",
    departures: "Departures",
    plannerStandards: "System standards",
    standardsBody:
      "Autonomous operation, full platform protection, bilingual wayfinding, onboard journey planning, climate-controlled stations and trains, extreme cleanliness standards.",
    nearestPointTitle: "Nearest station to selected map point",
    nearestStation: "Nearest station",
    walking: "Walking",
    ride: "Ride",
    transfers: "Transfers",
    stops: "Stops",
    total: "Total",
    fitRoute: "Fit route",
    fitNetwork: "Fit network",
    routeSummary: "Route summary",
    routeInstructions: "Step-by-step",
    stationSearchHint:
      "Search stations, districts, airports, and major places across the conceptual integrated network.",
    lineInfo: "Line information",
    mapClickedHint: "Tap/click the map to estimate the nearest station and walking access.",
    emptyStation: "Select a station marker or search result to open station details.",
    emptyRoute: "Routing supports station-to-station, place-to-place, and map-click access.",
    stationBadgeCore: "Core",
    stationBadgeInterchange: "Interchange",
    stationBadgeAirport: "Airport",
    stationBadgeRegional: "Regional",
    stationBadgeCoastal: "Coastal",
    setMapPointStart: "Use point as start",
    setMapPointDestination: "Use point as destination",
    focusLineLabel: "Focused line",
    routeAlternativeLabel: ({ mode }) => `${mode} option`,
    walkToStation: ({ station, minutes }) => `Walk to ${station} (${minutes} min).`,
    walkToDestination: ({ label, minutes }) => `Walk to ${label} (${minutes} min).`,
    boardLine: ({ line, station }) => `Board ${line} at ${station}.`,
    transferAt: ({ station, line }) => `Transfer at ${station} to ${line}.`,
    rideTo: ({ station, stops, minutes }) =>
      `Ride to ${station} for ${stops} stop${Number(stops) === 1 ? "" : "s"} (${minutes} min).`,
    arriveAt: ({ label }) => `Arrive at ${label}.`,
    searchEntityStation: "station",
    searchEntityPlace: "place",
    searchEntityCoordinate: "point",
    routeVia: ({ station }) => `Access via ${station}`,
    stationCount: ({ count }) => `${count} stations`
  },
  sq: {
    appTitle: "Planifikuesi AlbKos Rail",
    appSubtitle: "Planifikim udhëtimi konceptual për Shqipëri–Kosovë",
    from: "Nga",
    to: "Për",
    swap: "Ndërro",
    searchPlaceholder: "Kërko stacion ose vend",
    routeModes: "Mënyrat e itinerarit",
    fastest: "Më i shpejti",
    fewerChanges: "Më pak ndërrime",
    noRoute: "Nuk u gjet itinerar për këtë çift.",
    noSelection: "Zgjidh nisjen dhe destinacionin për të planifikuar udhëtimin.",
    noSearchResults: "Nuk u gjetën stacione ose vende.",
    lineFilters: "Filtrat e linjave",
    showAllLines: "Shfaq të gjitha",
    clearFocus: "Hiq fokusin",
    selectedStation: "Stacioni",
    setAsStart: "Vendose si nisje",
    setAsDestination: "Vendose si destinacion",
    nearbyStations: "Stacione pranë",
    departures: "Nisjet",
    plannerStandards: "Standardet e sistemit",
    standardsBody:
      "Operim autonom, mbrojtje e plotë e platformës, orientim dygjuhësh, planifikim udhëtimi në bord, stacione dhe trena me klimë të kontrolluar, standard ekstrem pastërtie.",
    nearestPointTitle: "Stacioni më i afërt me pikën e zgjedhur në hartë",
    nearestStation: "Stacioni më i afërt",
    walking: "Ecje",
    ride: "Udhëtim",
    transfers: "Ndërrime",
    stops: "Ndalesa",
    total: "Totali",
    fitRoute: "Përshtat itinerarin",
    fitNetwork: "Përshtat rrjetin",
    routeSummary: "Përmbledhje itinerari",
    routeInstructions: "Hap pas hapi",
    stationSearchHint:
      "Kërko stacione, lagje, aeroporte dhe vende kryesore në rrjetin e integruar konceptual.",
    lineInfo: "Informacion linje",
    mapClickedHint: "Prek/kliko hartën për të vlerësuar stacionin më të afërt dhe ecjen.",
    emptyStation: "Zgjidh një marker stacioni ose rezultat kërkimi për të hapur detajet.",
    emptyRoute: "Planifikimi mbështet stacion-në-stacion, vend-në-vend dhe akses nga klikimi në hartë.",
    stationBadgeCore: "Qendror",
    stationBadgeInterchange: "Ndërlidhje",
    stationBadgeAirport: "Aeroport",
    stationBadgeRegional: "Rajonal",
    stationBadgeCoastal: "Bregdetar",
    setMapPointStart: "Përdore pikën si nisje",
    setMapPointDestination: "Përdore pikën si destinacion",
    focusLineLabel: "Linja në fokus",
    routeAlternativeLabel: ({ mode }) => `Opsion ${mode}`,
    walkToStation: ({ station, minutes }) => `Ec deri te ${station} (${minutes} min).`,
    walkToDestination: ({ label, minutes }) => `Ec deri te ${label} (${minutes} min).`,
    boardLine: ({ line, station }) => `Hip në ${line} te ${station}.`,
    transferAt: ({ station, line }) => `Ndërro te ${station} për ${line}.`,
    rideTo: ({ station, stops, minutes }) =>
      `Udhëto deri te ${station} për ${stops} ndales${Number(stops) === 1 ? "ë" : "a"} (${minutes} min).`,
    arriveAt: ({ label }) => `Mbërrin te ${label}.`,
    searchEntityStation: "stacion",
    searchEntityPlace: "vend",
    searchEntityCoordinate: "pikë",
    routeVia: ({ station }) => `Qasje përmes ${station}`,
    stationCount: ({ count }) => `${count} stacione`
  }
};

export function t(language: Language, key: string, values?: Record<string, string | number>) {
  const entry = dictionary[language][key];
  if (!entry) return key;
  if (typeof entry === "function") return entry(values ?? {});
  return entry;
}

export function localize(text: LocalizedText, language: Language) {
  return text[language];
}

export function modeLabel(language: Language, mode: RoutingPreference) {
  return mode === "fastest" ? t(language, "fastest") : t(language, "fewerChanges");
}

export function searchEntityLabel(language: Language, type: SearchEntityType) {
  if (type === "station") return t(language, "searchEntityStation");
  if (type === "place") return t(language, "searchEntityPlace");
  return t(language, "searchEntityCoordinate");
}
