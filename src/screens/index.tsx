import { initializeCacheDir } from "@utils/cache";
import { getScreenOrientation } from "@utils/layout";
import { useKeepAwake } from "expo-keep-awake";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Dimensions, ScaledSize } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Home from "./Home";

export default function App() {
  useKeepAwake();

  const [dimensions, setDimensions] = useState<ScaledSize>(
    Dimensions.get("window"),
  );

  const isLandscape = useMemo(
    () => getScreenOrientation(dimensions),
    [dimensions],
  );

  useEffect(() => {
    initializeCacheDir().catch((error) =>
      console.error("Failed to initialize cache directory:", error),
    );
  }, []);

  const handleDimensionChange = useCallback(
    ({ window }: { window: ScaledSize }) => {
      setDimensions(window);
    },
    [],
  );

  useEffect(() => {
    const subscription = Dimensions.addEventListener(
      "change",
      handleDimensionChange,
    );

    return () => subscription.remove();
  }, [handleDimensionChange]);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <StatusBar hidden style="auto" />
        <Home isLandscape={isLandscape} dimensions={dimensions} />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
