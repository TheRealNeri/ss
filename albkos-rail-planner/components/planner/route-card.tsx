import { getLine, getStation } from "@/lib/data";
import { alternativeLabel, routeSummaryText } from "@/lib/services/routing";
import { Language, RouteOption } from "@/lib/types/model";
import { SectionCard } from "@/components/ui/section-card";
import { t } from "@/lib/services/i18n";

type RouteCardProps = {
  option: RouteOption;
  language: Language;
  active: boolean;
  onSelect: (optionId: string) => void;
  onFitRoute: () => void;
};

export function RouteCard({ option, language, active, onSelect, onFitRoute }: RouteCardProps) {
  const linesUsed = Array.from(new Set(option.lineIds)).map((lineId) => getLine(lineId));
  const accessStation = getStation(option.accessStationId);
  const egressStation = getStation(option.egressStationId);

  return (
    <SectionCard
      className={active ? "ring-2 ring-slate-900" : ""}
      title={alternativeLabel(option, language)}
      subtitle={routeSummaryText(option, language)}
      actions={
        <button
          type="button"
          onClick={onFitRoute}
          className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
        >
          {t(language, "fitRoute")}
        </button>
      }
    >
      <button type="button" onClick={() => onSelect(option.id)} className="w-full text-left">
        <div className="flex flex-wrap gap-2">
          {linesUsed.map((line) => (
            <span
              key={line.id}
              className="inline-flex items-center gap-2 rounded-full px-2.5 py-1 text-xs font-semibold"
              style={{ backgroundColor: `${line.color}1A`, color: line.color }}
            >
              <span className="inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: line.color }} />
              {line.shortName}
            </span>
          ))}
        </div>

        <div className="mt-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-slate-900">
              {option.originLabel} → {option.destinationLabel}
            </div>
            <div className="mt-1 truncate text-xs text-slate-500">
              {t(language, "routeVia", { station: accessStation.name[language] })}
              {option.egressWalkingMinutes > 0 ? ` · ${egressStation.name[language]}` : ""}
            </div>
            <div className="mt-1 text-xs text-slate-500">
              {t(language, "walking")}: {option.walkingMinutes} min · {t(language, "ride")}: {option.inVehicleMinutes} min
            </div>
          </div>
          <div className="shrink-0 text-right text-sm font-semibold text-slate-900">{option.totalMinutes} min</div>
        </div>
      </button>
    </SectionCard>
  );
}
