import { Images } from "@lib/images";
import { Settings } from "@lib/setting";

type State = {
  images: Images[];
  setting: Settings;
  loading: {
    images: boolean;
    setting: boolean;
  };
};

type Action =
  | { type: "SET_IMAGES"; payload: Images[] }
  | { type: "SET_SETTING"; payload: Settings }
  | { type: "SET_LOADING"; payload: Partial<State["loading"]> };

export const initialHomeState: State = {
  images: [],
  setting: {
    autoPlay: false,
    autoPlayInterval: 3000,
    loop: false,
    mode: "parallax",
  },
  loading: {
    images: false,
    setting: false,
  },
};

export const homeReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_IMAGES":
      return { ...state, images: action.payload };
    case "SET_SETTING":
      return { ...state, setting: action.payload };
    case "SET_LOADING":
      return { ...state, loading: { ...state.loading, ...action.payload } };
    default:
      return state;
  }
};
