import { Dimensions } from "react-native";

export const { width, height } = Dimensions.get("window");

export const getScreenOrientation = () => {
  const { width, height } = Dimensions.get("window");
  return width > height;
};
