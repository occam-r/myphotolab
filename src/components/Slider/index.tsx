import colors from "@utils/colors";
import React, { useCallback, useEffect, useState } from "react";
import {
  LayoutChangeEvent,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  Vibration,
  View,
  ViewStyle,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

interface SliderProps {
  /**
   * Current value of the slider
   */
  value: number;
  /**
   * Minimum value of the slider
   */
  minValue: number;
  /**
   * Maximum value of the slider
   */
  maxValue: number;
  /**
   * Step value for the slider
   */
  step?: number;
  /**
   * Callback when the value changes
   */
  onValueChange: (value: number) => void;
  /**
   * Format function for the label
   */
  formatLabel?: (value: number) => string;
  /**
   * Show min and max labels
   */
  showLabels?: boolean;
  /**
   * Show current value label
   */
  showValueLabel?: boolean;
  /**
   * Custom container style
   */
  containerStyle?: StyleProp<ViewStyle>;
  /**
   * Custom track style
   */
  trackStyle?: StyleProp<ViewStyle>;
  /**
   * Custom fill style
   */
  fillStyle?: StyleProp<ViewStyle>;
  /**
   * Custom thumb style
   */
  thumbStyle?: StyleProp<ViewStyle>;
  /**
   * Custom label style
   */
  labelStyle?: StyleProp<TextStyle>;
  /**
   * Custom value label style
   */
  valueLabelStyle?: StyleProp<TextStyle>;
  /**
   * Enable haptic feedback
   */
  hapticFeedback?: boolean;
}

// Helper function to provide haptic feedback
const triggerHaptic = (intensity: "light" | "medium") => {
  if (Platform.OS !== "web") {
    Vibration.vibrate(intensity === "light" ? 5 : 10);
  }
};

/**
 * A reusable time slider component that allows users to select values by sliding a dot.
 */
const Slider = ({
  value,
  minValue,
  maxValue,
  step = 1,
  onValueChange,
  formatLabel = (value) => `${value}`,
  showLabels = true,
  showValueLabel = true,
  containerStyle,
  trackStyle,
  fillStyle,
  thumbStyle,
  labelStyle,
  valueLabelStyle,
  hapticFeedback = true,
}: SliderProps) => {
  const [sliderWidth, setSliderWidth] = useState(0);
  const [isDragging, setIsDragging] = useState(false);

  // Shared values for animations
  const thumbPosition = useSharedValue(0);
  const isActive = useSharedValue(false);
  const startPosition = useSharedValue(0);

  // Calculate new value based on position
  const calculateValue = useCallback(
    (positionX: number): number => {
      "worklet";
      if (sliderWidth <= 0) return value;

      // Calculate percentage of position
      const percentage = Math.max(0, Math.min(1, positionX / sliderWidth));

      // Calculate raw value based on percentage
      let newValue = percentage * (maxValue - minValue) + minValue;

      // Apply step if provided
      if (step > 0) {
        newValue = Math.round(newValue / step) * step;
      }

      // Ensure value is within bounds
      return Math.max(minValue, Math.min(maxValue, newValue));
    },
    [sliderWidth, minValue, maxValue, step, value],
  );

  // Update thumb position when value changes
  useEffect(() => {
    if (!isDragging && sliderWidth > 0) {
      const position =
        (sliderWidth * (value - minValue)) / (maxValue - minValue);
      thumbPosition.value = position;
    }
  }, [value, minValue, maxValue, sliderWidth, isDragging, thumbPosition]);

  // Handle slider layout to get width
  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    setSliderWidth(event.nativeEvent.layout.width);
  }, []);

  // Handle press on track
  const handleTrackPress = useCallback(
    (x: number) => {
      const newValue = calculateValue(x);

      // Provide haptic feedback if enabled
      if (hapticFeedback) {
        triggerHaptic("medium");
      }

      onValueChange(newValue);
    },
    [calculateValue, onValueChange, hapticFeedback],
  );

  // Gesture handler for the thumb
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      isActive.value = true;
    })
    .onStart(() => {
      startPosition.value = thumbPosition.value;
      runOnJS(setIsDragging)(true);
    })
    .onUpdate((event) => {
      // Calculate new position based on translation from start position
      const newPosition = Math.max(
        0,
        Math.min(sliderWidth, startPosition.value + event.translationX),
      );
      thumbPosition.value = newPosition;

      const newValue = calculateValue(newPosition);

      // Only update if value changed
      if (newValue !== value) {
        runOnJS(onValueChange)(newValue);

        // Provide subtle haptic feedback on value change if enabled
        if (hapticFeedback && step > 0 && newValue % step === 0) {
          runOnJS(triggerHaptic)("light");
        }
      }
    })
    .onEnd(() => {
      isActive.value = false;
      runOnJS(setIsDragging)(false);

      // Provide haptic feedback when released if enabled
      if (hapticFeedback) {
        runOnJS(triggerHaptic)("medium");
      }
    });

  // Animated styles for the thumb
  const thumbAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { translateX: thumbPosition.value },
        { translateY: 0 },
        { scale: withSpring(isActive.value ? 1.2 : 1) },
      ],
      left: 0, // We'll use transform instead of left percentage
    };
  });

  // Animated styles for the fill
  const fillAnimatedStyle = useAnimatedStyle(() => {
    return {
      width: thumbPosition.value,
    };
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {showValueLabel && (
        <Text style={[styles.valueLabel, valueLabelStyle]}>
          {formatLabel(value)}
        </Text>
      )}

      <View style={styles.sliderContainer}>
        {showLabels && (
          <Text style={[styles.label, labelStyle]}>
            {formatLabel(minValue)}
          </Text>
        )}

        <View style={styles.trackContainer} onLayout={handleLayout}>
          <Pressable
            style={styles.pressableTrack}
            onPress={(event) => handleTrackPress(event.nativeEvent.locationX)}
          >
            <View style={[styles.track, trackStyle]}>
              <Animated.View
                style={[styles.fill, fillAnimatedStyle, fillStyle]}
              />
            </View>
          </Pressable>

          <GestureDetector gesture={panGesture}>
            <Animated.View
              style={[styles.thumb, thumbAnimatedStyle, thumbStyle]}
            >
              <View style={styles.thumbInner} />
            </Animated.View>
          </GestureDetector>
        </View>

        {showLabels && (
          <Text style={[styles.label, labelStyle]}>
            {formatLabel(maxValue)}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  valueLabel: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
  },
  label: {
    fontSize: 12,
    color: colors.text,
    minWidth: 50,
    textAlign: "center",
  },
  trackContainer: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    marginHorizontal: 8,
    position: "relative",
  },
  pressableTrack: {
    width: "100%",
    height: 40,
    justifyContent: "center",
  },
  track: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    width: "100%",
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    transform: [{ translateY: -12 }],
    borderWidth: 2,
    borderColor: colors.white,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    zIndex: 10,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
});

export default Slider;
