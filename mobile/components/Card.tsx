import React from "react";
import {
  StyleSheet,
  View as RNView,
  ViewStyle,
  TouchableOpacity as RNTouchableOpacity,
  TouchableOpacityProps,
  StyleProp,
} from "react-native";
import {
  SafeView,
  SafeTouchableOpacity,
  composeStyles,
} from "../utils/component-types";

// Use our safe component types
const View = RNView as SafeView;
const TouchableOpacity = RNTouchableOpacity as SafeTouchableOpacity;

interface CardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  touchableProps?: TouchableOpacityProps;
}

// Card.Header component
interface CardHeaderProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardHeader: React.FC<CardHeaderProps> = ({ children, style }) => {
  // Use our safe style composition helper
  const headerStyles = composeStyles<ViewStyle>(
    styles.cardHeader,
    style as ViewStyle,
  );

  return <View style={headerStyles}>{children}</View>;
};

// Card.Content component
interface CardContentProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardContent: React.FC<CardContentProps> = ({ children, style }) => {
  // Use our safe style composition helper
  const contentStyles = composeStyles<ViewStyle>(
    styles.cardContent,
    style as ViewStyle,
  );

  return <View style={contentStyles}>{children}</View>;
};

// Card.Footer component
interface CardFooterProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const CardFooter: React.FC<CardFooterProps> = ({ children, style }) => {
  // Use our safe style composition helper
  const footerStyles = composeStyles<ViewStyle>(
    styles.cardFooter,
    style as ViewStyle,
  );

  return <View style={footerStyles}>{children}</View>;
};

// Define type to include static components
interface CardComponent extends React.FC<CardProps> {
  Header: React.FC<CardHeaderProps>;
  Content: React.FC<CardContentProps>;
  Footer: React.FC<CardFooterProps>;
}

// Main Card component
const Card: CardComponent = ({ children, style, onPress, touchableProps }) => {
  // Use our safe style composition helper
  const cardStyles = composeStyles<ViewStyle>(styles.card, style as ViewStyle);

  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyles}
        onPress={onPress}
        activeOpacity={0.8}
        {...touchableProps}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyles}>{children}</View>;
};

// Attach components to Card
Card.Header = CardHeader;
Card.Content = CardContent;
Card.Footer = CardFooter;

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    marginVertical: 8,
  },
  cardHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  cardContent: {
    padding: 16,
  },
  cardFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
});

export default Card;
