import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

export async function authenticateUser(): Promise<boolean> {
  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Please authenticate",
    fallbackLabel: "Use device PIN",
    disableDeviceFallback: false,
  });

  if (result.success) {
    return true;
  } else {
    Alert.alert("Authentication failed");
    return false;
  }
}

export async function isAuthAvaiable(): Promise<boolean> {
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  if (!hasHardware || !isEnrolled) {
    return false;
  }

  return true;
}
