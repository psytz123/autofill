import React from "react";
import {
  StyleSheet,
  TouchableOpacity as RNTouchableOpacity,
  Text as RNText,
  ActivityIndicator as RNActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
  StyleProp,
} from "react-native";
import { 
  SafeTouchableOpacity, 
  SafeText, 
  SafeActivityIndicator,
  mergeStyles,
  composeStyles
} from "../utils/component-types";

// Use our safe component types
const TouchableOpacity = RNTouchableOpacity as SafeTouchableOpacity;
const Text = RNText as SafeText;
const ActivityIndicator = RNActivityIndicator as SafeActivityIndicator;

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  onPress?: () => void;
}

const Button: React.FC<ButtonProps> = ({
  title,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "medium",
  style,
  textStyle,
  onPress,
  ...props
}) => {
  const getButtonStyle = () => {
    // Start with base button style
    let computedStyle = { ...styles.button };

    // Add variant styles
    switch (variant) {
      case "primary":
        computedStyle = mergeStyles(computedStyle, styles.primaryButton);
        break;
      case "secondary":
        computedStyle = mergeStyles(computedStyle, styles.secondaryButton);
        break;
      case "outline":
        computedStyle = mergeStyles(computedStyle, styles.outlineButton);
        break;
    }

    // Add size styles
    switch (size) {
      case "small":
        computedStyle = mergeStyles(computedStyle, styles.smallButton);
        break;
      case "medium":
        computedStyle = mergeStyles(computedStyle, styles.mediumButton);
        break;
      case "large":
        computedStyle = mergeStyles(computedStyle, styles.largeButton);
        break;
    }

    // Add disabled style
    if (disabled || loading) {
      computedStyle = mergeStyles(computedStyle, styles.disabledButton);
    }

    // Add custom style
    return composeStyles<ViewStyle>(computedStyle, style as ViewStyle);
  };

  const getTextStyle = () => {
    // Start with base text style
    let computedStyle = { ...styles.buttonText };

    // Add variant text styles
    switch (variant) {
      case "primary":
        computedStyle = mergeStyles(computedStyle, styles.primaryButtonText);
        break;
      case "secondary":
        computedStyle = mergeStyles(computedStyle, styles.secondaryButtonText);
        break;
      case "outline":
        computedStyle = mergeStyles(computedStyle, styles.outlineButtonText);
        break;
    }

    // Add size text styles
    switch (size) {
      case "small":
        computedStyle = mergeStyles(computedStyle, styles.smallButtonText);
        break;
      case "medium":
        computedStyle = mergeStyles(computedStyle, styles.mediumButtonText);
        break;
      case "large":
        computedStyle = mergeStyles(computedStyle, styles.largeButtonText);
        break;
    }

    // Add disabled text style
    if (disabled || loading) {
      computedStyle = mergeStyles(computedStyle, styles.disabledButtonText);
    }

    // Add custom text style
    return composeStyles<TextStyle>(computedStyle, textStyle as TextStyle);
  };

  return (
    <TouchableOpacity
      style={getButtonStyle()}
      disabled={loading || disabled}
      onPress={onPress}
      activeOpacity={0.7}
      {...props}
    >
      {loading ? (
        <ActivityIndicator
          color={variant === "outline" ? "#f97316" : "#ffffff"}
          size="small"
        />
      ) : (
        <Text style={getTextStyle()}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center" as "center",
    justifyContent: "center" as "center",
  },
  primaryButton: {
    backgroundColor: "#f97316",
  },
  secondaryButton: {
    backgroundColor: "#64748b",
  },
  outlineButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#f97316",
  },
  disabledButton: {
    opacity: 0.6,
  },
  smallButton: {
    height: 36,
    paddingHorizontal: 16,
  },
  mediumButton: {
    height: 48,
    paddingHorizontal: 24,
  },
  largeButton: {
    height: 56,
    paddingHorizontal: 32,
  },
  buttonText: {
    fontWeight: "600" as "600",
    textAlign: "center" as "center",
  },
  primaryButtonText: {
    color: "#ffffff",
  },
  secondaryButtonText: {
    color: "#ffffff",
  },
  outlineButtonText: {
    color: "#f97316",
  },
  disabledButtonText: {
    opacity: 0.8,
  },
  smallButtonText: {
    fontSize: 14,
  },
  mediumButtonText: {
    fontSize: 16,
  },
  largeButtonText: {
    fontSize: 18,
  },
});

export default Button;
