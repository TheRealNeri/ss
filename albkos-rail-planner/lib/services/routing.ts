import { getLine, getPlace, getStation } from "@/lib/data";
import { lines } from "@/lib/data/lines";
import { estimateWalkingMinutes, haversineDistanceMeters } from "@/lib/services/geo";
import { localize, modeLabel, t } from "@/lib/services/i18n";
import { findNearestStation } from "@/lib/services/search";
import {
  Language,
  ResolvedEndpoint,
  RouteInstruction,
  RouteLeg,
  RouteOption,
  RoutingPreference,
  SearchTarget
} from "@/lib/types/model";

type Edge = {
  fromStationId: string;
  toStationId: string;
  lineId: string;
  minutes: number;
};

type SearchNode = {
  key: string;
  stationId: string;
  lineId: string | null;
  minutes: number;
  transfers: number;
  previousKey: string | null;
};

const BASE_TRANSFER_PENALTY = 4;

function keyOf(stationId: string, lineId: string | null) {
  return `${stationId}__${lineId ?? "none"}`;
}

function edgeTravelMinutes(lineId: string, fromStationId: string, toStationId: string) {
  const line = getLine(lineId);
  const from = getStation(fromStationId);
  const to = getStation(toStationId);
  const distanceKm = haversineDistanceMeters(from.coordinates, to.coordinates) / 1000;
  return Math.max(2, Math.round((distanceKm / line.speedKph) * 60 + line.dwellMinutes));
}

function buildEdges(): Edge[] {
  const edges: Edge[] = [];

  for (const line of lines) {
    for (let index = 0; index < line.stationIds.length - 1; index += 1) {
      const fromStationId = line.stationIds[index];
      const toStationId = line.stationIds[index + 1];
      const minutes = edgeTravelMinutes(line.id, fromStationId, toStationId);

      edges.push({ fromStationId, toStationId, lineId: line.id, minutes });
      edges.push({ fromStationId: toStationId, toStationId: fromStationId, lineId: line.id, minutes });
    }
  }

  return edges;
}

const edges = buildEdges();
const adjacency = new Map<string, Edge[]>();

for (const edge of edges) {
  const bucket = adjacency.get(edge.fromStationId) ?? [];
  bucket.push(edge);
  adjacency.set(edge.fromStationId, bucket);
}

function isBetterCost(
  preference: RoutingPreference,
  candidate: Pick<SearchNode, "minutes" | "transfers">,
  current?: Pick<SearchNode, "minutes" | "transfers">
) {
  if (!current) return true;

  if (preference === "fewerChanges") {
    if (candidate.transfers !== current.transfers) {
      return candidate.transfers < current.transfers;
    }
    return candidate.minutes < current.minutes;
  }

  if (candidate.minutes !== current.minutes) {
    return candidate.minutes < current.minutes;
  }

  return candidate.transfers < current.transfers;
}

function sortQueue(preference: RoutingPreference, queue: SearchNode[]) {
  queue.sort((a, b) => {
    if (preference === "fewerChanges" && a.transfers !== b.transfers) {
      return a.transfers - b.transfers;
    }
    if (a.minutes !== b.minutes) {
      return a.minutes - b.minutes;
    }
    return a.transfers - b.transfers;
  });
}

function reconstructPath(best: Map<string, SearchNode>, endKey: string) {
  const path: SearchNode[] = [];
  let currentKey: string | null = endKey;

  while (currentKey) {
    const node = best.get(currentKey);
    if (!node) break;
    path.unshift(node);
    currentKey = node.previousKey;
  }

  return path;
}

function findBestPath(originStationId: string, destinationStationId: string, preference: RoutingPreference) {
  const start: SearchNode = {
    key: keyOf(originStationId, null),
    stationId: originStationId,
    lineId: null,
    minutes: 0,
    transfers: 0,
    previousKey: null
  };

  const queue: SearchNode[] = [start];
  const best = new Map<string, SearchNode>([[start.key, start]]);

  while (queue.length > 0) {
    sortQueue(preference, queue);
    const current = queue.shift();
    if (!current) break;

    const snapshot = best.get(current.key);
    if (!snapshot) continue;
    if (snapshot.minutes !== current.minutes || snapshot.transfers !== current.transfers) {
      continue;
    }

    if (current.stationId === destinationStationId) {
      return reconstructPath(best, current.key);
    }

    for (const edge of adjacency.get(current.stationId) ?? []) {
      const transfer = current.lineId && current.lineId !== edge.lineId ? 1 : 0;
      const transferPenalty = current.lineId && current.lineId !== edge.lineId ? BASE_TRANSFER_PENALTY : 0;

      const next: SearchNode = {
        key: keyOf(edge.toStationId, edge.lineId),
        stationId: edge.toStationId,
        lineId: edge.lineId,
        minutes: current.minutes + edge.minutes + transferPenalty,
        transfers: current.transfers + transfer,
        previousKey: current.key
      };

      const existing = best.get(next.key);

      if (isBetterCost(preference, next, existing)) {
        best.set(next.key, next);
        queue.push(next);
      }
    }
  }

  return null;
}

