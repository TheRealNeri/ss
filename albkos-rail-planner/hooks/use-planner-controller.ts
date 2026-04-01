"use client";

import { useMemo, useState } from "react";
import { getLine, getStation } from "@/lib/data";
import { lines } from "@/lib/data/lines";
import { buildSimulatedDepartures } from "@/lib/services/departures";
import { alternativeLabel, planRoutes } from "@/lib/services/routing";
import { findNearestStation, nearbyStations } from "@/lib/services/search";
import { Language, RouteOption, RoutingPreference, SearchTarget } from "@/lib/types/model";

export function usePlannerController() {
  const [language, setLanguageState] = useState<Language>("en");
  const [mode3d, setMode3d] = useState(false);
  const [routePreference, setRoutePreferenceState] = useState<RoutingPreference>("fastest");
  const [fromTarget, setFromTargetState] = useState<SearchTarget | null>({
    type: "place",
    placeId: "sheshi-skenderbej-place",
    label: "Sheshi Skënderbej"
  });
  const [toTarget, setToTargetState] = useState<SearchTarget | null>({
    type: "place",
    placeId: "rinas-place",
    label: "Rinas Airport"
  });
  const [selectedStationId, setSelectedStationId] = useState<string | null>("sheshi-skenderbej");
  const [visibleLineIds, setVisibleLineIds] = useState<string[]>(lines.map((line) => line.id));
  const [focusedLineId, setFocusedLineId] = useState<string | null>(null);
  const [mapNearestPoint, setMapNearestPoint] = useState<{
    coordinates: [number, number];
    stationId: string;
    walkingMinutes: number;
    distanceMeters: number;
  } | null>(null);
  const [activeRouteId, setActiveRouteId] = useState<string | null>(null);

  const routeOptions = useMemo(() => planRoutes(fromTarget, toTarget, language), [fromTarget, toTarget, language]);

  const activeRoute: RouteOption | null = useMemo(() => {
    const preferred =
      routeOptions.find((option) => option.preference === routePreference) ?? routeOptions[0] ?? null;

    if (!preferred) return null;
    if (!activeRouteId) return preferred;

    return routeOptions.find((option) => option.id === activeRouteId) ?? preferred;
  }, [activeRouteId, routeOptions, routePreference]);

  const departures = selectedStationId ? buildSimulatedDepartures(selectedStationId) : [];
  const nearby = selectedStationId ? nearbyStations(selectedStationId) : [];
  const focusedLine = focusedLineId ? getLine(focusedLineId) : null;

  function setLanguage(languageValue: Language) {
    setLanguageState(languageValue);
  }

  function setRoutePreference(value: RoutingPreference) {
    setRoutePreferenceState(value);
    setActiveRouteId(null);
  }

  function setFromTarget(value: SearchTarget | null) {
    setFromTargetState(value);
    setActiveRouteId(null);
  }

  function setToTarget(value: SearchTarget | null) {
    setToTargetState(value);
    setActiveRouteId(null);
  }

  function chooseStation(stationId: string) {
    setSelectedStationId(stationId);
  }

  function swapTargets() {
    setFromTargetState(toTarget);
    setToTargetState(fromTarget);
    setActiveRouteId(null);
  }

  function focusLine(lineId: string | null) {
    setFocusedLineId((current) => {
      const next = current === lineId ? null : lineId;
      setVisibleLineIds(next ? [next] : lines.map((line) => line.id));
      return next;
    });
  }

  function toggleVisibleLine(lineId: string) {
    setVisibleLineIds((current) => {
      const next = current.includes(lineId)
        ? current.filter((item) => item !== lineId)
        : [...current, lineId];

      if (next.length === 0) {
        return current;
      }

      if (focusedLineId && !next.includes(focusedLineId)) {
        setFocusedLineId(null);
      }

      return next;
    });
  }

  function restoreAllLines() {
    setVisibleLineIds(lines.map((line) => line.id));
    setFocusedLineId(null);
  }

  function setMapPointTarget(targetType: "from" | "to", coordinates: [number, number], label?: string) {
    const nearest = findNearestStation(coordinates);
    const target: SearchTarget = {
      type: "coordinate",
      id: `${coordinates[0]}-${coordinates[1]}`,
      coordinates,
      label: label ?? `${getStation(nearest.stationId).name[language]} · ${nearest.walkingMinutes} min walk`
    };

    if (targetType === "from") {
      setFromTarget(target);
    } else {
      setToTarget(target);
    }
  }

  function onMapBackgroundClick(coordinates: [number, number]) {
    const nearest = findNearestStation(coordinates);
    setMapNearestPoint({
      coordinates,
      stationId: nearest.stationId,
      walkingMinutes: nearest.walkingMinutes,
      distanceMeters: nearest.distanceMeters
    });
    setSelectedStationId(nearest.stationId);
  }

  function chooseRoute(optionId: string) {
    setActiveRouteId(optionId);
  }

  return {
    language,
    setLanguage,
    mode3d,
    setMode3d,
    routePreference,
    setRoutePreference,
    fromTarget,
    setFromTarget,
    toTarget,
    setToTarget,
    selectedStationId,
    chooseStation,
    routeOptions,
    activeRoute,
    activeRouteLabel: activeRoute ? alternativeLabel(activeRoute, language) : null,
    visibleLineIds,
    toggleVisibleLine,
    restoreAllLines,
    focusedLineId,
    focusLine,
    departures,
    nearby,
    focusedLine,
    mapNearestPoint,
    setMapPointTarget,
    onMapBackgroundClick,
    swapTargets,
    chooseRoute
  };
}
