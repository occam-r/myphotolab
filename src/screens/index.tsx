import { initializeCacheDir } from "@utils/cache";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Home from "./Home";
import { useKeepAwake } from "expo-keep-awake";
import { Dimensions } from "react-native";
import { getScreenOrientation } from "@utils/layout";

export default function App() {
  useKeepAwake();

  const [isLandscape, setIsLandscape] = useState<boolean>(
    getScreenOrientation(),
  );

  useEffect(() => {
    const initApp = async () => {
      await initializeCacheDir();
    };
    initApp();
  }, []);

  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(getScreenOrientation());
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
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar hidden style="auto" />
          <Home isLandscape={isLandscape} />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
