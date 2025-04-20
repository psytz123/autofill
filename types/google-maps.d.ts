declare module '@googlemaps/js-api-loader' {
  export interface LoaderOptions {
    apiKey: string;
    version?: string;
    libraries?: string[];
    language?: string;
    region?: string;
    retry?: boolean;
    retryOptions?: {
      retries: number;
      maxRetryDelay: number;
    };
  }

  export class Loader {
    constructor(options: LoaderOptions);
    load(): Promise<typeof google>;
  }
}

declare module '@react-google-maps/api' {
  import { ReactNode, ComponentType } from 'react';

  export interface LoadScriptProps {
    id: string;
    googleMapsApiKey: string;
    language?: string;
    region?: string;
    version?: string;
    libraries?: string[];
    loadingElement?: ReactNode;
    onLoad?: () => void;
    onError?: (error: Error) => void;
    onUnmount?: () => void;
    preventGoogleFontsLoading?: boolean;
    children: ReactNode;
  }

  export interface GoogleMapProps {
    id?: string;
    mapContainerStyle?: React.CSSProperties;
    mapContainerClassName?: string;
    options?: google.maps.MapOptions;
    center: google.maps.LatLngLiteral;
    zoom: number;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onLoad?: (map: google.maps.Map) => void;
    onUnmount?: (map: google.maps.Map) => void;
    onZoomChanged?: () => void;
    onCenterChanged?: () => void;
    onBoundsChanged?: () => void;
    onIdle?: () => void;
    onTilesLoaded?: () => void;
    children?: ReactNode;
  }

  export interface MarkerProps {
    position: google.maps.LatLngLiteral;
    options?: google.maps.MarkerOptions;
    onClick?: (e: google.maps.MapMouseEvent) => void;
    onLoad?: (marker: google.maps.Marker) => void;
    onUnmount?: (marker: google.maps.Marker) => void;
    icon?: string | google.maps.Icon | google.maps.Symbol;
    label?: string | google.maps.MarkerLabel;
    draggable?: boolean;
    visible?: boolean;
    zIndex?: number;
  }

  export interface InfoWindowProps {
    position: google.maps.LatLngLiteral;
    options?: google.maps.InfoWindowOptions;
    onLoad?: (infoWindow: google.maps.InfoWindow) => void;
    onUnmount?: (infoWindow: google.maps.InfoWindow) => void;
    children?: ReactNode;
    zIndex?: number;
  }

  export interface AutoCompleteProps {
    onLoad?: (autocomplete: google.maps.places.Autocomplete) => void;
    onPlaceChanged?: () => void;
    onUnmount?: (autocomplete: google.maps.places.Autocomplete) => void;
    options?: google.maps.places.AutocompleteOptions;
    children?: ReactNode;
  }

  export interface PlacesLibraryOptions {
    bounds?: google.maps.LatLngBounds | google.maps.LatLngBoundsLiteral;
    componentRestrictions?: google.maps.places.ComponentRestrictions;
    strictBounds?: boolean;
    types?: string[];
  }

  export interface Geocoder {
    geocode(request: google.maps.GeocoderRequest): Promise<google.maps.GeocoderResponse>;
  }

  export const LoadScript: ComponentType<LoadScriptProps>;
  export const GoogleMap: ComponentType<GoogleMapProps>;
  export const Marker: ComponentType<MarkerProps>;
  export const InfoWindow: ComponentType<InfoWindowProps>;
  export const Autocomplete: ComponentType<AutoCompleteProps>;

  export function useJsApiLoader(options: { 
    id: string, 
    googleMapsApiKey: string,
    libraries?: string[]
  }): {
    isLoaded: boolean;
    loadError: Error | undefined;
  };

  export function useLoadScript(options: {
    googleMapsApiKey: string;
    libraries?: string[];
  }): {
    isLoaded: boolean;
    loadError: Error | undefined;
  };
}