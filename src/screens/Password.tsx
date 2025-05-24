import Button from "@components/Button";
import Icon from "@components/Icon";
import { passwordInitialState, passwordReducer } from "@reducer/Password";
import colors from "@utils/colors";
import { getValueFor, save, SECURE_KEY } from "@utils/userSecureStore";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  Text,
  Vibration,
  View,
} from "react-native";
import Animated, {
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

// Enhanced keypad data with proper typing
const KEYPAD_DATA = [
  { value: 1, type: "number" },
  { value: 2, type: "number" },
  { value: 3, type: "number" },
  { value: 4, type: "number" },
  { value: 5, type: "number" },
  { value: 6, type: "number" },
  { value: 7, type: "number" },
  { value: 8, type: "number" },
  { value: 9, type: "number" },
  { value: null, type: "empty" },
  { value: 0, type: "number" },
  { value: "clear", type: "action" },
] as const;

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 3;
const LOCKOUT_DURATION = 30000; // 30 seconds

interface Props {
  isVisible: boolean;
  onClose: () => void;
  isLandscape: boolean;
  onMatches: (pin: string) => void;
  onPinComplete?: (pin: string) => void;
}
const Password = ({
  isVisible,
  onClose,
  onMatches,
  onPinComplete,
  isLandscape,
}: Props) => {
  const [state, dispatch] = useReducer(passwordReducer, passwordInitialState);
  const [mode, setMode] = useState<"check" | "create" | "confirm">("check");
  const [pinToConfirm, setPinToConfirm] = useState<string>("");
  const [countdown, setCountdown] = useState(0);
  const shakeAnimation = useSharedValue(0);

  // Memoized values
  const currentPin = useMemo(() => state.digits.join(""), [state.digits]);
  const filledDigits = useMemo(
    () => state.digits.filter((d) => d).length,
    [state.digits],
  );
  const isPinComplete = useMemo(
    () => filledDigits === PIN_LENGTH,
    [filledDigits],
  );
  const isActionDisabled = useMemo(
    () => state.isLocked || countdown > 0,
    [state.isLocked, countdown],
  );

  // Check if PIN exists in secure storage when component mounts
  useEffect(() => {
    if (isVisible) {
      const checkExistingPin = async () => {
        const storedPin = await getValueFor(SECURE_KEY);
        if (storedPin) {
          setMode("check");
        } else {
          setMode("create");
        }
      };
      checkExistingPin();
    }
  }, [isVisible]);

  // Shake animation style
  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeAnimation.value }],
  }));

  // Countdown effect for lockout - optimized with requestAnimationFrame
  useEffect(() => {
    if (!state.lockoutEndTime) {
      setCountdown(0);
      return;
    }

    let animationFrameId: number;

    const updateCountdown = () => {
      const now = Date.now();
      const remaining = Math.max(0, state.lockoutEndTime! - now);
      const newCountdown = Math.ceil(remaining / 1000);

      // Only update state if the countdown value has changed
      if (newCountdown !== countdown) {
        setCountdown(newCountdown);
      }

      if (remaining <= 0) {
        dispatch({ type: "RESET_LOCKOUT" });
      } else {
        // Only schedule next frame if we still have time remaining
        animationFrameId = requestAnimationFrame(updateCountdown);
      }
    };

    // Start the animation frame loop
    animationFrameId = requestAnimationFrame(updateCountdown);

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [state.lockoutEndTime, countdown]);

  // Handle PIN completion
  useEffect(() => {
    if (isPinComplete && !isActionDisabled) {
      onPinComplete?.(currentPin);
    }
  }, [isPinComplete, currentPin, onPinComplete, isActionDisabled]);

  // Reset state when modal becomes visible
  useEffect(() => {
    if (isVisible) {
      dispatch({
        type: "INITIALIZE_PASSWORD",
        payload: {
          digits: new Array(6).fill(""),
          attempts: 0,
          isLocked: false,
          lockoutEndTime: null,
          error: null,
        },
      });
      setCountdown(0);
      setPinToConfirm("");

      // Check if PIN exists and set mode accordingly
      const checkExistingPin = async () => {
        const storedPin = await getValueFor(SECURE_KEY);
        if (storedPin) {
          setMode("check");
        } else {
          setMode("create");
        }
      };
      checkExistingPin();
    }
  }, [isVisible]);

  const triggerShake = useCallback(() => {
    shakeAnimation.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-10, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  }, [shakeAnimation]);

  const handleIncorrectPin = useCallback(() => {
    dispatch({
      type: "INCREMENT_ATTEMPTS",
      payload: {
        maxAttempts: MAX_ATTEMPTS,
        lockoutDuration: LOCKOUT_DURATION,
      },
    });

    triggerShake();
  }, [triggerShake]);

  const handleKeypadPress = useCallback(
    (item: (typeof KEYPAD_DATA)[number]) => {
      if (isActionDisabled) return;

      // Vibration feedback - only on supported platforms
      if (Platform.OS !== "web") {
        Vibration.vibrate(10);
      }

      if (item.type === "action") {
        // Handle backspace
        dispatch({ type: "REMOVE_DIGIT" });
      } else if (
        item.type === "number" &&
        state.digits.filter(Boolean).length < PIN_LENGTH
      ) {
        // Add digit if not at max length
        dispatch({ type: "ADD_DIGIT", payload: { digit: item.value } });
      }
    },
    [isActionDisabled, state.digits],
  );

  const handleSave = useCallback(async () => {
    if (!isPinComplete || isActionDisabled) return;

    try {
      if (mode === "check") {
        // Verify PIN
        const storedPin = await getValueFor(SECURE_KEY);
        if (currentPin === storedPin) {
          dispatch({ type: "SET_ERROR", payload: { error: null } });
          onMatches(currentPin);
        } else {
          handleIncorrectPin();
        }
      } else if (mode === "create") {
        // Save PIN for confirmation
        setPinToConfirm(currentPin);
        setMode("confirm");
        dispatch({ type: "CLEAR_DIGITS" });
      } else if (mode === "confirm") {
        // Confirm PIN matches
        if (currentPin === pinToConfirm) {
          await save(SECURE_KEY, currentPin);
          dispatch({ type: "SET_ERROR", payload: { error: null } });
          onMatches(currentPin);
        } else {
          dispatch({
            type: "SET_ERROR",
            payload: { error: "PINs do not match. Please try again." },
          });
          dispatch({ type: "CLEAR_DIGITS" });
          setMode("create");
          setPinToConfirm("");
        }
      }
    } catch (error) {
      console.error("Error saving PIN:", error);
      dispatch({
        type: "SET_ERROR",
        payload: { error: "An error occurred. Please try again." },
      });
    }
  }, [
    isPinComplete,
    isActionDisabled,
    mode,
    currentPin,
    pinToConfirm,
    onMatches,
    handleIncorrectPin,
  ]);

  const renderPinDot = useCallback((digit: string, index: number) => {
    return (
      <View key={index} style={styles.pinDotContainer}>
        <View
          style={[
            styles.pinDot,
            digit ? styles.pinDotFilled : styles.pinDotEmpty,
          ]}
          accessibilityLabel={`PIN digit ${index + 1} ${digit ? "filled" : "empty"}`}
        >
          {digit && (
            <Text style={styles.pinDigit} accessible={false}>
              {digit}
            </Text>
          )}
        </View>
      </View>
    );
  }, []);

  const renderKeypadButton = useCallback(
    (item: (typeof KEYPAD_DATA)[number], index: number) => {
      if (item.type === "empty") {
        return <View key={index} style={styles.keypadButton} />;
      }

      const isDisabled = isActionDisabled;

      return (
        <Pressable
          key={index}
          style={[
            styles.keypadButton,
            isDisabled && styles.keypadButtonDisabled,
          ]}
          onPress={() => handleKeypadPress(item)}
          disabled={isDisabled}
          android_ripple={{ color: colors.ripple, borderless: false }}
          accessibilityRole="button"
          accessibilityLabel={
            item.type === "number"
              ? `Number ${item.value}`
              : "Delete last digit"
          }
        >
          <View style={styles.keypadButtonInner}>
            {item.type === "action" ? (
              <Icon
                name="backspace-outline"
                size={24}
                color={isDisabled ? colors.border : colors.text}
              />
            ) : (
              <Text
                style={[
                  styles.keypadButtonText,
                  isDisabled && styles.keypadButtonTextDisabled,
                ]}
              >
                {item.value}
              </Text>
            )}
          </View>
        </Pressable>
      );
    },
    [handleKeypadPress, isActionDisabled],
  );

  // Memoized button component to avoid duplication
  const actionButton = useMemo(() => {
    const buttonTitle = isPinComplete
      ? mode === "check"
        ? "Continue"
        : mode === "create"
          ? "Next"
          : "Confirm PIN"
      : mode === "check"
        ? "Enter PIN"
        : mode === "create"
          ? "Create PIN"
          : "Confirm PIN";

    return (
      <Button
        title={buttonTitle}
        onPress={handleSave}
        style={[
          styles.continueButton,
          (!isPinComplete || isActionDisabled) && styles.continueButtonDisabled,
        ]}
        textStyle={[
          styles.continueButtonText,
          (!isPinComplete || isActionDisabled) &&
            styles.continueButtonTextDisabled,
        ]}
        disabled={!isPinComplete || isActionDisabled}
      />
    );
  }, [isPinComplete, isActionDisabled, mode, handleSave]);

  if (!isVisible) return null;

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <SafeAreaView style={styles.container}>
        <Animated.View style={[styles.panel, animatedStyle]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter PIN</Text>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              accessibilityRole="button"
              accessibilityLabel="Close PIN entry"
            >
              <Icon
                type="MaterialIcons"
                name="close"
                size={24}
                color={colors.text}
              />
            </Pressable>
          </View>

          <View
            style={
              isLandscape ? styles.landscapeContent : styles.portraitContent
            }
          >
            <View
              style={
                isLandscape
                  ? styles.leftContentLandscape
                  : styles.fullWidthContent
              }
            >
              <View style={styles.scrollContent}>
                {/* Subtitle */}
                <Text style={styles.subtitle}>
                  {mode === "check" &&
                    "Please enter your 6-digit PIN to continue."}
                  {mode === "create" && "Please create a new 6-digit PIN."}
                  {mode === "confirm" &&
                    "Please confirm your PIN by entering it again."}
                </Text>

                {/* Error message */}
                {state.error && (
                  <Animated.View
                    style={styles.errorContainer}
                    entering={FadeIn.duration(200)}
                  >
                    <Icon name="alert-circle" size={16} color={colors.white} />
                    <Text style={styles.errorText}>{state.error}</Text>
                  </Animated.View>
                )}

                {/* Countdown display */}
                {countdown > 0 && (
                  <Animated.View
                    style={styles.countdownContainer}
                    entering={FadeIn.duration(200)}
                  >
                    <Text style={styles.countdownText}>
                      Try again in {countdown} seconds
                    </Text>
                  </Animated.View>
                )}

                {/* PIN input display */}
                <View style={styles.pinContainer}>
                  {state.digits.map(renderPinDot)}
                </View>
              </View>

              {/* Footer */}
              {isLandscape && <View style={styles.footer}>{actionButton}</View>}
            </View>

            {/* Keypad - will be on right in landscape mode */}
            <View
              style={
                isLandscape
                  ? styles.rightContentLandscape
                  : styles.fullWidthContent
              }
            >
              <View style={styles.keypadContainer}>
                {KEYPAD_DATA.map(renderKeypadButton)}
              </View>
            </View>
            {/* Footer */}
            {!isLandscape && <View style={styles.footer}>{actionButton}</View>}
          </View>
        </Animated.View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: colors.textSecondary,
  },
  panel: {
    width: "100%",
    height: "100%",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.white,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
  },
  // Layout styles for portrait/landscape
  portraitContent: {
    flex: 1,
    flexDirection: "column",
  },
  landscapeContent: {
    flex: 1,
    flexDirection: "row",
  },
  fullWidthContent: {
    flex: 1,
  },
  leftContentLandscape: {
    flex: 1,
    borderRightWidth: 1,
    borderRightColor: colors.border,
    paddingRight: 16,
  },
  rightContentLandscape: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 16,
  },
  scrollContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-end",
  },
  subtitle: {
    fontSize: 20,
    textAlign: "center",
    marginBottom: 20,
    color: colors.white,
    lineHeight: 22,
    fontWeight: "700",
  },
  biometricButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.background,
    marginBottom: 20,
    gap: 8,
  },
  biometricText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "500",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.errorLight,
    borderRadius: 8,
    marginBottom: 16,
    alignSelf: "center",
  },
  errorText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "500",
  },
  countdownContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.info,
    borderRadius: 8,
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 14,
    color: colors.white,
    textAlign: "center",
    fontWeight: "500",
  },
  pinContainer: {
    marginBottom: 32,
    flexDirection: "row",
    gap: 12,
  },
  pinDotContainer: {
    width: 50,
    height: 50,
  },
  pinDot: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  pinDotEmpty: {
    backgroundColor: colors.background,
  },
  pinDotFilled: {
    backgroundColor: colors.primary,
  },
  pinDigit: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.white,
  },
  keypadContainer: {
    width: 240,
    flexDirection: "row",
    flexWrap: "wrap",
    alignSelf: "center",
  },
  keypadButton: {
    width: "33.333%",
    aspectRatio: 1,
    padding: 4,
  },
  keypadButtonDisabled: {
    opacity: 0.5,
  },
  keypadButtonInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    backgroundColor: colors.background,
  },
  keypadButtonText: {
    fontSize: 24,
    fontWeight: "500",
    color: colors.text,
  },
  keypadButtonTextDisabled: {
    color: colors.border,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 20,
  },
  continueButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 16,
  },
  continueButtonDisabled: {
    backgroundColor: colors.border,
  },
  continueButtonText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
    textAlign: "center",
  },
  continueButtonTextDisabled: {
    color: colors.text,
  },
});

export default memo(Password);
