import React from "react";
import type {
  ImageSourcePropType,
  StyleProp,
  ViewProps,
  ViewStyle,
} from "react-native";
import Animated, { AnimatedProps } from "react-native-reanimated";
import { SlideItem } from "./SlideItem";

interface Props extends AnimatedProps<ViewProps> {
  style?: StyleProp<ViewStyle>;
  img?: ImageSourcePropType;
  rounded?: boolean;
}

export const SBItem: React.FC<Props> = (props) => {
  const { style, img, rounded = true, testID, ...animatedViewProps } = props;

  return (
    <Animated.View testID={testID} style={{ flex: 1 }} {...animatedViewProps}>
      <SlideItem rounded={rounded} source={img} />
    </Animated.View>
  );
};
