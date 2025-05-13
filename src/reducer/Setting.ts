import { Settings } from "@lib/setting";

type State = {
  settings: Settings;
};

type Action =
  | { type: "INITIALIZE_SETTINGS"; payload: Settings }
  | { type: "TOGGLE_AUTO_PLAY" }
  | { type: "TOGGLE_LOOP" }
  | { type: "SET_INTERVAL"; payload: number }
  | { type: "SET_MODE"; payload: Settings["mode"] };

export const settingInitialState: State = {
  settings: {
    autoPlay: true,
    autoPlayInterval: 2000,
    loop: true,
    mode: "parallax",
    resizeMode: "cover",
  },
};

export const settingReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INITIALIZE_SETTINGS":
      return {
        ...state,
        settings: {
          autoPlay: action.payload.autoPlay,
          autoPlayInterval: action.payload.autoPlayInterval,
          loop: action.payload.loop,
          mode: action.payload.mode,
          resizeMode: action.payload.resizeMode,
        },
      };
    case "TOGGLE_AUTO_PLAY":
      return {
        ...state,
        settings: {
          ...state.settings,
          autoPlay: !state.settings.autoPlay,
        },
      };
    case "TOGGLE_LOOP":
      return {
        ...state,
        settings: {
          ...state.settings,
          loop: !state.settings.loop,
        },
      };
    case "SET_INTERVAL":
      return {
        ...state,
        settings: {
          ...state.settings,
          autoPlayInterval: action.payload,
        },
      };
    case "SET_MODE":
      return {
        ...state,
        settings: {
          ...state.settings,
          mode: action.payload,
        },
      };
    default:
      return state;
  }
};
