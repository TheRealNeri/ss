import type { Feature, FeatureCollection, LineString, Point } from "geojson";

export type StationFeature = Feature<
  Point,
  {
    id: string;
    lineCount: number;
    name: string;
    municipality: string;
    importance: number;
    kind: string;
    isInterchange: boolean;
    isSelected: boolean;
    onRoute: boolean;
    showMajorLabel: boolean;
    showMinorLabel: boolean;
    showRouteLabel: boolean;
    routeRole: "none" | "endpoint" | "transfer";
  }
>;

export type LineFeature = Feature<
  LineString,
  {
    id: string;
    name: string;
    color: string;
    shortName: string;
    mode: string;
    opacity: number;
    sort: number;
  }
>;

export type NetworkLineCollection = FeatureCollection<LineString, LineFeature["properties"]>;
export type StationCollection = FeatureCollection<Point, StationFeature["properties"]>;