function buildLegs(routeStates: SearchNode[]): RouteLeg[] {
  const legs: RouteLeg[] = [];

  for (let index = 1; index < routeStates.length; index += 1) {
    const previous = routeStates[index - 1];
    const current = routeStates[index];
    const lineId = current.lineId;
    if (!lineId) continue;

    const edge = (adjacency.get(previous.stationId) ?? []).find(
      (item) => item.toStationId === current.stationId && item.lineId === lineId
    );

    if (!edge) continue;

    legs.push({
      fromStationId: previous.stationId,
      toStationId: current.stationId,
      lineId: edge.lineId,
      minutes: edge.minutes,
      stops: 1
    });
  }

  return legs;
}

function routeStationIdsFromLegs(legs: RouteLeg[], originStationId: string) {
  const ids = [originStationId];
  for (const leg of legs) ids.push(leg.toStationId);
  return ids;
}

function buildDirectWalkOnlyInstructions(
  destinationLabel: string,
  totalWalkMinutes: number,
  language: Language
): RouteInstruction[] {
  const instructions: RouteInstruction[] = [];

  if (totalWalkMinutes > 0) {
    instructions.push({
      type: "walk",
      text: t(language, "walkToDestination", { label: destinationLabel, minutes: totalWalkMinutes }),
      minutes: totalWalkMinutes
    });
  }

  instructions.push({ type: "arrive", text: t(language, "arriveAt", { label: destinationLabel }) });
  return instructions;
}

function groupInstructions(
  legs: RouteLeg[],
  originStationLabel: string,
  destinationLabel: string,
  accessWalk: number,
  egressWalk: number,
  language: Language
): RouteInstruction[] {
  if (legs.length === 0) {
    return buildDirectWalkOnlyInstructions(destinationLabel, accessWalk + egressWalk, language);
  }

  const instructions: RouteInstruction[] = [];

  if (accessWalk > 0) {
    instructions.push({
      type: "walk",
      text: t(language, "walkToStation", { station: originStationLabel, minutes: accessWalk }),
      minutes: accessWalk
    });
  }

  let currentGroup: RouteLeg[] = [];

  const flushGroup = () => {
    if (currentGroup.length === 0) return;

    const firstLeg = currentGroup[0];
    const lastLeg = currentGroup[currentGroup.length - 1];
    const line = getLine(firstLeg.lineId);

    if (instructions.some((item) => item.type === "ride")) {
      instructions.push({
        type: "transfer",
        text: t(language, "transferAt", {
          station: getStation(firstLeg.fromStationId).name[language],
          line: `${line.shortName} · ${localize(line.name, language)}`
        })
      });
    }

    instructions.push({
      type: "board",
      text: t(language, "boardLine", {
        line: `${line.shortName} · ${localize(line.name, language)}`,
        station: getStation(firstLeg.fromStationId).name[language]
      })
    });

    const totalStops = currentGroup.reduce((sum, leg) => sum + leg.stops, 0);
    const totalMinutes = currentGroup.reduce((sum, leg) => sum + leg.minutes, 0);

    instructions.push({
      type: "ride",
      text: t(language, "rideTo", {
        station: getStation(lastLeg.toStationId).name[language],
        stops: totalStops,
        minutes: totalMinutes
      }),
      minutes: totalMinutes
    });

    currentGroup = [];
  };

  for (const leg of legs) {
    if (currentGroup.length === 0 || currentGroup[0].lineId === leg.lineId) {
      currentGroup.push(leg);
      continue;
    }

    flushGroup();
    currentGroup.push(leg);
  }

  flushGroup();

  if (egressWalk > 0) {
    instructions.push({
      type: "walk",
      text: t(language, "walkToDestination", { label: destinationLabel, minutes: egressWalk }),
      minutes: egressWalk
    });
  }

  instructions.push({ type: "arrive", text: t(language, "arriveAt", { label: destinationLabel }) });
  return instructions;
}

