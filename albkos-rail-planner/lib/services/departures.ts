import { getLine, getStation } from "@/lib/data";
import { DepartureItem } from "@/lib/types/model";

function pad(value: number) {
  return value.toString().padStart(2, "0");
}

export function buildSimulatedDepartures(stationId: string, now = new Date()): DepartureItem[] {
  const station = getStation(stationId);
  const items: DepartureItem[] = [];

  for (const lineId of station.lines) {
    const line = getLine(lineId);
    const position = line.stationIds.indexOf(stationId);
    if (position === -1) continue;

    const destinations = [line.stationIds[0], line.stationIds[line.stationIds.length - 1]].filter(
      (destinationId) => destinationId !== stationId
    );

    destinations.forEach((destinationStationId, index) => {
      const offset = (position * 2 + index * 3) % line.serviceHeadwayMinutes;
      const minuteOfDay = now.getHours() * 60 + now.getMinutes();
      const nextMinute =
        minuteOfDay +
        ((line.serviceHeadwayMinutes - ((minuteOfDay + offset) % line.serviceHeadwayMinutes)) %
          line.serviceHeadwayMinutes);

      const departure = new Date(now);
      departure.setHours(Math.floor(nextMinute / 60), nextMinute % 60, 0, 0);

      items.push({
        lineId,
        destinationStationId,
        minutesFromNow: Math.max(1, Math.round((departure.getTime() - now.getTime()) / 60000)),
        departureIso: `${pad(departure.getHours())}:${pad(departure.getMinutes())}`
      });
    });
  }

  return items.sort((a, b) => a.minutesFromNow - b.minutesFromNow).slice(0, 6);
}
