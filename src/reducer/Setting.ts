import { Settings } from "@lib/setting";

type State = Settings;

type Action =
  | { type: "INITIALIZE_SETTINGS"; payload: Settings }
  | { type: "TOGGLE_AUTO_PLAY" }
  | { type: "TOGGLE_LOOP" }
  | { type: "SET_INTERVAL"; payload: number }
  | { type: "SET_MODE"; payload: Settings["mode"] }
  | { type: "SET_RESIZE_MODE"; payload: Settings["resizeMode"] }
  | { type: "SET_IMAGE_RESET_TIMER"; payload: number };

export const settingInitialState: State = {
  autoPlay: true,
  autoPlayInterval: 1000,
  loop: true,
  mode: "parallax",
  resizeMode: "cover",
  imageResetTimer: 30000,
};

export const settingReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INITIALIZE_SETTINGS":
      return {
        ...state,
        ...action.payload,
      };
    case "TOGGLE_AUTO_PLAY":
      return {
        ...state,
        autoPlay: !state.autoPlay,
      };
    case "TOGGLE_LOOP":
      return {
        ...state,
        loop: !state.loop,
      };
    case "SET_INTERVAL":
      return {
        ...state,
        autoPlayInterval: action.payload,
      };
    case "SET_MODE":
      return {
        ...state,
        mode: action.payload,
      };
    case "SET_RESIZE_MODE":
      return {
        ...state,
        resizeMode: action.payload,
      };
    case "SET_IMAGE_RESET_TIMER":
      return {
        ...state,
        imageResetTimer: action.payload,
      };
    default:
      return state;
  }
};
