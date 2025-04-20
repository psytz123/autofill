import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  ViewStyle,
  TextStyle,
} from "react-native";

export interface ButtonProps extends TouchableOpacityProps {
  title: string;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline";
  size?: "small" | "medium" | "large";
  style?: ViewStyle;
  textStyle?: TextStyle;
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
    let baseStyle = [styles.button];

    // Add variant styles
    switch (variant) {
      case "primary":
        baseStyle.push(styles.primaryButton);
        break;
      case "secondary":
        baseStyle.push(styles.secondaryButton);
        break;
      case "outline":
        baseStyle.push(styles.outlineButton);
        break;
    }

    // Add size styles
    switch (size) {
      case "small":
        baseStyle.push(styles.smallButton);
        break;
      case "medium":
        baseStyle.push(styles.mediumButton);
        break;
      case "large":
        baseStyle.push(styles.largeButton);
        break;
    }

    // Add disabled style
    if (disabled || loading) {
      baseStyle.push(styles.disabledButton);
    }

    // Add custom style
    if (style) {
      baseStyle.push(style);
    }

    return baseStyle;
  };

  const getTextStyle = () => {
    let baseStyle = [styles.buttonText];

    // Add variant text styles
    switch (variant) {
      case "primary":
        baseStyle.push(styles.primaryButtonText);
        break;
      case "secondary":
        baseStyle.push(styles.secondaryButtonText);
        break;
      case "outline":
        baseStyle.push(styles.outlineButtonText);
        break;
    }

    // Add size text styles
    switch (size) {
      case "small":
        baseStyle.push(styles.smallButtonText);
        break;
      case "medium":
        baseStyle.push(styles.mediumButtonText);
        break;
      case "large":
        baseStyle.push(styles.largeButtonText);
        break;
    }

    // Add disabled text style
    if (disabled || loading) {
      baseStyle.push(styles.disabledButtonText);
    }

    // Add custom text style
    if (textStyle) {
      baseStyle.push(textStyle);
    }

    return baseStyle;
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
    alignItems: "center",
    justifyContent: "center",
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
    fontWeight: "600",
    textAlign: "center",
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
