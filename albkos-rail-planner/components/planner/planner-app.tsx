"use client";

import { useMemo, useRef } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { MapView, MapViewHandle } from "@/components/map/map-view";
import { SidePanel } from "@/components/planner/side-panel";
import { TopToolbar } from "@/components/planner/top-toolbar";
import { usePlannerController } from "@/hooks/use-planner-controller";
import { getStation } from "@/lib/data";
import { lines } from "@/lib/data/lines";
import { SearchTarget } from "@/lib/types/model";

export function PlannerApp() {
  const planner = usePlannerController();
  const mapRef = useRef<MapViewHandle | null>(null);

  const routeCoordinates = useMemo(
    () => (planner.activeRoute?.stationIds ?? []).map((stationId) => getStation(stationId).coordinates),
    [planner.activeRoute]
  );

  const setStationAsTarget = (targetType: "from" | "to", stationId: string) => {
    const station = getStation(stationId);
    const target: SearchTarget = {
      type: "station",
      stationId,
      label: station.name[planner.language]
    };

    if (targetType === "from") {
      planner.setFromTarget(target);
      return;
    }

    planner.setToTarget(target);
  };

  return (
    <AppShell
      toolbar={
        <TopToolbar
          language={planner.language}
          onLanguageChange={planner.setLanguage}
          mode3d={planner.mode3d}
          onToggleMode3d={() => planner.setMode3d((current) => !current)}
        />
      }
      panel={
        <SidePanel
          language={planner.language}
          routePreference={planner.routePreference}
          setRoutePreference={planner.setRoutePreference}
          fromTarget={planner.fromTarget}
          toTarget={planner.toTarget}
          setFromTarget={planner.setFromTarget}
          setToTarget={planner.setToTarget}
          onSwap={planner.swapTargets}
          routeOptions={planner.routeOptions}
          activeRoute={planner.activeRoute}
          onChooseRoute={planner.chooseRoute}
          onFitRoute={() => mapRef.current?.fitToRoute(routeCoordinates)}
          onFitNetwork={() => mapRef.current?.fitToNetwork()}
          lines={lines}
          visibleLineIds={planner.visibleLineIds}
          onToggleVisibleLine={planner.toggleVisibleLine}
          onShowAllLines={planner.restoreAllLines}
          focusedLineId={planner.focusedLineId}
          onFocusLine={planner.focusLine}
          selectedStationId={planner.selectedStationId}
          departures={planner.departures}
          nearby={planner.nearby}
          onSetStationAsStart={(stationId) => setStationAsTarget("from", stationId)}
          onSetStationAsDestination={(stationId) => setStationAsTarget("to", stationId)}
          mapNearestPoint={planner.mapNearestPoint}
          onUseMapPointAsStart={() => {
            if (!planner.mapNearestPoint) return;
            planner.setMapPointTarget("from", planner.mapNearestPoint.coordinates);
          }}
          onUseMapPointAsDestination={() => {
            if (!planner.mapNearestPoint) return;
            planner.setMapPointTarget("to", planner.mapNearestPoint.coordinates);
          }}
          focusedLine={planner.focusedLine}
        />
      }
    >
      <MapView
        ref={mapRef}
        language={planner.language}
        visibleLineIds={planner.visibleLineIds}
        focusedLineId={planner.focusedLineId}
        selectedStationId={planner.selectedStationId}
        routeStationIds={planner.activeRoute?.stationIds ?? []}
        routeLineIds={planner.activeRoute?.lineIds ?? []}
        mode3d={planner.mode3d}
        onStationSelect={planner.chooseStation}
        onMapBackgroundClick={planner.onMapBackgroundClick}
      />
    </AppShell>
  );
}
