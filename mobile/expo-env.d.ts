/// <reference types="react-native" />
/// <reference types="expo" />

declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";

declare module "react-native-maps" {
  import { ComponentClass, ReactNode } from "react";
  import { ViewProps, ViewStyle } from "react-native";

  export interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface MapViewProps extends ViewProps {
    provider?: "google" | null;
    style?: ViewStyle;
    customMapStyle?: any[];
    customMapStyleString?: string;
    showsUserLocation?: boolean;
    userLocationAnnotationTitle?: string;
    showsMyLocationButton?: boolean;
    followsUserLocation?: boolean;
    showsPointsOfInterest?: boolean;
    showsCompass?: boolean;
    zoomEnabled?: boolean;
    zoomControlEnabled?: boolean;
    rotateEnabled?: boolean;
    cacheEnabled?: boolean;
    loadingEnabled?: boolean;
    loadingBackgroundColor?: string;
    loadingIndicatorColor?: string;
    scrollEnabled?: boolean;
    pitchEnabled?: boolean;
    toolbarEnabled?: boolean;
    moveOnMarkerPress?: boolean;
    showsScale?: boolean;
    showsBuildings?: boolean;
    showsTraffic?: boolean;
    showsIndoors?: boolean;
    showsIndoorLevelPicker?: boolean;
    mapType?: "standard" | "satellite" | "hybrid" | "terrain" | "none" | "mutedStandard";
    region?: Region;
    initialRegion?: Region;
    liteMode?: boolean;
    mapPadding?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    maxDelta?: number;
    minDelta?: number;
    legalLabelInsets?: {
      top: number;
      right: number;
      bottom: number;
      left: number;
    };
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    onPress?: (event: { nativeEvent: { coordinate: LatLng; position: { x: number; y: number } } }) => void;
    onLongPress?: (event: { nativeEvent: { coordinate: LatLng; position: { x: number; y: number } } }) => void;
    onPanDrag?: (event: { nativeEvent: { coordinate: LatLng; position: { x: number; y: number } } }) => void;
    onMarkerPress?: (event: any) => void;
    onMarkerSelect?: (event: any) => void;
    onMarkerDeselect?: (event: any) => void;
    onCalloutPress?: (event: any) => void;
    onMarkerDragStart?: (event: any) => void;
    onMarkerDrag?: (event: any) => void;
    onMarkerDragEnd?: (event: any) => void;
    onPoiClick?: (event: { nativeEvent: { placeId: string; name: string; coordinate: LatLng } }) => void;
    onIndoorBuildingFocused?: (event: any) => void;
    onIndoorLevelActivated?: (event: any) => void;
    onUserLocationChange?: (event: { nativeEvent: { coordinate: LatLng; position: { x: number; y: number } } }) => void;
    minZoomLevel?: number;
    maxZoomLevel?: number;
    kmlSrc?: string;
    children?: ReactNode;
  }

  export interface MarkerProps extends ViewProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    image?: any;
    pinColor?: string;
    pinImage?: any;
    anchor?: { x: number; y: number };
    calloutAnchor?: { x: number; y: number };
    callout?: any;
    flat?: boolean;
    identifier?: string;
    rotation?: number;
    zIndex?: number;
    draggable?: boolean;
    tracksViewChanges?: boolean;
    tracksInfoWindowChanges?: boolean;
    stopPropagation?: boolean;
    onPress?: (event: any) => void;
    onSelect?: (event: any) => void;
    onDeselect?: (event: any) => void;
    onCalloutPress?: (event: any) => void;
    onDragStart?: (event: any) => void;
    onDrag?: (event: any) => void;
    onDragEnd?: (event: any) => void;
    opacity?: number;
    children?: ReactNode;
  }

  export const PROVIDER_GOOGLE: string;

  export class MapView extends React.Component<MapViewProps, any> {
    static Marker: ComponentClass<MarkerProps>;
    static PROVIDER_GOOGLE: string;
    animateToRegion(region: Region, duration?: number): void;
    animateToCoordinate(coordinate: LatLng, duration?: number): void;
    animateCamera(
      config: {
        center?: LatLng;
        pitch?: number;
        heading?: number;
        altitude?: number;
        zoom?: number;
      },
      duration?: number
    ): void;
    fitToElements(animated?: boolean): void;
    fitToSuppliedMarkers(markers: string[], animated?: boolean): void;
    fitToCoordinates(
      coordinates: LatLng[],
      options?: {
        edgePadding?: {
          top: number;
          right: number;
          bottom: number;
          left: number;
        };
        animated?: boolean;
      }
    ): void;
    pointForCoordinate(coordinate: LatLng): Promise<{ x: number; y: number }>;
    coordinateForPoint(point: { x: number; y: number }): Promise<LatLng>;
    getCamera(): Promise<{
      center: LatLng;
      pitch: number;
      heading: number;
      altitude: number;
      zoom: number;
    }>;
    setCamera(camera: {
      center?: LatLng;
      pitch?: number;
      heading?: number;
      altitude?: number;
      zoom?: number;
    }): void;
  }

  export class Marker extends React.Component<MarkerProps, any> {
    showCallout(): void;
    hideCallout(): void;
  }
}

declare module "expo-location" {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      altitudeAccuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface LocationOptions {
    accuracy?: LocationAccuracy;
    mayShowUserSettingsDialog?: boolean;
  }

  export interface LocationGeocodedAddress {
    city: string | null;
    country: string | null;
    district: string | null;
    isoCountryCode: string | null;
    name: string | null;
    postalCode: string | null;
    region: string | null;
    street: string | null;
    streetNumber: string | null;
    subregion: string | null;
    timezone: string | null;
  }

  export interface LocationGeocodedLocation {
    latitude: number;
    longitude: number;
    altitude?: number | null;
    accuracy?: number | null;
  }

  export interface LocationPermissionResponse {
    status: "granted" | "denied" | "undetermined";
    granted: boolean;
    expires: "never" | number;
    canAskAgain: boolean;
  }

  export enum LocationAccuracy {
    Lowest = 1,
    Low = 2,
    Balanced = 3,
    High = 4,
    Highest = 5,
    BestForNavigation = 6,
  }

  export function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationObject>;
  export function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function reverseGeocodeAsync(
    location: { latitude: number; longitude: number } | string,
  ): Promise<LocationGeocodedAddress[]>;
}