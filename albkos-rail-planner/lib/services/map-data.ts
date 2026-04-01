import { lines } from "@/lib/data/lines";
import { stations } from "@/lib/data/stations";
import { Language } from "@/lib/types/model";
import { NetworkLineCollection, StationCollection } from "@/lib/types/geojson";

function buildRouteRole(routeStationIds: string[], routeLineIds: string[]) {
  const routeSet = new Set(routeStationIds);
  const endpointSet = new Set<string>();
  const transferSet = new Set<string>();

  if (routeStationIds.length > 0) {
    endpointSet.add(routeStationIds[0]);
    endpointSet.add(routeStationIds[routeStationIds.length - 1]);
  }

  for (let index = 1; index < routeStationIds.length - 1; index += 1) {
    const previousLine = routeLineIds[index - 1];
    const nextLine = routeLineIds[index];
    if (previousLine && nextLine && previousLine !== nextLine) {
      transferSet.add(routeStationIds[index]);
    }
  }

  return { routeSet, endpointSet, transferSet };
}

export function buildLineFeatureCollection(
  visibleLineIds: string[],
  focusedLineId: string | null,
  language: Language
): NetworkLineCollection {
  return {
    type: "FeatureCollection",
    features: lines
      .filter((line) => visibleLineIds.includes(line.id))
      .map((line, index) => ({
        type: "Feature" as const,
        geometry: {
          type: "LineString" as const,
          coordinates: line.stationIds.map((stationId) => {
            const station = stations.find((item) => item.id === stationId);
            if (!station) throw new Error(`Missing station in map data: ${stationId}`);
            return station.coordinates;
          })
        },
        properties: {
          id: line.id,
          name: line.name[language],
          color: line.color,
          shortName: line.shortName,
          mode: line.mode,
          opacity: focusedLineId && line.id !== focusedLineId ? 0.14 : 0.82,
          sort: focusedLineId === line.id ? 100 : line.isMajor ? 80 : 40 + index
        }
      }))
  };
}

export function buildStationFeatureCollection(
  language: Language,
  selectedStationId: string | null,
  routeStationIds: string[],
  routeLineIds: string[]
): StationCollection {
  const { routeSet, endpointSet, transferSet } = buildRouteRole(routeStationIds, routeLineIds);

  return {
    type: "FeatureCollection",
    features: stations.map((station) => {
      const onRoute = routeSet.has(station.id);
      const showRouteLabel = onRoute && (endpointSet.has(station.id) || transferSet.has(station.id) || station.importance <= 2);

      return {
        type: "Feature" as const,
        geometry: {
          type: "Point" as const,
          coordinates: station.coordinates
        },
        properties: {
          id: station.id,
          lineCount: station.lines.length,
          name: station.name[language],
          municipality: station.municipality[language],
          importance: station.importance,
          kind: station.kind,
          isInterchange: station.lines.length > 1,
          isSelected: selectedStationId === station.id,
          onRoute,
          showMajorLabel: station.importance <= 2 && !onRoute,
          showMinorLabel: station.importance > 2 && !onRoute,
          showRouteLabel,
          routeRole: endpointSet.has(station.id)
            ? "endpoint"
            : transferSet.has(station.id)
              ? "transfer"
              : "none"
        }
      };
    })
  };
}

export function buildActiveRouteCollection(
  routeStationIds: string[],
  lineIds: string[]
): NetworkLineCollection {
  if (routeStationIds.length < 2) {
    return { type: "FeatureCollection", features: [] };
  }

  const features = [];

  for (let index = 0; index < routeStationIds.length - 1; index += 1) {
    const from = stations.find((item) => item.id === routeStationIds[index]);
    const to = stations.find((item) => item.id === routeStationIds[index + 1]);
    const line = lines.find((item) => item.id === lineIds[Math.min(index, lineIds.length - 1)]);

    if (!from || !to || !line) continue;

    features.push({
      type: "Feature" as const,
      geometry: {
        type: "LineString" as const,
        coordinates: [from.coordinates, to.coordinates]
      },
      properties: {
        id: `${from.id}-${to.id}-${line.id}`,
        name: line.name.en,
        color: line.color,
        shortName: line.shortName,
        mode: line.mode,
        opacity: 1,
        sort: index + 1
      }
    });
  }

  return { type: "FeatureCollection", features };
}
