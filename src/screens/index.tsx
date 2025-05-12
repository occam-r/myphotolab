import { initializeCacheDir } from "@utils/cache";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Home from "./Home";
import { useKeepAwake } from "expo-keep-awake";

export default function App() {
  useKeepAwake();

  useEffect(() => {
    const initApp = async () => {
      await initializeCacheDir();
    };
    initApp();
  }, []);

  return (
    <GestureHandlerRootView>
      <SafeAreaProvider>
        <SafeAreaView style={{ flex: 1 }}>
          <StatusBar hidden style="auto" />
          <Home />
        </SafeAreaView>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
