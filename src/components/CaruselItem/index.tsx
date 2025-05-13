import * as React from "react";
import { ImageResizeMode, ImageSourcePropType, View } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
} from "react-native-reanimated";
import { SBItem } from "./SBItem";

interface ItemProps {
  index: number;
  animationValue: Animated.SharedValue<number>;
  img: ImageSourcePropType;
  resizeMode?: ImageResizeMode;
}

const CaruselItem: React.FC<ItemProps> = ({
  index,
  animationValue,
  img,
  resizeMode,
}) => {
  const maskStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      animationValue.value,
      [-1, 0, 1],
      ["#000000dd", "transparent", "#000000dd"],
    );

    return {
      backgroundColor,
    };
  }, [animationValue]);

  return (
    <View style={{ flex: 1 }}>
      <SBItem
        key={index}
        rounded={true}
        img={img}
        style={{ borderRadius: 0 }}
        resizeMode={resizeMode}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
          },
          maskStyle,
        ]}
      />
    </View>
  );
};

export default React.memo(CaruselItem);
