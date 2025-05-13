import React from "react";
import {
  ImageResizeMode,
  ImageSourcePropType,
  type ImageStyle,
  type StyleProp,
  StyleSheet,
  type ViewProps,
} from "react-native";
import type { AnimatedProps } from "react-native-reanimated";
import Animated from "react-native-reanimated";

interface Props extends AnimatedProps<ViewProps> {
  style?: StyleProp<ImageStyle>;
  rounded?: boolean;
  source?: ImageSourcePropType;
  resizeMode?: ImageResizeMode;
}

export const SlideItem: React.FC<Props> = (props) => {
  const {
    style,
    rounded = false,
    testID,
    resizeMode = "cover",
    ...animatedViewProps
  } = props;

  return (
    <Animated.View testID={testID} style={{ flex: 1 }} {...animatedViewProps}>
      <Animated.Image
        style={[style, styles.container, rounded && { borderRadius: 15 }]}
        source={props.source}
        resizeMode={resizeMode}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    height: "100%",
  },
});
