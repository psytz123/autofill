/// <reference types="react-native" />
/// <reference types="expo" />

// Fix React types for JSX compatibility
import 'react';
declare global {
  namespace React {
    interface ReactNode {}
  }
}

// Image module declarations
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";

// React Navigation declarations
declare module "@react-navigation/native" {
  export function useNavigation(): any;
  export function useRoute(): any;
  export function useIsFocused(): boolean;
  export interface ParamListBase {}
  export interface NavigationContainerRef {}
  export interface NavigationState {}
}

declare module "@react-navigation/stack" {
  export function createStackNavigator(): any;
  export interface StackNavigationProp<T, K extends keyof T = string> {}
  export interface StackScreenProps<T, K extends keyof T = string> {}
}

// Fix for missing react-native modules
declare module "react-native" {
  export interface ViewStyle {
    [key: string]: any;
  }
  
  export interface TextStyle {
    [key: string]: any;
  }
  
  export interface ImageStyle {
    [key: string]: any;
  }
  
  export type StyleProp<T> = T | T[] | null;
  
  export class StyleSheet {
    static create<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(styles: T | StyleSheet.NamedStyles<T>): T;
    static flatten<T>(style?: StyleProp<T>): T;
    static compose<T, U>(style1: StyleProp<T>, style2: StyleProp<U>): StyleProp<T & U>;
    
    static hairlineWidth: number;
    static absoluteFill: StyleProp<ViewStyle>;
    static absoluteFillObject: ViewStyle;
    
    static setStyleAttributePreprocessor(property: string, process: (nextProp: any) => any): void;
    
    // Additional namespace
    static NamedStyles: any;
  }
  
  export class View extends React.Component<any, any> {}
  export class Text extends React.Component<any, any> {}
  export class Image extends React.Component<any, any> {}
  export class ScrollView extends React.Component<any, any> {}
  export class TouchableOpacity extends React.Component<any, any> {}
  export class TouchableHighlight extends React.Component<any, any> {}
  export class ActivityIndicator extends React.Component<any, any> {}
  export class TextInput extends React.Component<any, any> {}
  export class FlatList<T = any> extends React.Component<any, any> {}
  export class SectionList<T = any> extends React.Component<any, any> {}
  export class Modal extends React.Component<any, any> {}
  export class Alert {
    static alert(title: string, message?: string, buttons?: Array<{ text?: string, onPress?: () => void, style?: 'default' | 'cancel' | 'destructive' }>, options?: { cancelable?: boolean, onDismiss?: () => void }): void;
  }
}

// React-Native-Maps declaration
declare module "react-native-maps" {
  import { ComponentClass, ReactNode } from "react";
  import { ViewProps, ViewStyle, StyleProp } from "react-native";

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
    style?: StyleProp<ViewStyle>;
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
    [key: string]: any;
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
    [key: string]: any;
  }

  export const PROVIDER_GOOGLE: string;

  // Using a class component declaration that plays well with TS
  export const MapView: React.ComponentClass<MapViewProps> & {
    Marker: React.ComponentClass<MarkerProps>;
    PROVIDER_GOOGLE: string;
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
  };

  export const Marker: React.ComponentClass<MarkerProps> & {
    showCallout(): void;
    hideCallout(): void;
  };
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
    accuracy?: number | LocationAccuracy;
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

  // Export both enum and constant object for compatibility
  export const Accuracy: {
    Lowest: 1;
    Low: 2;
    Balanced: 3;
    High: 4;
    Highest: 5;
    BestForNavigation: 6;
  };

  export function getCurrentPositionAsync(options?: LocationOptions): Promise<LocationObject>;
  export function requestForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function getForegroundPermissionsAsync(): Promise<LocationPermissionResponse>;
  export function reverseGeocodeAsync(
    location: { latitude: number; longitude: number } | string,
  ): Promise<LocationGeocodedAddress[]>;
}

// Type for React Native Screens (needed for React Navigation)
declare module "react-native-screens" {
  export function enableScreens(enabled?: boolean): void;
  export function screensEnabled(): boolean;
  export const Screen: React.ComponentClass<any>;
  export const ScreenContainer: React.ComponentClass<any>;
}

// Additional application-specific type declarations
declare interface Location {
  id?: number;
  name: string;
  address: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  type?: string;
}

declare enum FuelType {
  REGULAR_UNLEADED = "REGULAR_UNLEADED",
  PREMIUM_UNLEADED = "PREMIUM_UNLEADED",
  DIESEL = "DIESEL"
}