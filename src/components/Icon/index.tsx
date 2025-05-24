import * as Icons from "@expo/vector-icons";
import colors from "@utils/colors";
import React, { memo } from "react";
import { TextProps } from "react-native";

export type IconType = keyof typeof Icons;

const DEFAULT_NAME = "add";
const DEFAULT_TYPE = "Ionicons";
const DEFAULT_SIZE = 25;
const DEFAULT_COLOR = colors.text;

interface IconProps extends TextProps {
  name?: string;
  type?: IconType;
  size?: number;
  color?: string;
}

const Icon = ({
  name = DEFAULT_NAME,
  type = DEFAULT_TYPE,
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...other
}: IconProps) => {
  const Component = Icons[type];

  if (!Component) {
    console.warn(`Invalid icon type: ${type}`);
    return <></>;
  }

  return <Component {...other} name={name} size={size} color={color} />;
};

export default memo(Icon);
