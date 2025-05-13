import { Settings } from "@lib/setting";
import { settingInitialState, settingReducer } from "@reducer/Setting"; // Ensure this path is correct
import colors from "@utils/colors";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
} from "react";
import {
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  Switch,
  Pressable,
} from "react-native";
import {
  GestureHandlerRootView,
  ScrollView,
} from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "@components/Button";
import Icon from "@components/Icon";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { StatusBar } from "expo-status-bar";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: Settings; // This should be Settings & { loading?: boolean } if loading is passed in data
  onSaved: (setting: Settings) => void;
}

const MIN_INTERVAL_MS = 1000;
const MAX_INTERVAL_MS = 60000;
const INTERVAL_RANGE_MS = MAX_INTERVAL_MS - MIN_INTERVAL_MS;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(value, max));

const formatInterval = (ms: number) => {
  const totalSeconds = Math.round(ms / 1000);
  if (totalSeconds < 60) {
    return `${totalSeconds}s`;
  }
  const minutes = Math.floor(totalSeconds / 60);
  return `${minutes}m`;
};

const SettingModal = ({ isOpen, onClose, data, onSaved }: Props) => {
  const [state, dispatch] = useReducer(settingReducer, settingInitialState);
  const [sliderWidth, setSliderWidth] = useState(0);

  useEffect(() => {
    if (data) {
      const initialInterval = clamp(
        data.autoPlayInterval ?? MIN_INTERVAL_MS,
        MIN_INTERVAL_MS,
        MAX_INTERVAL_MS,
      );
      dispatch({
        type: "INITIALIZE_SETTINGS",
        payload: {
          ...settingInitialState.settings, // Start with defaults
          ...data, // Override with passed data
          autoPlayInterval: initialInterval, // Ensure interval is clamped
        },
      });
    }
  }, [data, isOpen]);

  const handleToggleAutoPlay = useCallback(() => {
    dispatch({ type: "TOGGLE_AUTO_PLAY" });
  }, []);

  const handleToggleLoop = useCallback(() => {
    dispatch({ type: "TOGGLE_LOOP" });
  }, []);

  const handleIntervalChange = useCallback((value: number) => {
    const newInterval = clamp(
      Math.round(value / 1000) * 1000,
      MIN_INTERVAL_MS,
      MAX_INTERVAL_MS,
    );
    dispatch({ type: "SET_INTERVAL", payload: newInterval });
  }, []);

  const handleModeChange = useCallback((mode: Settings["mode"]) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const handleSave = useCallback(() => {
    onSaved(state.settings);
    onClose();
    ToastAndroid.show("Settings saved successfully", ToastAndroid.SHORT);
  }, [state.settings, onSaved, onClose]);

  const renderModeOption = useCallback(
    (mode: Settings["mode"], label: string) => {
      const isSelected = state.settings.mode === mode;
      return (
        <Pressable
          style={[styles.modeOption, isSelected && styles.selectedModeOption]}
          onPress={() => handleModeChange(mode)}
        >
          <Text
            style={[styles.modeText, isSelected && styles.selectedModeText]}
          >
            {label}
          </Text>
          {isSelected && (
            <Icon
              type="MaterialIcons"
              name="check"
              size={20}
              color={colors.background}
            />
          )}
        </Pressable>
      );
    },
    [state.settings.mode, handleModeChange],
  );

  const sliderPercentage = useMemo(() => {
    if (INTERVAL_RANGE_MS === 0) return 0;
    return (
      ((state.settings.autoPlayInterval - MIN_INTERVAL_MS) /
        INTERVAL_RANGE_MS) *
      100
    );
  }, [state.settings.autoPlayInterval]);

  return (
    <View>
      <Modal
        visible={isOpen}
        animationType="slide"
        onRequestClose={onClose}
        supportedOrientations={["portrait", "landscape"]}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <GestureHandlerRootView style={styles.container}>
              <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
              >
                <Animated.View
                  entering={FadeIn.duration(300)}
                  exiting={FadeOut.duration(300)}
                >
                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Auto Play</Text>
                    <Switch
                      value={state.settings.autoPlay}
                      onValueChange={handleToggleAutoPlay}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={colors.background}
                    />
                  </View>

                  {state.settings.autoPlay && (
                    <Animated.View
                      entering={FadeIn.duration(300)}
                      exiting={FadeOut.duration(300)}
                    >
                      <View style={styles.settingRow}>
                        <Text style={styles.settingLabel}>
                          Interval:{" "}
                          {formatInterval(state.settings.autoPlayInterval)}
                        </Text>
                      </View>
                      <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>
                          {formatInterval(MIN_INTERVAL_MS)}
                        </Text>
                        <View
                          style={styles.customSlider}
                          onLayout={(event) =>
                            setSliderWidth(event.nativeEvent.layout.width)
                          }
                        >
                          <Pressable
                            style={styles.sliderTrackContainer}
                            onPress={(event) => {
                              if (sliderWidth > 0) {
                                const { locationX } = event.nativeEvent;
                                const percentage = Math.max(
                                  0,
                                  Math.min(1, locationX / sliderWidth),
                                );
                                const newValue =
                                  percentage * INTERVAL_RANGE_MS +
                                  MIN_INTERVAL_MS;
                                handleIntervalChange(newValue);
                              }
                            }}
                          >
                            <View style={styles.sliderTrack}>
                              <View
                                style={[
                                  styles.sliderFill,
                                  { width: `${sliderPercentage}%` },
                                ]}
                              />
                            </View>
                          </Pressable>
                          <View
                            style={[
                              styles.sliderThumb,
                              { left: `${sliderPercentage}%` },
                            ]}
                          >
                            <View style={styles.thumbInner} />
                          </View>
                        </View>
                        <Text style={styles.sliderLabel}>
                          {formatInterval(MAX_INTERVAL_MS)}
                        </Text>
                      </View>
                    </Animated.View>
                  )}

                  <View style={styles.settingRow}>
                    <Text style={styles.settingLabel}>Loop Slides</Text>
                    <Switch
                      value={state.settings.loop}
                      onValueChange={handleToggleLoop}
                      trackColor={{
                        false: colors.border,
                        true: colors.primary,
                      }}
                      thumbColor={colors.background}
                    />
                  </View>

                  <View style={styles.settingSection}>
                    <Text style={styles.settingLabel}>Carousel Mode</Text>
                    <View style={styles.modeOptions}>
                      {renderModeOption("parallax", "Parallax")}
                      {renderModeOption("horizontal-stack", "H-Stack")}
                      {renderModeOption("vertical-stack", "V-Stack")}
                    </View>
                  </View>
                </Animated.View>
              </ScrollView>

              <View style={styles.footer}>
                <View style={styles.footerButton}>
                  <Button
                    title="Close"
                    onPress={onClose}
                    style={styles.closeButton}
                    textStyle={styles.closeText}
                  />
                  <Button
                    title="Save"
                    onPress={handleSave}
                    style={styles.saveButton}
                    textStyle={styles.saveText}
                  />
                </View>
              </View>
            </GestureHandlerRootView>
          </SafeAreaView>
        </SafeAreaProvider>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
  },
  settingRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: 16,
    color: colors.text,
  },
  sliderContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  customSlider: {
    flex: 1,
    height: 40,
    justifyContent: "center",
    marginHorizontal: 10,
  },
  sliderTrackContainer: {
    height: "100%",
    justifyContent: "center",
  },
  sliderTrack: {
    height: 6,
    backgroundColor: colors.border,
    borderRadius: 3,
    width: "100%",
  },
  sliderFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sliderThumb: {
    position: "absolute",
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    top: "50%",
    transform: [{ translateY: -12 }, { translateX: -12 }],
    borderWidth: 2,
    borderColor: colors.background,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  thumbInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.background,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.text,
    minWidth: 50,
    textAlign: "center",
  },
  intervalButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  intervalButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: colors.border,
  },
  activeIntervalButton: {
    backgroundColor: colors.primary,
  },
  intervalButtonText: {
    fontSize: 12,
    color: colors.text,
  },
  activeIntervalButtonText: {
    color: colors.background,
  },
  settingSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  modeOptions: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  modeOption: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.border,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 8,
    marginBottom: 8,
    minWidth: 100,
  },
  selectedModeOption: {
    backgroundColor: colors.primary,
  },
  modeText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 4,
  },
  selectedModeText: {
    color: colors.background,
  },
  footer: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.background,
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 8,
    gap: 12,
  },
  saveButton: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: colors.primary,
    borderRadius: 12,
  },
  closeButton: {
    flex: 1,
    backgroundColor: "#f1f3f5",
    borderWidth: 1,
    borderColor: "#dee2e6",
    borderRadius: 12,
  },
  saveText: {
    fontSize: 16,
    color: colors.background,
    fontWeight: "600",
  },
  closeText: {
    fontSize: 16,
    color: "#495057",
    fontWeight: "600",
  },
});

export default memo(SettingModal);
