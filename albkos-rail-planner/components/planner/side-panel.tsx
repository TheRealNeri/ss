import { getStation } from "@/lib/data";
import { SearchCombobox } from "@/components/planner/search-combobox";
import { RouteCard } from "@/components/planner/route-card";
import { StationDrawer } from "@/components/station/station-drawer";
import { Chip } from "@/components/ui/chip";
import { SectionCard } from "@/components/ui/section-card";
import { localize, modeLabel, t } from "@/lib/services/i18n";
import {
  DepartureItem,
  Language,
  Line,
  RouteOption,
  RoutingPreference,
  SearchTarget,
  Station
} from "@/lib/types/model";

type SidePanelProps = {
  language: Language;
  routePreference: RoutingPreference;
  setRoutePreference: (value: RoutingPreference) => void;
  fromTarget: SearchTarget | null;
  toTarget: SearchTarget | null;
  setFromTarget: (value: SearchTarget | null) => void;
  setToTarget: (value: SearchTarget | null) => void;
  onSwap: () => void;
  routeOptions: RouteOption[];
  activeRoute: RouteOption | null;
  onChooseRoute: (optionId: string) => void;
  onFitRoute: () => void;
  onFitNetwork: () => void;
  lines: Line[];
  visibleLineIds: string[];
  onToggleVisibleLine: (lineId: string) => void;
  onShowAllLines: () => void;
  focusedLineId: string | null;
  onFocusLine: (lineId: string | null) => void;
  selectedStationId: string | null;
  departures: DepartureItem[];
  nearby: Array<{ station: Station; distanceMeters: number }>;
  onSetStationAsStart: (stationId: string) => void;
  onSetStationAsDestination: (stationId: string) => void;
  mapNearestPoint: {
    coordinates: [number, number];
    stationId: string;
    walkingMinutes: number;
    distanceMeters: number;
  } | null;
  onUseMapPointAsStart: () => void;
  onUseMapPointAsDestination: () => void;
  focusedLine: Line | null;
};

