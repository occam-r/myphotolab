import Button from "@components/Button";
import Icon from "@components/Icon";
import { Images } from "@lib/images";
import { Settings } from "@lib/setting";
import { homeReducer, initialHomeState } from "@reducer/Home";
import { authenticateUser } from "@utils/authenticateUser";
import { CACHE_PATHS, readCache, writeCache } from "@utils/cache";
import colors from "@utils/colors";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Image as RNImage,
  StyleSheet,
  Text,
  ToastAndroid,
  View,
} from "react-native";
import RTNLockTask from "react-native-device-lock-task/js/NativeDeviceLockTask";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  FadeIn,
  FadeOut,
  runOnJS,
  useSharedValue,
} from "react-native-reanimated";
import Carousel, { CarouselRenderItem } from "react-native-reanimated-carousel";
import Image from "./Image";
import Setting from "./Setting";

interface Props {
  isLandscape: boolean;
  dimensions: {
    width: number;
    height: number;
  };
}

export default function Home({
  isLandscape,
  dimensions: { width, height },
}: Props) {
  const [state, dispatch] = useReducer(homeReducer, initialHomeState);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [isSettingsVisible, setSettingsVisible] = useState(false);
  const [isScreenLocked, setIsScreenLocked] = useState(false);
  const { images, setting, loading } = state;
  const progress = useSharedValue<number>(0);

  useEffect(() => {
    const checkLockTaskMode = async () => {
      if (Platform.OS === "android" && Platform.Version >= 21) {
        try {
          if (RTNLockTask) {
            const isInLockTask = await RTNLockTask?.isAppInLockTaskMode();
            setIsScreenLocked(isInLockTask);
          }
        } catch (error) {
          console.error("Error checking lock task mode:", error);
        }
      }
    };
    const loadCachedData = async () => {
      try {
        const cachedImages = await readCache<Images[]>(CACHE_PATHS.IMAGES);
        if (cachedImages?.length) {
          dispatch({ type: "SET_IMAGES", payload: cachedImages });
        }

        const savedSettings = await readCache<Settings>(CACHE_PATHS.SETTING);
        if (savedSettings) {
          dispatch({ type: "SET_SETTING", payload: savedSettings });
        }
      } catch (error) {
        console.error("Error loading cached data:", error);
        ToastAndroid.show("Failed to load saved data", ToastAndroid.SHORT);
      }
    };

    loadCachedData();
    checkLockTaskMode();
  }, []);

  // Memoized modal toggle handlers
  const toggleImageModal = useCallback(() => {
    setImageModalOpen((prev) => !prev);
  }, [isImageModalOpen]);

  const handleModalOpen = useCallback(async () => {
    const isAuthenticated = await authenticateUser();
    if (isAuthenticated) {
      toggleImageModal();
    }
  }, [toggleImageModal]);

  // Double tap gesture to show/hide settings panel
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      if (isSettingsVisible) {
        runOnJS(setSettingsVisible)(false);
      } else {
        runOnJS(setSettingsVisible)(true);
      }
    });

  const toggleScreenLock = useCallback(async () => {
    if (isScreenLocked) {
      const isAuthenticated = await authenticateUser();
      if (isAuthenticated) {
        if (Platform.OS === "android") {
          try {
            if (Platform.Version >= 21) {
              if (RTNLockTask) {
                const isInLockTask = await RTNLockTask?.isAppInLockTaskMode();
                if (!isInLockTask) {
                  setIsScreenLocked(false);
                  ToastAndroid.show("Screen is not locked", ToastAndroid.SHORT);
                  return;
                }
                await RTNLockTask?.stopLockTask();
                setIsScreenLocked(false);
                ToastAndroid.show("Screen unlocked", ToastAndroid.SHORT);
              } else {
                ToastAndroid.show(
                  "Lock Task Module not available",
                  ToastAndroid.SHORT,
                );
              }
            } else {
              ToastAndroid.show(
                "Lock Task Mode requires Android 5.0 or higher",
                ToastAndroid.SHORT,
              );
            }
          } catch (error) {
            console.error("Error unlocking screen:", error);
            ToastAndroid.show("Failed to unlock screen", ToastAndroid.SHORT);
          }
        }
      }
    } else {
      // Lock screen
      if (Platform.OS === "android") {
        try {
          if (Platform.Version >= 21) {
            if (RTNLockTask) {
              const isInLockTask = await RTNLockTask?.isAppInLockTaskMode();
              if (isInLockTask) {
                setIsScreenLocked(true);
                ToastAndroid.show(
                  "Screen is already locked",
                  ToastAndroid.SHORT,
                );
                return;
              }
              await RTNLockTask?.startLockTask();
              setIsScreenLocked(true);
              ToastAndroid.show("Screen locked", ToastAndroid.SHORT);
            } else {
              ToastAndroid.show(
                "Lock Task Module not available",
                ToastAndroid.SHORT,
              );
            }
          } else {
            ToastAndroid.show(
              "Lock Task Mode requires Android 5.0 or higher",
              ToastAndroid.SHORT,
            );
          }
        } catch (error) {
          console.error("Error locking screen:", error);
          ToastAndroid.show("Failed to lock screen", ToastAndroid.SHORT);
          ToastAndroid.show(
            "This feature requires special device setup",
            ToastAndroid.LONG,
          );
        }
      }
    }
  }, [isScreenLocked]);

  // Save settings handler with optimized error handling
  const handleSaveSetting = useCallback(async (setting: Settings) => {
    try {
      dispatch({ type: "SET_LOADING", payload: { setting: true } });
      dispatch({ type: "SET_SETTING", payload: setting });
      await writeCache(CACHE_PATHS.SETTING, setting);
      ToastAndroid.show("Settings saved successfully", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error in handleSaveSetting:", error);
      ToastAndroid.show("Failed to save settings", ToastAndroid.SHORT);
    } finally {
      dispatch({ type: "SET_LOADING", payload: { setting: false } });
    }
  }, []);

  // Save images handler with optimized error handling
  const handleSaveImage = useCallback(async (images: Images[]) => {
    try {
      dispatch({ type: "SET_LOADING", payload: { images: true } });
      dispatch({ type: "SET_IMAGES", payload: images });
      await writeCache(CACHE_PATHS.IMAGES, images);
      ToastAndroid.show("Images saved successfully", ToastAndroid.SHORT);
    } catch (error) {
      console.error("Error in handleSaveImage:", error);
      ToastAndroid.show("Failed to save images", ToastAndroid.SHORT);
    } finally {
      dispatch({ type: "SET_LOADING", payload: { images: false } });
    }
  }, []);

  // Memoized carousel configuration
  const carouselConfig = useMemo(
    () => ({
      ...setting,
      mode: setting.mode as "parallax",
    }),
    [
      setting.autoPlay,
      setting.autoPlayInterval,
      setting.loop,
      setting.mode,
      setting.resizeMode,
    ],
  );

  // Render loading indicator when data is being loaded
  const renderLoadingOverlay = useCallback(() => {
    if (loading.images || loading.setting) {
      return (
        <Animated.View
          entering={FadeIn.duration(300)}
          exiting={FadeOut.duration(300)}
          style={styles.loadingOverlay}
        >
          <ActivityIndicator size="large" color={colors.primary} />
        </Animated.View>
      );
    }
    return null;
  }, [loading.images, loading.setting]);

  const renderCarouselItem = useCallback<CarouselRenderItem<Images>>(
    ({ item }) => {
      return (
        <Animated.Image
          style={{
            flex: 1,
            height: height,
            width: width,
            borderRadius: 12,
            overflow: "hidden",
          }}
          source={{ uri: item.uri }}
          resizeMode={carouselConfig.resizeMode}
        />
      );
    },
    [carouselConfig.resizeMode, height, width],
  );

  // Enhanced modeConfig with more customization options
  const modeConfig = useMemo(() => {
    switch (setting.mode) {
      case "horizontal-stack":
        return {
          showLength: 3,
          stackInterval: 15,
          scaleInterval: 0.08,
          opacityInterval: 0.1,
        };
      case "vertical-stack":
        return {
          showLength: 3,
          stackInterval: 15,
          scaleInterval: 0.08,
          opacityInterval: 0.1,
        };
      case "parallax":
      default:
        return {
          parallaxAdjacentItemScale: 1,
          parallaxScrollingOffset: 0,
          parallaxScrollingScale: 1,
        };
    }
  }, [setting.mode]);

  return (
    <GestureDetector gesture={doubleTapGesture}>
      <View style={styles.container}>
        {images.length > 0 ? (
          <Carousel<Images>
            data={images}
            height={height}
            autoPlay={carouselConfig.autoPlay}
            autoPlayInterval={carouselConfig.autoPlayInterval}
            loop={carouselConfig.loop}
            mode={carouselConfig.mode}
            modeConfig={modeConfig}
            pagingEnabled={true}
            snapEnabled={true}
            width={width}
            style={{
              flex: 1,
              height: height,
              width: width,
            }}
            onProgressChange={progress}
            renderItem={renderCarouselItem}
            scrollAnimationDuration={1000}
            key={isLandscape ? "i-v" : "i-h"}
          />
        ) : (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.emptyStateContainer}
          >
            <View style={styles.emptyStateContent}>
              <RNImage
                source={require("../../assets/icon.png")}
                style={styles.emptyStateIcon}
              />
              <Text style={styles.emptyStateTitle}>
                Welcome to My Photo Lab
              </Text>
              <Text style={styles.emptyStateDescription}>
                Add photos from your gallery or take pictures with your camera
              </Text>
              <View style={styles.instructionsContainer}>
                <View style={styles.instructionItem}>
                  <Icon
                    type="MaterialIcons"
                    name="touch-app"
                    size={24}
                    color={colors.text}
                  />
                  <Text style={styles.instructionText}>
                    Double-tap screen to show/hide controls
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Icon
                    type="MaterialIcons"
                    name="screen-rotation"
                    size={24}
                    color={colors.text}
                  />
                  <Text style={styles.instructionText}>
                    Rotate device for landscape view
                  </Text>
                </View>
                <View style={styles.instructionItem}>
                  <Icon
                    type="Feather"
                    name="lock"
                    size={24}
                    color={colors.text}
                  />
                  <Text style={styles.instructionText}>
                    Click on Lock Button to Pin the App
                  </Text>
                </View>
              </View>
              <Button
                title="Add Your First Photo"
                onPress={handleModalOpen}
                style={styles.addFirstPhotoButton}
                icon="camera"
              />
            </View>
          </Animated.View>
        )}

        {renderLoadingOverlay()}

        <Image
          isOpen={isImageModalOpen}
          onClose={toggleImageModal}
          data={images}
          onSaved={handleSaveImage}
          isLandscape={isLandscape}
        />

        <Setting
          isVisible={isSettingsVisible}
          onClose={() => setSettingsVisible(false)}
          data={setting}
          onSave={handleSaveSetting}
          onAddPhoto={handleModalOpen}
          onToggleLock={toggleScreenLock}
          isScreenLocked={isScreenLocked}
          isLandscape={isLandscape}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.7)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    backgroundColor: colors.background,
  },
  emptyStateContent: {
    width: "100%",
    maxWidth: 400,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyStateIcon: {
    marginBottom: 20,
    height: 64,
    width: 64,
    borderRadius: 12,
  },
  emptyStateTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: colors.text,
    marginBottom: 12,
    textAlign: "center",
  },
  emptyStateDescription: {
    fontSize: 16,
    color: colors.text,
    textAlign: "center",
    marginBottom: 24,
  },
  instructionsContainer: {
    width: "100%",
    marginBottom: 32,
    backgroundColor: "#f5f5f5",
    borderRadius: 12,
    padding: 16,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  instructionText: {
    fontSize: 14,
    color: colors.text,
    marginLeft: 12,
  },
  addFirstPhotoButton: {
    paddingHorizontal: 24,
    paddingVertical: 14,
  },
});
