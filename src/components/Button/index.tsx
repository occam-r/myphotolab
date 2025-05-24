import Icon from "@components/Icon";
import colors from "@utils/colors";
import React, { memo, useCallback } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  ViewStyle,
} from "react-native";

const Button = ({
  onPress,
  title,
  isOnline = true,
  isLoading = false,
  icon,
  style,
  textStyle,
  shouldVisible = true,
  disabled = false,
}: {
  onPress: () => void;
  title: string;
  isOnline?: boolean;
  isLoading?: boolean;
  icon?: string;
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  shouldVisible?: boolean;
  disabled?: boolean;
}) => {
  const getButtonStyle = useCallback(
    ({ pressed }: { pressed: boolean }) => [
      styles.button,
      (!isOnline || disabled) && styles.disabledButton,
      pressed && styles.pressedButton,
      (isLoading || icon) && styles.rowStyle,
      style,
    ],
    [isOnline, isLoading, icon, disabled, style],
  );

  if (!shouldVisible) return null;

  return (
    <Pressable
      onPress={onPress}
      style={getButtonStyle}
      android_ripple={{ color: colors.ripple, borderless: false }}
      disabled={isLoading || disabled || !isOnline}
      accessibilityRole="button"
      accessibilityState={{ disabled: isLoading || !isOnline }}
      hitSlop={
        Platform.OS === "android"
          ? { top: 8, bottom: 8, left: 8, right: 8 }
          : undefined
      }
    >
      {isLoading && <ActivityIndicator color="white" />}
      {icon && (
        <Icon
          type="Feather"
          color={
            textStyle && "color" in textStyle
              ? String(textStyle.color)
              : colors.white
          }
          name={icon}
          size={24}
        />
      )}
      <Text style={[styles.updateButtonText, textStyle]}>{title}</Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.primary,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      android: {
        elevation: 2,
      },
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 1,
      },
    }),
  },
  pressedButton: {
    opacity: 0.8,
  },
  disabledButton: {
    opacity: 0.5,
  },
  updateButtonText: {
    color: colors.white,
    fontSize: 14,
    fontWeight: "500",
    ...Platform.select({
      android: {
        includeFontPadding: false,
      },
    }),
  },
  rowStyle: {
    flexDirection: "row",
    gap: 20,
  },
});

export default memo(Button);
