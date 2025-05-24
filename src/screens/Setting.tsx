import Button from "@components/Button";
import Icon from "@components/Icon";
import Slider from "@components/Slider";
import { Settings } from "@lib/setting";
import { settingInitialState, settingReducer } from "@reducer/Setting";
import colors from "@utils/colors";
import { IS_AOS } from "@utils/constant";
import React, { memo, useCallback, useEffect, useReducer } from "react";
import {
  ImageResizeMode,
  Pressable,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { ScrollView } from "react-native-gesture-handler";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";

interface Props {
  isVisible: boolean;
  onClose: () => void;
  data: Settings;
  isLandscape: boolean;
  onSave: (setting: Settings) => void;
  onAddPhoto: () => void;
  onToggleLock: () => void;
  isScreenLocked?: boolean;
}

const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (remainingSeconds === 0) {
    return `${minutes}m`;
  }
  return `${minutes}m ${remainingSeconds}s`;
};

const Setting = ({
  isVisible,
  onClose,
  data,
  onSave,
  onAddPhoto,
  onToggleLock,
  isScreenLocked = false,
  isLandscape,
}: Props) => {
  const [state, dispatch] = useReducer(settingReducer, settingInitialState);

  useEffect(() => {
    if (data) {
      dispatch({
        type: "INITIALIZE_SETTINGS",
        payload: {
          ...settingInitialState, // Start with defaults
          ...data, // Override with passed data
        },
      });
    }
  }, [data]);

  const toggleAutoPlay = useCallback(() => {
    dispatch({ type: "TOGGLE_AUTO_PLAY" });
  }, []);

  const toggleLoop = useCallback(() => {
    dispatch({ type: "TOGGLE_LOOP" });
  }, []);

  const handleIntervalChange = useCallback((value: number) => {
    dispatch({ type: "SET_INTERVAL", payload: value });
  }, []);

  const handleModeChange = useCallback((mode: Settings["mode"]) => {
    dispatch({ type: "SET_MODE", payload: mode });
  }, []);

  const handleResizeModeChange = useCallback(
    (resizeMode: Settings["resizeMode"]) => {
      dispatch({ type: "SET_RESIZE_MODE", payload: resizeMode });
    },
    [],
  );

  const handleImageResetTimerChange = useCallback((timerMs: number) => {
    dispatch({ type: "SET_IMAGE_RESET_TIMER", payload: timerMs });
  }, []);

  const handleSave = useCallback(() => {
    onSave(state);
    onClose();
  }, [state, onSave, onClose]);

  const renderModeOption = useCallback(
    (mode: Settings["mode"], label: string) => {
      const isSelected = state.mode === mode;
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
              color={colors.white}
            />
          )}
        </Pressable>
      );
    },
    [state.mode, handleModeChange],
  );

  const renderResizeModeOption = useCallback(
    (resizeMode: ImageResizeMode, label: string) => {
      const isSelected = state.resizeMode === resizeMode;
      return (
        <Pressable
          style={[styles.modeOption, isSelected && styles.selectedModeOption]}
          onPress={() => handleResizeModeChange(resizeMode)}
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
              color={colors.white}
            />
          )}
        </Pressable>
      );
    },
    [state.resizeMode, handleResizeModeChange],
  );

  if (!isVisible) return null;

  return (
    <Animated.View
      style={StyleSheet.absoluteFill}
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(300)}
    >
      <SafeAreaView style={styles.container}>
        <View style={styles.panel}>
          <View style={styles.header}>
            <Text style={styles.title}>Control Panel</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Icon
                type="MaterialIcons"
                name="close"
                size={24}
                color={colors.text}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.content}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Auto Play</Text>
              <Switch
                value={state.autoPlay}
                onValueChange={toggleAutoPlay}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor={colors.white}
              />
            </View>

            {state.autoPlay && (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              >
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    Interval: {formatTime(state.autoPlayInterval)}s
                  </Text>
                </View>
                <Slider
                  value={state.autoPlayInterval}
                  minValue={1}
                  maxValue={60}
                  onValueChange={handleIntervalChange}
                  formatLabel={formatTime}
                  showValueLabel={false}
                  labelStyle={styles.labelStyle}
                  containerStyle={styles.sliderContainer}
                />
              </Animated.View>
            )}

            <View style={styles.settingRow}>
              <Text style={styles.settingLabel}>Loop Slides</Text>
              <Switch
                value={state.loop}
                onValueChange={toggleLoop}
                trackColor={{
                  false: colors.border,
                  true: colors.primary,
                }}
                thumbColor={colors.white}
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

            <View style={styles.settingSection}>
              <Text style={styles.settingLabel}>Image Resize Mode</Text>
              <View style={styles.modeOptions}>
                {renderResizeModeOption("cover", "Cover")}
                {renderResizeModeOption("contain", "Contain")}
                {renderResizeModeOption("stretch", "Stretch")}
                {renderResizeModeOption("repeat", "Repeat")}
                {renderResizeModeOption("center", "Center")}
              </View>
            </View>
            {!state.autoPlay && (
              <Animated.View
                entering={FadeIn.duration(300)}
                exiting={FadeOut.duration(300)}
              >
                <View style={styles.settingRow}>
                  <Text style={styles.settingLabel}>
                    Image Reset Timer: {formatTime(state.imageResetTimer)}
                  </Text>
                </View>
                <Slider
                  value={state.imageResetTimer}
                  minValue={30}
                  maxValue={600}
                  step={30}
                  onValueChange={handleImageResetTimerChange}
                  formatLabel={formatTime}
                  showValueLabel={false}
                  labelStyle={styles.labelStyle}
                  containerStyle={styles.sliderContainer}
                />
              </Animated.View>
            )}
          </ScrollView>

          <View style={styles.footer}>
            {isLandscape ? (
              <View style={styles.footerRowLandscape}>
                <Button
                  title="Add Photo"
                  onPress={onAddPhoto}
                  icon="camera"
                  style={styles.actionButtonLandscape}
                  textStyle={styles.actionButtonText}
                />
                {IS_AOS && (
                  <Button
                    title={isScreenLocked ? "Unlock" : "Lock"}
                    onPress={onToggleLock}
                    icon={isScreenLocked ? "unlock" : "lock"}
                    style={[
                      styles.actionButtonLandscape,
                      {
                        backgroundColor: isScreenLocked
                          ? colors.error
                          : colors.primary,
                      },
                    ]}
                    textStyle={styles.actionButtonText}
                  />
                )}

                <Button
                  title="Apply Settings"
                  onPress={handleSave}
                  style={styles.saveButtonLandscape}
                  textStyle={styles.saveText}
                />
              </View>
            ) : (
              <>
                <View style={styles.actionButtons}>
                  {IS_AOS && (
                    <Button
                      title={isScreenLocked ? "Unlock" : "Lock"}
                      onPress={onToggleLock}
                      icon={isScreenLocked ? "unlock" : "lock"}
                      style={[
                        styles.actionButton,
                        {
                          backgroundColor: isScreenLocked
                            ? colors.error
                            : colors.primary,
                        },
                      ]}
                      textStyle={styles.actionButtonText}
                    />
                  )}

                  <Button
                    title="Add Photo"
                    onPress={onAddPhoto}
                    icon="camera"
                    style={styles.actionButton}
                    textStyle={styles.actionButtonText}
                  />
                </View>

                <Button
                  title="Apply Settings"
                  onPress={handleSave}
                  style={styles.saveButton}
                  textStyle={styles.saveText}
                />
              </>
            )}
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
    backgroundColor: colors.modal,
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
    backgroundColor: colors.backgroundSecondary,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 16,
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
    color: colors.white,
    fontWeight: "500",
  },
  sliderContainer: {
    height: 60,
    justifyContent: "center",
  },
  labelStyle: {
    color: colors.white,
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
    borderColor: colors.white,
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
    color: colors.white,
    minWidth: 50,
    textAlign: "center",
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
    color: colors.white,
  },
  footer: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  footerRowLandscape: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  actionButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonLandscape: {
    width: "30%",
    borderRadius: 12,
    paddingVertical: 12,
  },
  actionButtonText: {
    fontSize: 14,
    color: colors.white,
    fontWeight: "600",
  },
  saveButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
  },
  saveButtonLandscape: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    width: "30%",
  },
  saveText: {
    fontSize: 16,
    color: colors.white,
    fontWeight: "600",
  },
});

export default memo(Setting);
