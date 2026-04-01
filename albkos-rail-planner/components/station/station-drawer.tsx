import { getLine, getStation } from "@/lib/data";
import { DepartureItem, Language, Station } from "@/lib/types/model";
import { SectionCard } from "@/components/ui/section-card";
import { t } from "@/lib/services/i18n";

type StationDrawerProps = {
  stationId: string | null;
  language: Language;
  departures: DepartureItem[];
  nearby: Array<{ station: Station; distanceMeters: number }>;
  onSetAsStart: (stationId: string) => void;
  onSetAsDestination: (stationId: string) => void;
};

const kindKeys = {
  core: "stationBadgeCore",
  interchange: "stationBadgeInterchange",
  airport: "stationBadgeAirport",
  regional: "stationBadgeRegional",
  coastal: "stationBadgeCoastal"
} as const;

export function StationDrawer({
  stationId,
  language,
  departures,
  nearby,
  onSetAsStart,
  onSetAsDestination
}: StationDrawerProps) {
  if (!stationId) {
    return (
      <SectionCard title={t(language, "selectedStation")}>
        <p className="text-sm text-slate-500">{t(language, "emptyStation")}</p>
      </SectionCard>
    );
  }

  const station = getStation(stationId);

  return (
    <SectionCard
      title={station.name[language]}
      subtitle={station.municipality[language]}
      actions={
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => onSetAsStart(station.id)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t(language, "setAsStart")}
          </button>
          <button
            type="button"
            onClick={() => onSetAsDestination(station.id)}
            className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
          >
            {t(language, "setAsDestination")}
          </button>
        </div>
      }
    >
      <div className="flex flex-wrap gap-2">
        <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600">
          {t(language, kindKeys[station.kind])}
        </span>
        {station.lines.map((lineId) => {
          const line = getLine(lineId);
          return (
            <span
              key={lineId}
              className="rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${line.color}1A`, color: line.color }}
            >
              {line.shortName}
            </span>
          );
        })}
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2">
        <div className="rounded-2xl bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(language, "departures")}
          </h4>
          <div className="mt-2 space-y-2">
            {departures.length === 0 ? (
              <div className="text-sm text-slate-500">—</div>
            ) : (
              departures.map((item) => {
                const line = getLine(item.lineId);
                const destination = getStation(item.destinationStationId);
                return (
                  <div key={`${item.lineId}-${item.destinationStationId}`} className="flex items-center justify-between gap-3 text-sm">
                    <div>
                      <div className="font-semibold text-slate-900">{line.shortName}</div>
                      <div className="text-xs text-slate-500">{destination.name[language]}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{item.departureIso}</div>
                      <div className="text-xs text-slate-500">+{item.minutesFromNow} min</div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="rounded-2xl bg-slate-50 p-3">
          <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            {t(language, "nearbyStations")}
          </h4>
          <div className="mt-2 space-y-2">
            {nearby.length === 0 ? (
              <div className="text-sm text-slate-500">—</div>
            ) : (
              nearby.map(({ station: nearbyStation, distanceMeters }) => (
                <div key={nearbyStation.id} className="flex items-center justify-between gap-3 text-sm">
                  <div className="font-medium text-slate-900">{nearbyStation.name[language]}</div>
                  <div className="text-xs text-slate-500">{(distanceMeters / 1000).toFixed(1)} km</div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-2xl bg-slate-50 p-3">
        <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          {t(language, "plannerStandards")}
        </h4>
        <p className="mt-2 text-sm leading-6 text-slate-600">{t(language, "standardsBody")}</p>
      </div>
    </SectionCard>
  );
}
