import { StackNavigationProp } from "@react-navigation/stack";
import { RouteProp } from "@react-navigation/native";
import { Location } from "../utils/types";

// Root Stack Parameter List
export type RootStackParamList = {
  Login: undefined;
  Home: undefined;
  Order: {
    selectedLocation?: Location;
  };
  LocationSelection: {
    returnTo: keyof RootStackParamList;
    onSaveCallback?: (location: Location) => void;
  };
};

// Navigation Props for each screen
export type LoginScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Login"
>;
export type HomeScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Home"
>;
export type OrderScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "Order"
>;
export type LocationScreenNavigationProp = StackNavigationProp<
  RootStackParamList,
  "LocationSelection"
>;

// Route Props for each screen
export type LoginScreenRouteProp = RouteProp<RootStackParamList, "Login">;
export type HomeScreenRouteProp = RouteProp<RootStackParamList, "Home">;
export type OrderScreenRouteProp = RouteProp<RootStackParamList, "Order">;
export type LocationScreenRouteProp = RouteProp<
  RootStackParamList,
  "LocationSelection"
>;

// Combined Props for each screen
export interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  route: LoginScreenRouteProp;
}

export interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
  route: HomeScreenRouteProp;
}

export interface OrderScreenProps {
  navigation: OrderScreenNavigationProp;
  route: OrderScreenRouteProp;
}

export interface LocationScreenProps {
  navigation: LocationScreenNavigationProp;
  route: LocationScreenRouteProp;
}