export function SidePanel(props: SidePanelProps) {
  const {
    language,
    routePreference,
    setRoutePreference,
    fromTarget,
    toTarget,
    setFromTarget,
    setToTarget,
    onSwap,
    routeOptions,
    activeRoute,
    onChooseRoute,
    onFitRoute,
    onFitNetwork,
    lines,
    visibleLineIds,
    onToggleVisibleLine,
    onShowAllLines,
    focusedLineId,
    onFocusLine,
    selectedStationId,
    departures,
    nearby,
    onSetStationAsStart,
    onSetStationAsDestination,
    mapNearestPoint,
    onUseMapPointAsStart,
    onUseMapPointAsDestination,
    focusedLine
  } = props;

  const nearestStation = mapNearestPoint ? getStation(mapNearestPoint.stationId) : null;

  return (
    <div className="glass flex h-full flex-col overflow-hidden rounded-[2rem]">
      <div className="flex-none border-b border-slate-200/80 p-4 md:p-5">
        <div className="mb-3">
          <h1 className="text-xl font-bold text-slate-950">{t(language, "appTitle")}</h1>
          <p className="mt-1 text-sm text-slate-500">{t(language, "appSubtitle")}</p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {t(language, "from")}
            </label>
            <SearchCombobox
              value={fromTarget}
              language={language}
              placeholder={t(language, "searchPlaceholder")}
              onSelect={setFromTarget}
            />
          </div>

          <div className="flex justify-center">
            <button
              type="button"
              onClick={onSwap}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              {t(language, "swap")}
            </button>
          </div>

          <div>
            <label className="mb-2 block text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              {t(language, "to")}
            </label>
            <SearchCombobox
              value={toTarget}
              language={language}
              placeholder={t(language, "searchPlaceholder")}
              onSelect={setToTarget}
            />
          </div>

          <p className="text-xs leading-5 text-slate-500">{t(language, "stationSearchHint")}</p>
        </div>
      </div>

      <div className="panel-scroll-shadow scrollbar-thin flex-1 space-y-4 overflow-y-auto p-4 md:p-5">
        <SectionCard title={t(language, "routeModes")}>
          <div className="flex flex-wrap gap-2">
            {(["fastest", "fewerChanges"] as const).map((mode) => (
              <Chip key={mode} active={routePreference === mode} onClick={() => setRoutePreference(mode)}>
                {modeLabel(language, mode)}
              </Chip>
            ))}
            <Chip onClick={onFitNetwork}>{t(language, "fitNetwork")}</Chip>
            {activeRoute && <Chip onClick={onFitRoute}>{t(language, "fitRoute")}</Chip>}
          </div>
        </SectionCard>

        {routeOptions.length > 0 ? (
          <div className="space-y-3">
            {routeOptions.map((option) => (
              <RouteCard
                key={option.id}
                option={option}
                language={language}
                active={activeRoute?.id === option.id}
                onSelect={onChooseRoute}
                onFitRoute={onFitRoute}
              />
            ))}

            {activeRoute && (
              <SectionCard title={t(language, "routeInstructions")} subtitle={t(language, "routeSummary")}>
                <ol className="space-y-2">
                  {activeRoute.instructions.map((instruction, index) => (
                    <li key={`${instruction.type}-${index}`} className="rounded-2xl bg-slate-50 px-3 py-2 text-sm text-slate-700">
                      {instruction.text}
                    </li>
                  ))}
                </ol>
              </SectionCard>
            )}
          </div>
        ) : (
          <SectionCard title={t(language, "routeSummary")}>
            <p className="text-sm text-slate-500">
              {fromTarget && toTarget ? t(language, "noRoute") : t(language, "emptyRoute")}
            </p>
          </SectionCard>
        )}

        {mapNearestPoint && nearestStation && (
          <SectionCard title={t(language, "nearestPointTitle")}>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-semibold text-slate-900">{nearestStation.name[language]}</div>
                <div className="mt-1 text-xs text-slate-500">
                  {t(language, "walking")}: {mapNearestPoint.walkingMinutes} min · {(mapNearestPoint.distanceMeters / 1000).toFixed(2)} km
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Chip onClick={onUseMapPointAsStart}>{t(language, "setMapPointStart")}</Chip>
                <Chip onClick={onUseMapPointAsDestination}>{t(language, "setMapPointDestination")}</Chip>
              </div>
            </div>
          </SectionCard>
        )}

        <SectionCard title={t(language, "lineFilters")} subtitle={t(language, "mapClickedHint")}>
          <div className="mb-3 flex flex-wrap gap-2">
            <Chip onClick={onShowAllLines}>{t(language, "showAllLines")}</Chip>
            {focusedLineId && <Chip onClick={() => onFocusLine(null)}>{t(language, "clearFocus")}</Chip>}
            {lines.map((line) => (
              <button
                key={line.id}
                type="button"
                onClick={() => onFocusLine(line.id)}
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                <span className="inline-flex h-2.5 w-2.5 rounded-full" style={{ backgroundColor: line.color }} />
                {line.shortName}
                {focusedLineId === line.id && <span className="text-xs text-slate-400">focus</span>}
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            {lines.map((line) => (
              <button
                key={`${line.id}-toggle`}
                type="button"
                onClick={() => onToggleVisibleLine(line.id)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  visibleLineIds.includes(line.id)
                    ? "border-transparent text-white"
                    : "border-slate-200 bg-white text-slate-500"
                ].join(" ")}
                style={visibleLineIds.includes(line.id) ? { backgroundColor: line.color } : undefined}
              >
                {line.shortName}
              </button>
            ))}
          </div>
        </SectionCard>

        {focusedLine && (
          <SectionCard
            title={t(language, "lineInfo")}
            subtitle={`${focusedLine.shortName} · ${localize(focusedLine.name, language)}`}
          >
            <div className="space-y-2 text-sm text-slate-700">
              <div>
                {t(language, "stationCount", { count: focusedLine.stationIds.length })} · {focusedLine.mode}
              </div>
              <div>
                Headway {focusedLine.serviceHeadwayMinutes} min · Speed {focusedLine.speedKph} km/h
              </div>
              <div className="flex flex-wrap gap-2 pt-1">
                {focusedLine.stationIds.map((stationId) => (
                  <span
                    key={stationId}
                    className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600"
                  >
                    {getStation(stationId).name[language]}
                  </span>
                ))}
              </div>
            </div>
          </SectionCard>
        )}

        <StationDrawer
          stationId={selectedStationId}
          language={language}
          departures={departures}
          nearby={nearby}
          onSetAsStart={onSetStationAsStart}
          onSetAsDestination={onSetStationAsDestination}
        />
      </div>
    </div>
  );
}
