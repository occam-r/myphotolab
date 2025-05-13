import * as LocalAuthentication from "expo-local-authentication";
import { Alert } from "react-native";

export async function authenticateUser() {
  if (__DEV__) {
    return true;
  }
  const hasHardware = await LocalAuthentication.hasHardwareAsync();
  const supportedTypes =
    await LocalAuthentication.supportedAuthenticationTypesAsync();
  const isEnrolled = await LocalAuthentication.isEnrolledAsync();

  console.info("hasHardware", hasHardware, supportedTypes, isEnrolled);

  if (!hasHardware || !isEnrolled) {
    Alert.alert("Biometric auth not available");
    return false;
  }

  const result = await LocalAuthentication.authenticateAsync({
    promptMessage: "Please authenticate",
    fallbackLabel: "Use device PIN",
    disableDeviceFallback: false, // allows PIN fallback
  });

  if (result.success) {
    return true;
  } else {
    Alert.alert("Authentication failed");
    return false;
  }
}
