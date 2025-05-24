import { ImageResizeMode } from "react-native";

interface Settings {
  autoPlay: boolean;
  autoPlayInterval: number;
  loop: boolean;
  mode: "parallax" | "horizontal-stack" | "vertical-stack";
  resizeMode: ImageResizeMode;
  imageResetTimer: number;
}
export type { Settings };
