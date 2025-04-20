/**
 * Type definitions to work around TypeScript compatibility issues in React Native
 * This file provides safe type mappings for common React Native components
 */

import React from 'react';
import {
  ViewProps,
  TextProps,
  TouchableOpacityProps,
  ImageProps,
  StyleProp,
  ViewStyle,
  TextStyle,
  ImageStyle,
} from 'react-native';

// Safe component types for TypeScript
export type SafeView = React.ComponentType<ViewProps & { style?: StyleProp<ViewStyle>, children?: React.ReactNode }>;
export type SafeText = React.ComponentType<TextProps & { style?: StyleProp<TextStyle>, children?: React.ReactNode }>;
export type SafeTouchableOpacity = React.ComponentType<TouchableOpacityProps & { style?: StyleProp<ViewStyle>, children?: React.ReactNode }>;
export type SafeImage = React.ComponentType<ImageProps & { style?: StyleProp<ImageStyle> }>;
export type SafeActivityIndicator = React.ComponentType<{ size?: number | "small" | "large", color?: string }>;

// Style helpers
export type MergeStyle<BaseStyle, AdditionalStyle> = BaseStyle & Partial<AdditionalStyle>;

// Utility for merging styles safely in TypeScript
export function mergeStyles<T>(baseStyle: T, additionalStyle?: T): T {
  if (!additionalStyle) return baseStyle;
  return { ...baseStyle, ...additionalStyle };
}

// Type-safe style composition helper
export function composeStyles<T>(
  ...styles: Array<StyleProp<T> | undefined>
): StyleProp<T> {
  return styles.filter(Boolean) as StyleProp<T>;
}