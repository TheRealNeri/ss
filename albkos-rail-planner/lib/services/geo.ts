const EARTH_RADIUS_METERS = 6371000;
const WALKING_SPEED_METERS_PER_MINUTE = 80;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(a: [number, number], b: [number, number]) {
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
      Math.sqrt(
        sinLat * sinLat +
          Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinLng * sinLng
      ),
      Math.sqrt(
        1 -
          (sinLat * sinLat +
            Math.cos(lat1Rad) * Math.cos(lat2Rad) * sinLng * sinLng)
      )
    );

  return EARTH_RADIUS_METERS * c;
}

export function estimateWalkingMinutes(distanceMeters: number) {
  const adjusted = distanceMeters * 1.2;
  return Math.max(2, Math.round(adjusted / WALKING_SPEED_METERS_PER_MINUTE));
}

export function fitBoundsFromCoordinates(coordinates: [number, number][]) {
  if (coordinates.length === 0) {
    return null;
  }

  let minLng = coordinates[0][0];
  let minLat = coordinates[0][1];
  let maxLng = coordinates[0][0];
  let maxLat = coordinates[0][1];

  for (const [lng, lat] of coordinates) {
    minLng = Math.min(minLng, lng);
    minLat = Math.min(minLat, lat);
    maxLng = Math.max(maxLng, lng);
    maxLat = Math.max(maxLat, lat);
  }

  return [
    [minLng, minLat],
    [maxLng, maxLat]
  ] as [[number, number], [number, number]];
}
