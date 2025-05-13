import { initializeCacheDir } from "@utils/cache";
import { getScreenOrientation } from "@utils/layout";
import { useKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { Dimensions } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Home from "./Home";

export default function App() {
  useKeepAwake();

  const [isLandscape, setIsLandscape] = useState<boolean>(
    getScreenOrientation(),
  );
  const [dimensions, setDimensions] = useState({
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height,
  });

  useEffect(() => {
    const initApp = async () => {
      await initializeCacheDir();
    };
    initApp();
  }, []);

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(getScreenOrientation());
      setDimensions({
        width: Dimensions.get("window").width,
        height: Dimensions.get("window").height,
      });
    };
    const subscription = Dimensions.addEventListener(
      "change",
      updateOrientation,
    );
    return () => {
      subscription?.remove();
    };
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <StatusBar hidden style="auto" />
        <Home isLandscape={isLandscape} dimensions={dimensions} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
