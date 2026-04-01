import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

function loadArray(relativePath, variableName) {
  const fullPath = path.join(root, relativePath);
  let source = fs.readFileSync(fullPath, "utf8");
  source = source.replace(/^import .*?;\n/gm, "");
  source = source.replace(new RegExp(`export const ${variableName}\\s*:\\s*[^=]+=`), "const data =");
  const fn = new Function(`${source}\nreturn data;`);
  return fn();
}

const stations = loadArray("lib/data/stations.ts", "stations");
const lines = loadArray("lib/data/lines.ts", "lines");
const places = loadArray("lib/data/places.ts", "places");

const stationMap = new Map(stations.map((station) => [station.id, station]));
const placeMap = new Map(places.map((place) => [place.id, place]));

function haversineDistanceMeters(a, b) {
  const EARTH_RADIUS_METERS = 6371000;
  const toRadians = (value) => (value * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const lat1Rad = toRadians(lat1);
  const lat2Rad = toRadians(lat2);
  const sinLat = Math.sin(dLat / 2);
  const sinLng = Math.sin(dLng / 2);
  const c =
    2 *
    Math.atan2(
      Math.sqrt(sinLat * sinLat + Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinLng * sinLng),
      Math.sqrt(1 - (sinLat * sinLat + Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinLng * sinLng))
    );
  return EARTH_RADIUS_METERS * c;
}

function estimateWalkingMinutes(distanceMeters) {
  return Math.max(2, Math.round((distanceMeters * 1.2) / 80));
}

function getStation(id) {
  const station = stationMap.get(id);
  if (!station) throw new Error(`Unknown station: ${id}`);
  return station;
}

function findNearestStation(coordinates) {
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

function resolveTarget(target) {
  if (target.type === "station") {
    return { stationId: target.stationId, walkingMinutes: 0, label: getStation(target.stationId).name.en };
  }

  if (target.type === "place") {
    const place = placeMap.get(target.placeId);
    const nearest = place.preferredStationId
      ? {
          stationId: place.preferredStationId,
          distanceMeters: haversineDistanceMeters(place.coordinates, getStation(place.preferredStationId).coordinates),
          walkingMinutes: estimateWalkingMinutes(
            haversineDistanceMeters(place.coordinates, getStation(place.preferredStationId).coordinates)
          )
        }
      : findNearestStation(place.coordinates);

    return { stationId: nearest.stationId, walkingMinutes: nearest.walkingMinutes, label: place.name.en };
  }

  const nearest = findNearestStation(target.coordinates);
  return { stationId: nearest.stationId, walkingMinutes: nearest.walkingMinutes, label: target.label };
}

function edgeMinutes(line, fromStationId, toStationId) {
  const from = getStation(fromStationId);
  const to = getStation(toStationId);
  const distanceKm = haversineDistanceMeters(from.coordinates, to.coordinates) / 1000;
  return Math.max(2, Math.round((distanceKm / line.speedKph) * 60 + line.dwellMinutes));
}

const adjacency = new Map();

for (const line of lines) {
  for (let index = 0; index < line.stationIds.length - 1; index += 1) {
    const fromStationId = line.stationIds[index];
    const toStationId = line.stationIds[index + 1];
    const minutes = edgeMinutes(line, fromStationId, toStationId);
    for (const [from, to] of [
      [fromStationId, toStationId],
      [toStationId, fromStationId]
    ]) {
      const bucket = adjacency.get(from) ?? [];
      bucket.push({ fromStationId: from, toStationId: to, lineId: line.id, minutes });
      adjacency.set(from, bucket);
    }
  }
}

function keyOf(stationId, lineId) {
  return `${stationId}__${lineId ?? "none"}`;
}

function isBetter(candidate, current) {
  if (!current) return true;
  if (candidate.minutes !== current.minutes) return candidate.minutes < current.minutes;
  return candidate.transfers < current.transfers;
}

function findBestPath(originStationId, destinationStationId) {
  const start = {
    key: keyOf(originStationId, null),
    stationId: originStationId,
    lineId: null,
    minutes: 0,
    transfers: 0,
    previousKey: null
  };

  const best = new Map([[start.key, start]]);
  const queue = [start];

  while (queue.length > 0) {
    queue.sort((a, b) => a.minutes - b.minutes || a.transfers - b.transfers);
    const current = queue.shift();
    const snapshot = best.get(current.key);

    if (!snapshot || snapshot.minutes !== current.minutes || snapshot.transfers !== current.transfers) {
      continue;
    }

    if (current.stationId === destinationStationId) {
      const path = [];
      let cursor = current.key;
      while (cursor) {
        const node = best.get(cursor);
        if (!node) break;
        path.unshift(node);
        cursor = node.previousKey;
      }
      return path;
    }

    for (const edge of adjacency.get(current.stationId) ?? []) {
      const transfer = current.lineId && current.lineId !== edge.lineId ? 1 : 0;
      const transferPenalty = transfer ? 4 : 0;
      const next = {
        key: keyOf(edge.toStationId, edge.lineId),
        stationId: edge.toStationId,
        lineId: edge.lineId,
        minutes: current.minutes + edge.minutes + transferPenalty,
        transfers: current.transfers + transfer,
        previousKey: current.key
      };
      const existing = best.get(next.key);
      if (isBetter(next, existing)) {
        best.set(next.key, next);
        queue.push(next);
      }
    }
  }

  return null;
}

function plan(origin, destination) {
  const resolvedOrigin = resolveTarget(origin);
  const resolvedDestination = resolveTarget(destination);
  const path = findBestPath(resolvedOrigin.stationId, resolvedDestination.stationId);
  if (!path) {
    return null;
  }
  return {
    from: resolvedOrigin.label,
    to: resolvedDestination.label,
    stations: path.map((item) => getStation(item.stationId).name.en),
    minutes:
      (path[path.length - 1]?.minutes ?? 0) + resolvedOrigin.walkingMinutes + resolvedDestination.walkingMinutes
  };
}

const cases = [
  [{ type: "place", placeId: "sheshi-skenderbej-place" }, { type: "place", placeId: "rinas-place" }],
  [{ type: "station", stationId: "durres-qender" }, { type: "station", stationId: "kamez" }],
  [{ type: "station", stationId: "vore" }, { type: "place", placeId: "porti-i-durresit-place" }],
  [{ type: "place", placeId: "blloku-place" }, { type: "place", placeId: "rinas-place" }],
  [{ type: "place", placeId: "prishtina" }, { type: "place", placeId: "prishtina-airport-place" }],
  [{ type: "place", placeId: "sarande" }, { type: "place", placeId: "ksamil-beach" }]
];

for (const [origin, destination] of cases) {
  const result = plan(origin, destination);
  if (!result) {
    console.error("FAILED", origin, destination);
    process.exitCode = 1;
    continue;
  }

  console.log(`${result.from} -> ${result.to}`);
  console.log(`  Minutes: ${result.minutes}`);
  console.log(`  Stations: ${result.stations.join(" -> ")}`);
}
