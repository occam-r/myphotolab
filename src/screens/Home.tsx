import Button from "@components/Button";
import CaruselItem from "@components/CaruselItem";
import { Images } from "@lib/images";
import { homeReducer, initialHomeState } from "@reducer/Home";
import { CACHE_PATHS, readCache, writeCache } from "@utils/cache";
import { height, width } from "@utils/layout";
import { useCallback, useEffect, useMemo, useReducer, useState } from "react";
import {
  ActivityIndicator,
  StyleSheet,
  ToastAndroid,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  FadeIn,
  FadeOut,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import Carousel, { CarouselRenderItem } from "react-native-reanimated-carousel";
import Image from "./Image";
import Setting from "./Setting";
import { Settings } from "@lib/setting";
import colors from "@utils/colors";

export default function Home({ isLandscape }: { isLandscape: boolean }) {
  const [state, dispatch] = useReducer(homeReducer, initialHomeState);
  const [isImageModalOpen, setImageModalOpen] = useState(false);
  const [isSettingModalOpen, setSettingModalOpen] = useState(false);
  const { images, setting, loading } = state;
  const progress = useSharedValue<number>(0);
  const buttonOpacity = useSharedValue<number>(0);

  // Load cached data on component mount
  useEffect(() => {
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
  }, []);

  // Memoized modal toggle handlers
  const toggleImageModal = useCallback(() => {
    setImageModalOpen((prev) => !prev);
    // Hide buttons when opening modal
    if (!isImageModalOpen) {
      buttonOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isImageModalOpen, buttonOpacity]);

  const toggleSettingModal = useCallback(() => {
    setSettingModalOpen((prev) => !prev);
    // Hide buttons when opening modal
    if (!isSettingModalOpen) {
      buttonOpacity.value = withTiming(0, {
        duration: 200,
        easing: Easing.in(Easing.ease),
      });
    }
  }, [isSettingModalOpen, buttonOpacity]);

  const handleModalOpen = useCallback(() => {
    toggleImageModal();
  }, [toggleImageModal]);

  // Double tap gesture to show/hide buttons
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => {
      buttonOpacity.value =
        buttonOpacity.value === 0
          ? withTiming(1, {
              duration: 300,
              easing: Easing.out(Easing.ease),
            })
          : withTiming(0, {
              duration: 300,
              easing: Easing.in(Easing.ease),
            });
    });

  // Animated styles for buttons
  const animatedButtonStyle = useAnimatedStyle(() => {
    return {
      opacity: buttonOpacity.value,
      transform: [{ scale: buttonOpacity.value }],
    };
  }, []);

  // Save settings handler with optimized error handling
  const handleSaveSetting = useCallback(async (setting: Settings) => {
    buttonOpacity.value = 0;
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
    buttonOpacity.value = 0;
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
    [setting.autoPlay, setting.autoPlayInterval, setting.loop, setting.mode],
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

  // Memoized carousel render item function
  const renderCarouselItem = useCallback<CarouselRenderItem<Images>>(
    ({ item, index, animationValue }) => {
      return (
        <CaruselItem
          img={{ uri: item.uri }}
          key={index}
          index={index}
          animationValue={animationValue}
        />
      );
    },
    [],
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
          parallaxAdjacentItemScale: 0.8,
          parallaxScrollingOffset: 40,
          parallaxScrollingScale: 0.9,
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
            style={styles.carousel}
            onProgressChange={progress}
            renderItem={renderCarouselItem}
            scrollAnimationDuration={1000}
          />
        ) : (
          <Animated.View
            entering={FadeIn.duration(300)}
            style={styles.emptyStateContainer}
          >
            <Button title="Add Your First Photo" onPress={handleModalOpen} />
          </Animated.View>
        )}

        <Animated.View
          style={[styles.addPhoto, animatedButtonStyle]}
          entering={FadeIn.duration(300)}
        >
          <Button title="Add Photo" onPress={handleModalOpen} />
        </Animated.View>

        <Animated.View
          style={[styles.setting, animatedButtonStyle]}
          entering={FadeIn.duration(300)}
        >
          <Button title="Settings" onPress={toggleSettingModal} />
        </Animated.View>

        {renderLoadingOverlay()}

        <Image
          isOpen={isImageModalOpen}
          onClose={toggleImageModal}
          data={images}
          onSaved={handleSaveImage}
          isLandscape={isLandscape}
        />

        <Setting
          isOpen={isSettingModalOpen}
          onClose={toggleSettingModal}
          data={setting}
          onSaved={handleSaveSetting}
        />
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  carousel: {
    width: width,
    height: height,
    flex: 1,
  },
  addPhoto: {
    position: "absolute",
    bottom: 20,
    zIndex: 10,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 5,
  },
  setting: {
    position: "absolute",
    top: 20,
    zIndex: 10,
    borderRadius: 8,
    overflow: "hidden",
    elevation: 5,
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
  },
});

// landscamode, second unit min 1 second - 1 minute max,
