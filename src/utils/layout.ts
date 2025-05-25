import { Dimensions, ScaledSize } from "react-native";

// Export initial dimensions but don't rely on these values for calculations
// that need to respond to dimension changes
export const initialDimensions = Dimensions.get("window");
export const { width, height } = initialDimensions;

/**
 * Determines if the screen is in landscape orientation
 * @param {ScaledSize} dimensions - Optional dimensions object to avoid redundant calls
 * @returns {boolean} true if in landscape orientation
 */
export const getScreenOrientation = (dimensions?: ScaledSize): boolean => {
  const { width, height } = dimensions || Dimensions.get("window");
  return width > height;
};
