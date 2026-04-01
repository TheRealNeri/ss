export type Language = "sq" | "en";

export type LocalizedText = {
  sq: string;
  en: string;
};

export type LineMode = "underground" | "regional" | "express" | "coastal";
export type SearchEntityType = "station" | "place" | "coordinate";
export type RoutingPreference = "fastest" | "fewerChanges";

export type Station = {
  id: string;
  name: LocalizedText;
  municipality: LocalizedText;
  country: "AL" | "XK";
  coordinates: [number, number];
  lines: string[];
  importance: 1 | 2 | 3 | 4 | 5;
  kind: "core" | "interchange" | "regional" | "airport" | "coastal";
  aliases?: string[];
};

export type Line = {
  id: string;
  name: LocalizedText;
  shortName: string;
  color: string;
  textColor: string;
  mode: LineMode;
  stationIds: string[];
  speedKph: number;
  dwellMinutes: number;
  serviceHeadwayMinutes: number;
  isMajor?: boolean;
};

export type Place = {
  id: string;
  name: LocalizedText;
  type: "district" | "airport" | "city" | "landmark" | "port" | "beach";
  coordinates: [number, number];
  preferredStationId?: string;
  aliases: string[];
  municipality: LocalizedText;
};

export type SearchTarget =
  | { type: "station"; stationId: string; label: string }
  | { type: "place"; placeId: string; label: string }
  | { type: "coordinate"; id: string; coordinates: [number, number]; label: string };

export type RouteLeg = {
  fromStationId: string;
  toStationId: string;
  lineId: string;
  minutes: number;
  stops: number;
};

export type RouteInstruction = {
  type: "walk" | "board" | "transfer" | "ride" | "arrive";
  text: string;
  minutes?: number;
};

export type RouteOption = {
  id: string;
  preference: RoutingPreference;
  totalMinutes: number;
  inVehicleMinutes: number;
  walkingMinutes: number;
  accessWalkingMinutes: number;
  egressWalkingMinutes: number;
  transferCount: number;
  stopCount: number;
  stationIds: string[];
  lineIds: string[];
  legs: RouteLeg[];
  instructions: RouteInstruction[];
  accessStationId: string;
  egressStationId: string;
  originLabel: string;
  destinationLabel: string;
};

export type ResolvedEndpoint = {
  stationId: string;
  walkingMinutes: number;
  walkingDistanceMeters: number;
  label: string;
};

export type SearchResult = {
  id: string;
  label: string;
  secondaryLabel: string;
  type: SearchEntityType;
  stationId?: string;
  placeId?: string;
  coordinates?: [number, number];
  score: number;
};

export type NearestStationResult = {
  stationId: string;
  distanceMeters: number;
  walkingMinutes: number;
};

export type DepartureItem = {
  lineId: string;
  destinationStationId: string;
  minutesFromNow: number;
  departureIso: string;
};
