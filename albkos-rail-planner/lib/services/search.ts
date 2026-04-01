import { getPlace, getStation, stationMap } from "@/lib/data";
import { places } from "@/lib/data/places";
import { stations } from "@/lib/data/stations";
import { estimateWalkingMinutes, haversineDistanceMeters } from "@/lib/services/geo";
import { Language, NearestStationResult, SearchResult, SearchTarget } from "@/lib/types/model";

function normalize(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLowerCase();
}

function scoreMatch(query: string, candidates: string[]) {
  if (!query) return 1;

  const normalizedCandidates = candidates.map(normalize);
  const direct = normalizedCandidates.some((value) => value === query);
  const prefix = normalizedCandidates.some((value) => value.startsWith(query));
  const contains = normalizedCandidates.some((value) => value.includes(query));

  if (direct) return 100;
  if (prefix) return 82;
  if (contains) return 60;
  return 0;
}

export function targetLabel(target: SearchTarget, language: Language) {
  if (target.type === "station") return getStation(target.stationId).name[language];
  if (target.type === "place") return getPlace(target.placeId).name[language];
  return target.label;
}

export function searchEntities(query: string, language: Language): SearchResult[] {
  const normalizedQuery = normalize(query);

  const stationResults = stations.map((station) => {
    const score =
      scoreMatch(normalizedQuery, [
        station.name.sq,
        station.name.en,
        station.municipality.sq,
        station.municipality.en,
        ...(station.aliases ?? [])
      ]) + (station.importance <= 2 ? 4 : 0);

    return {
      id: station.id,
      label: station.name[language],
      secondaryLabel: `${station.municipality[language]} · station`,
      type: "station" as const,
      stationId: station.id,
      score
    };
  });

  const placeResults = places.map((place) => {
    const score =
      scoreMatch(normalizedQuery, [
        place.name.sq,
        place.name.en,
        place.municipality.sq,
        place.municipality.en,
        ...place.aliases
      ]) + (place.type === "airport" || place.type === "city" ? 3 : 0);

    return {
      id: place.id,
      label: place.name[language],
      secondaryLabel: `${place.municipality[language]} · place`,
      type: "place" as const,
      placeId: place.id,
      score
    };
  });

  return [...stationResults, ...placeResults]
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score || a.label.localeCompare(b.label))
    .slice(0, 10);
}

export function resultToTarget(result: SearchResult): SearchTarget {
  if (result.type === "station" && result.stationId) {
    return { type: "station", stationId: result.stationId, label: result.label };
  }

  if (result.type === "place" && result.placeId) {
    return { type: "place", placeId: result.placeId, label: result.label };
  }

  return {
    type: "coordinate",
    id: `${result.coordinates?.[0] ?? 0}-${result.coordinates?.[1] ?? 0}`,
    coordinates: result.coordinates ?? [0, 0],
    label: result.label
  };
}

export function findNearestStation(coordinates: [number, number]): NearestStationResult {
  return stations
    .map((station) => {
      const distanceMeters = haversineDistanceMeters(coordinates, station.coordinates);
      return {
        stationId: station.id,
        distanceMeters,
        walkingMinutes: estimateWalkingMinutes(distanceMeters)
      };
    })
    .sort((a, b) => a.distanceMeters - b.distanceMeters)[0];
}

export function nearbyStations(stationId: string, limit = 4) {
  const origin = stationMap.get(stationId);
  if (!origin) return [];

  return stations
    .filter((station) => station.id !== stationId)
    .map((station) => ({
      station,
      distanceMeters: haversineDistanceMeters(origin.coordinates, station.coordinates)
    }))
    .sort((a, b) => a.distanceMeters - b.distanceMeters)
    .slice(0, limit);
}
