import { lines } from "@/lib/data/lines";
import { places } from "@/lib/data/places";
import { stations } from "@/lib/data/stations";
import { Line, Place, Station } from "@/lib/types/model";

export const stationMap = new Map<string, Station>(stations.map((station) => [station.id, station]));
export const lineMap = new Map<string, Line>(lines.map((line) => [line.id, line]));
export const placeMap = new Map<string, Place>(places.map((place) => [place.id, place]));

export function getStation(id: string): Station {
  const station = stationMap.get(id);
  if (!station) {
    throw new Error(`Unknown station: ${id}`);
  }
  return station;
}

export function getLine(id: string): Line {
  const line = lineMap.get(id);
  if (!line) {
    throw new Error(`Unknown line: ${id}`);
  }
  return line;
}

export function getPlace(id: string): Place {
  const place = placeMap.get(id);
  if (!place) {
    throw new Error(`Unknown place: ${id}`);
  }
  return place;
}
