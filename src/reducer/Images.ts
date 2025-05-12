import { Images } from "@lib/images";
import { OrderChangeParams } from "react-native-sortables";

export type shadowHeroType = Record<string, boolean>;

type State = {
  sectionImages: Images[];
  orderChanged: OrderChangeParams | undefined;
};

type Action =
  | {
      type: "SET_MODAL_DATA";
      payload: {
        sectionImages: Images[];
      };
    }
  | { type: "DELETE_IMAGE"; payload: string }
  | { type: "UPDATE_ORDER"; payload: OrderChangeParams };

export const imageInitialState: State = {
  sectionImages: [],
  orderChanged: undefined,
};

export const imageReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "SET_MODAL_DATA": {
      const { sectionImages } = action.payload;
      return {
        ...state,
        sectionImages,
      };
    }
    case "DELETE_IMAGE": {
      return {
        ...state,
        sectionImages: state.sectionImages.filter(
          (item) => item.id !== action.payload,
        ),
      };
    }
    case "UPDATE_ORDER":
      return {
        ...state,
        orderChanged: action.payload,
      };
    default:
      return state;
  }
};