function dedupeOptions(options: RouteOption[]) {
  const seen = new Set<string>();

  return options.filter((option) => {
    const key = `${option.stationIds.join("|")}::${option.lineIds.join("|")}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function resolveTarget(target: SearchTarget, language: Language): ResolvedEndpoint {
  if (target.type === "station") {
    const station = getStation(target.stationId);
    return {
      stationId: station.id,
      walkingMinutes: 0,
      walkingDistanceMeters: 0,
      label: station.name[language]
    };
  }

  if (target.type === "place") {
    const place = getPlace(target.placeId);
    const nearest = place.preferredStationId
      ? {
          stationId: place.preferredStationId,
          distanceMeters: haversineDistanceMeters(place.coordinates, getStation(place.preferredStationId).coordinates),
          walkingMinutes: estimateWalkingMinutes(
            haversineDistanceMeters(place.coordinates, getStation(place.preferredStationId).coordinates)
          )
        }
      : findNearestStation(place.coordinates);

    return {
      stationId: nearest.stationId,
      walkingMinutes: nearest.walkingMinutes,
      walkingDistanceMeters: nearest.distanceMeters,
      label: place.name[language]
    };
  }

  const nearest = findNearestStation(target.coordinates);
  return {
    stationId: nearest.stationId,
    walkingMinutes: nearest.walkingMinutes,
    walkingDistanceMeters: nearest.distanceMeters,
    label: target.label
  };
}

function buildOption(
  originTarget: SearchTarget,
  destinationTarget: SearchTarget,
  language: Language,
  preference: RoutingPreference
): RouteOption | null {
  const resolvedOrigin = resolveTarget(originTarget, language);
  const resolvedDestination = resolveTarget(destinationTarget, language);
  const states = findBestPath(resolvedOrigin.stationId, resolvedDestination.stationId, preference);
  if (!states) return null;

  const legs = buildLegs(states);
  const inVehicleMinutes = legs.reduce((sum, leg) => sum + leg.minutes, 0);
  const lineIds = legs.map((leg) => leg.lineId);
  const stationIds = routeStationIdsFromLegs(legs, resolvedOrigin.stationId);
  const transferCount = states[states.length - 1]?.transfers ?? 0;
  const totalMinutes =
    inVehicleMinutes +
    resolvedOrigin.walkingMinutes +
    resolvedDestination.walkingMinutes +
    transferCount * BASE_TRANSFER_PENALTY;

  return {
    id: `${preference}-${stationIds.join("-")}`,
    preference,
    totalMinutes,
    inVehicleMinutes,
    walkingMinutes: resolvedOrigin.walkingMinutes + resolvedDestination.walkingMinutes,
    accessWalkingMinutes: resolvedOrigin.walkingMinutes,
    egressWalkingMinutes: resolvedDestination.walkingMinutes,
    transferCount,
    stopCount: legs.reduce((sum, leg) => sum + leg.stops, 0),
    stationIds,
    lineIds,
    legs,
    instructions: groupInstructions(
      legs,
      getStation(resolvedOrigin.stationId).name[language],
      resolvedDestination.label,
      resolvedOrigin.walkingMinutes,
      resolvedDestination.walkingMinutes,
      language
    ),
    accessStationId: resolvedOrigin.stationId,
    egressStationId: resolvedDestination.stationId,
    originLabel: resolvedOrigin.label,
    destinationLabel: resolvedDestination.label
  };
}

export function planRoutes(
  originTarget: SearchTarget | null,
  destinationTarget: SearchTarget | null,
  language: Language
) {
  if (!originTarget || !destinationTarget) return [];

  const options = [
    buildOption(originTarget, destinationTarget, language, "fastest"),
    buildOption(originTarget, destinationTarget, language, "fewerChanges")
  ].filter(Boolean) as RouteOption[];

  return dedupeOptions(options).sort((a, b) => {
    if (a.totalMinutes !== b.totalMinutes) return a.totalMinutes - b.totalMinutes;
    return a.transferCount - b.transferCount;
  });
}

export function routeSummaryText(option: RouteOption, language: Language) {
  return `${t(language, "total")}: ${option.totalMinutes} min · ${t(language, "transfers")}: ${option.transferCount} · ${t(language, "stops")}: ${option.stopCount}`;
}

export function alternativeLabel(option: RouteOption, language: Language) {
  return t(language, "routeAlternativeLabel", {
    mode: modeLabel(language, option.preference).toLowerCase()
  });
}
