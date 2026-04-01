"use client";

import { forwardRef, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import type { GeoJSONSource, Map as MapLibreMap, MapLayerMouseEvent, Popup } from "maplibre-gl";
import { getLine, getStation } from "@/lib/data";
import {
  buildActiveRouteCollection,
  buildLineFeatureCollection,
  buildStationFeatureCollection
} from "@/lib/services/map-data";
import { fitBoundsFromCoordinates } from "@/lib/services/geo";
import { MAP_STYLE_URL, NETWORK_CENTER, NETWORK_ZOOM } from "@/lib/services/map-style";
import { Language } from "@/lib/types/model";

export type MapViewHandle = {
  fitToNetwork: () => void;
  fitToRoute: (coordinates: [number, number][]) => void;
};

type MapViewProps = {
  language: Language;
  visibleLineIds: string[];
  focusedLineId: string | null;
  selectedStationId: string | null;
  routeStationIds: string[];
  routeLineIds: string[];
  mode3d: boolean;
  onStationSelect: (stationId: string) => void;
  onMapBackgroundClick: (coordinates: [number, number]) => void;
};

const SOURCE_IDS = {
  lines: "planner-lines",
  stations: "planner-stations",
  active: "planner-active"
};

function popupHtml(stationId: string, language: Language) {
  const station = getStation(stationId);
  const lineBadges = station.lines
    .map((lineId) => {
      const line = getLine(lineId);
      return `<span style="display:inline-flex;align-items:center;gap:6px;border-radius:999px;background:${line.color}1A;color:${line.color};padding:4px 10px;font-size:11px;font-weight:700;">${line.shortName}</span>`;
    })
    .join("");

  return `
    <div style="padding:14px 14px 12px 14px;min-width:220px;background:white;">
      <div style="font-size:14px;font-weight:800;color:#0f172a;">${station.name[language]}</div>
      <div style="margin-top:4px;font-size:12px;color:#64748b;">${station.municipality[language]}</div>
      <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">${lineBadges}</div>
    </div>
  `;
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(function MapView(
  {
    language,
    visibleLineIds,
    focusedLineId,
    selectedStationId,
    routeStationIds,
    routeLineIds,
    mode3d,
    onStationSelect,
    onMapBackgroundClick
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const popupRef = useRef<Popup | null>(null);
  const [loaded, setLoaded] = useState(false);
  const stationSelectRef = useRef(onStationSelect);
  const mapClickRef = useRef(onMapBackgroundClick);

  stationSelectRef.current = onStationSelect;
  mapClickRef.current = onMapBackgroundClick;

  const lineData = useMemo(
    () => buildLineFeatureCollection(visibleLineIds, focusedLineId, language),
    [visibleLineIds, focusedLineId, language]
  );

  const stationData = useMemo(
    () => buildStationFeatureCollection(language, selectedStationId, routeStationIds, routeLineIds),
    [language, selectedStationId, routeStationIds, routeLineIds]
  );

  const activeRouteData = useMemo(
    () => buildActiveRouteCollection(routeStationIds, routeLineIds),
    [routeStationIds, routeLineIds]
  );

  useImperativeHandle(
    ref,
    () => ({
      fitToNetwork: () => {
        if (!mapRef.current) return;

        const bounds = fitBoundsFromCoordinates(
          stationData.features.map((feature) => feature.geometry.coordinates as [number, number])
        );

        if (!bounds) return;

        mapRef.current.fitBounds(bounds, {
          padding: 70,
          duration: 900,
          maxZoom: 8.4
        });
      },
      fitToRoute: (coordinates: [number, number][]) => {
        if (!mapRef.current) return;

        const bounds = fitBoundsFromCoordinates(coordinates);
        if (!bounds) return;

        mapRef.current.fitBounds(bounds, {
          padding: 85,
          duration: 900,
          maxZoom: 10.8
        });
      }
    }),
    [stationData.features]
  );

  useEffect(() => {
    let cancelled = false;

    async function initialise() {
      if (!containerRef.current || mapRef.current) return;

      const maplibre = await import("maplibre-gl");
      if (cancelled || !containerRef.current) return;

      const map = new maplibre.Map({
        container: containerRef.current,
        style: MAP_STYLE_URL,
        center: NETWORK_CENTER,
        zoom: NETWORK_ZOOM,
        pitch: mode3d ? 52 : 0,
        bearing: mode3d ? -18 : 0,
        attributionControl: false
      });

      mapRef.current = map;
      map.addControl(new maplibre.NavigationControl({ visualizePitch: true }), "top-right");
      map.addControl(new maplibre.AttributionControl({ compact: true }), "bottom-right");

      map.on("load", () => {
        map.addSource(SOURCE_IDS.lines, { type: "geojson", data: lineData });
        map.addSource(SOURCE_IDS.stations, { type: "geojson", data: stationData });
        map.addSource(SOURCE_IDS.active, { type: "geojson", data: activeRouteData });

        map.addLayer({
          id: "line-casing",
          type: "line",
          source: SOURCE_IDS.lines,
          layout: {
            "line-sort-key": ["get", "sort"]
          },
          paint: {
            "line-color": "rgba(15,23,42,0.22)",
            "line-width": ["interpolate", ["linear"], ["zoom"], 6, 5.5, 11, 11]
          }
        });

        map.addLayer({
          id: "lines",
          type: "line",
          source: SOURCE_IDS.lines,
          layout: {
            "line-cap": "round",
            "line-join": "round",
            "line-sort-key": ["get", "sort"]
          },
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 6, 3.5, 11, 7.4],
            "line-opacity": ["get", "opacity"]
          }
        });

        map.addLayer({
          id: "active-route-casing",
          type: "line",
          source: SOURCE_IDS.active,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": "#ffffff",
            "line-width": ["interpolate", ["linear"], ["zoom"], 6, 7.5, 11, 12.5],
            "line-opacity": 0.92
          }
        });

        map.addLayer({
          id: "active-route",
          type: "line",
          source: SOURCE_IDS.active,
          layout: { "line-cap": "round", "line-join": "round" },
          paint: {
            "line-color": ["get", "color"],
            "line-width": ["interpolate", ["linear"], ["zoom"], 6, 4.4, 11, 8.8],
            "line-opacity": 1
          }
        });

        map.addLayer({
          id: "stations-minor",
          type: "circle",
          source: SOURCE_IDS.stations,
          filter: ["all", [">", ["get", "importance"], 2]],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 3.2, 12, 6],
            "circle-color": ["case", ["boolean", ["get", "onRoute"], false], "#0f172a", "#ffffff"],
            "circle-stroke-color": "#0f172a",
            "circle-stroke-width": 1.4,
            "circle-opacity": 0.95
          }
        });

        map.addLayer({
          id: "stations-major",
          type: "circle",
          source: SOURCE_IDS.stations,
          filter: ["all", ["<=", ["get", "importance"], 2]],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 5.5, 12, 10.5],
            "circle-color": [
              "case",
              ["boolean", ["get", "isSelected"], false],
              "#111827",
              ["boolean", ["get", "onRoute"], false],
              "#ffffff",
              ["boolean", ["get", "isInterchange"], false],
              "#0f172a",
              "#ffffff"
            ],
            "circle-stroke-color": "#0f172a",
            "circle-stroke-width": 2
          }
        });

        map.addLayer({
          id: "stations-selected-halo",
          type: "circle",
          source: SOURCE_IDS.stations,
          filter: ["all", ["boolean", ["get", "isSelected"], false]],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 7, 9, 12, 17],
            "circle-color": "rgba(37,99,235,0.08)",
            "circle-stroke-color": "rgba(37,99,235,0.38)",
            "circle-stroke-width": 2
          }
        });

        map.addLayer({
          id: "route-endpoints",
          type: "circle",
          source: SOURCE_IDS.stations,
          filter: ["all", ["==", ["get", "routeRole"], "endpoint"]],
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 6, 7.5, 11, 12.5],
            "circle-color": "#ffffff",
            "circle-stroke-color": "#0f172a",
            "circle-stroke-width": 2.6
          }
        });

        map.addLayer({
          id: "station-labels-major",
          type: "symbol",
          source: SOURCE_IDS.stations,
          minzoom: 6.2,
          filter: ["all", ["boolean", ["get", "showMajorLabel"], false]],
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Semibold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 7, 11, 11, 13.2],
            "text-variable-anchor": ["top", "right", "left", "bottom"],
            "text-radial-offset": 0.9,
            "text-justify": "auto",
            "symbol-sort-key": ["-", 10, ["get", "importance"]],
            "text-padding": 8
          },
          paint: {
            "text-color": "#0f172a",
            "text-halo-color": "rgba(255,255,255,0.94)",
            "text-halo-width": 1.8
          }
        });

        map.addLayer({
          id: "station-labels-minor",
          type: "symbol",
          source: SOURCE_IDS.stations,
          minzoom: 9.8,
          filter: ["all", ["boolean", ["get", "showMinorLabel"], false]],
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Regular"],
            "text-size": 11.2,
            "text-variable-anchor": ["top", "bottom", "left", "right"],
            "text-radial-offset": 0.8,
            "text-padding": 8
          },
          paint: {
            "text-color": "#334155",
            "text-halo-color": "rgba(255,255,255,0.92)",
            "text-halo-width": 1.4
          }
        });

        map.addLayer({
          id: "route-station-labels",
          type: "symbol",
          source: SOURCE_IDS.stations,
          minzoom: 6,
          filter: ["all", ["boolean", ["get", "showRouteLabel"], false]],
          layout: {
            "text-field": ["get", "name"],
            "text-font": ["Open Sans Bold"],
            "text-size": ["interpolate", ["linear"], ["zoom"], 6, 12, 11, 13.4],
            "text-variable-anchor": ["top", "bottom", "left", "right"],
            "text-radial-offset": 1.1,
            "symbol-sort-key": 100,
            "text-padding": 10
          },
          paint: {
            "text-color": "#0f172a",
            "text-halo-color": "rgba(255,255,255,0.96)",
            "text-halo-width": 2.1
          }
        });

        const pointerLayers = ["stations-major", "stations-minor"] as const;

        const stationClick = (event: MapLayerMouseEvent) => {
          const feature = event.features?.[0];
          const id = feature?.properties?.id;
          if (typeof id === "string") {
            stationSelectRef.current(id);
          }
        };

        pointerLayers.forEach((layerId) => {
          map.on("mouseenter", layerId, () => {
            map.getCanvas().style.cursor = "pointer";
          });
          map.on("mouseleave", layerId, () => {
            map.getCanvas().style.cursor = "";
          });
          map.on("click", layerId, stationClick);
        });

        map.on("click", (event) => {
          const features = map.queryRenderedFeatures(event.point, {
            layers: [...pointerLayers]
          });

          if (features.length > 0) return;
          mapClickRef.current([event.lngLat.lng, event.lngLat.lat]);
        });

        setLoaded(true);
      });
    }

    initialise();

    return () => {
      cancelled = true;
      popupRef.current?.remove();
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const source = mapRef.current.getSource(SOURCE_IDS.lines) as GeoJSONSource | undefined;
    source?.setData(lineData);
  }, [lineData, loaded]);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const source = mapRef.current.getSource(SOURCE_IDS.stations) as GeoJSONSource | undefined;
    source?.setData(stationData);
  }, [stationData, loaded]);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    const source = mapRef.current.getSource(SOURCE_IDS.active) as GeoJSONSource | undefined;
    source?.setData(activeRouteData);
  }, [activeRouteData, loaded]);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;
    mapRef.current.easeTo({
      pitch: mode3d ? 52 : 0,
      bearing: mode3d ? -18 : 0,
      duration: 650
    });
  }, [mode3d, loaded]);

  useEffect(() => {
    if (!mapRef.current || !loaded) return;

    popupRef.current?.remove();
    popupRef.current = null;

    if (!selectedStationId) return;

    import("maplibre-gl").then((maplibre) => {
      if (!mapRef.current) return;
      const station = getStation(selectedStationId);
      popupRef.current = new maplibre.Popup({
        closeButton: false,
        closeOnMove: false,
        offset: 18
      })
        .setLngLat(station.coordinates)
        .setHTML(popupHtml(selectedStationId, language))
        .addTo(mapRef.current);
    });
  }, [selectedStationId, language, loaded]);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      {!loaded && (
        <div className="absolute inset-0 grid place-items-center bg-slate-950/10 backdrop-blur-sm">
          <div className="rounded-3xl bg-white/95 px-5 py-4 text-sm font-semibold text-slate-700 shadow-lg">
            Loading map…
          </div>
        </div>
      )}
      <div className="pointer-events-none absolute bottom-3 right-3 rounded-2xl bg-[var(--map-overlay)] px-3 py-2 text-xs text-white md:bottom-5 md:right-5">
        {mode3d ? "3D perspective" : "2D plan view"} · live routing
      </div>
    </div>
  );
});
