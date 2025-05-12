import { Settings } from "@lib/setting";
import { settingInitialState, settingReducer } from "@reducer/Setting";
import colors from "@utils/colors";
import React, { memo, useCallback, useEffect, useReducer } from "react";
import {
  Modal,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
  Switch,
  ScrollView,
  Pressable,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Button from "@components/Button";
import Icon from "@components/Icon";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  data: Settings;
  onSaved: (setting: Settings) => void;
}

const SettingModal = ({ isOpen, onClose, data, onSaved }: Props) => {
  const [state, dispatch] = useReducer(settingReducer, settingInitialState);

  useEffect(() => {
    if (data) {
      dispatch({ type: "INITIALIZE_SETTINGS", payload: data });
    }
  }, [data]);

  const handleToggleAutoPlay = useCallback(() => {
    dispatch({ type: "TOGGLE_AUTO_PLAY" });
  }, []);

  const handleToggleLoop = useCallback(() => {
    dispatch({ type: "TOGGLE_LOOP" });
  }, []);

  const handleIntervalChange = useCallback((value: number) => {
    // Round to nearest 100ms for better UX
    const interval = Math.round(value / 100) * 100;
    dispatch({ type: "SET_INTERVAL", payload: interval });
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

  return (
    <View>
      <Modal
        visible={isOpen}
        statusBarTranslucent
        animationType="slide"
        onRequestClose={onClose}
      >
        <SafeAreaProvider>
          <SafeAreaView style={styles.container}>
            <GestureHandlerRootView style={styles.container}>
              <ScrollView
                style={styles.content}
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
                          Interval: {state.settings.autoPlayInterval}ms
                        </Text>
                      </View>
                      <View style={styles.sliderContainer}>
                        <Text style={styles.sliderLabel}>500ms</Text>
                        <View style={styles.customSlider}>
                          <Pressable
                            style={styles.sliderTrackContainer}
                            onPress={(event) => {
                              const { locationX, pageX } = event.nativeEvent;
                              // Calculate percentage based on locationX
                              const percentage = Math.max(
                                0,
                                Math.min(1, locationX / 280),
                              ); // Assuming track width ~280px
                              const newValue =
                                Math.round((percentage * 4500 + 500) / 100) *
                                100;
                              handleIntervalChange(newValue);
                            }}
                          >
                            <View style={styles.sliderTrack}>
                              <View
                                style={[
                                  styles.sliderFill,
                                  {
                                    width: `${((state.settings.autoPlayInterval - 500) / 4500) * 100}%`,
                                  },
                                ]}
                              />
                            </View>
                          </Pressable>
                          <View
                            style={[
                              styles.sliderThumb,
                              {
                                left: `${((state.settings.autoPlayInterval - 500) / 4500) * 100}%`,
                              },
                            ]}
                          >
                            <View style={styles.thumbInner} />
                          </View>
                        </View>
                        <Text style={styles.sliderLabel}>5000ms</Text>
                      </View>
                      <View style={styles.intervalButtons}>
                        {[1000, 2000, 3000, 4000].map((interval) => (
                          <Pressable
                            key={interval}
                            style={[
                              styles.intervalButton,
                              state.settings.autoPlayInterval === interval &&
                                styles.activeIntervalButton,
                            ]}
                            onPress={() => handleIntervalChange(interval)}
                          >
                            <Text
                              style={[
                                styles.intervalButtonText,
                                state.settings.autoPlayInterval === interval &&
                                  styles.activeIntervalButtonText,
                              ]}
                            >
                              {interval}ms
                            </Text>
                          </Pressable>
                        ))}
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
    flex: 1,
    padding: 16,
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
    paddingVertical: 8,
    marginBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  customSlider: {
    flex: 1,
    height: 40,
    position: "relative",
    justifyContent: "center",
  },
  sliderTrackContainer: {
    flex: 1,
    height: 40,
    justifyContent: "center",
  },
  sliderTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
  },
  sliderFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  sliderThumb: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.background,
    position: "absolute",
    top: 10,
    marginLeft: -10,
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  sliderLabel: {
    fontSize: 12,
    color: colors.text,
    width: 50,
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
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderTopColor: "#e9ecef",
  },
  footerButton: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    marginTop: 8,
    paddingBottom: 12,
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
