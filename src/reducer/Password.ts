import { Password } from "@lib/password";

type State = Password;

type Action =
  | { type: "INITIALIZE_PASSWORD"; payload: Password }
  | { type: "ADD_DIGIT"; payload: { digit: number } }
  | { type: "REMOVE_DIGIT" }
  | { type: "CLEAR_DIGITS" }
  | {
      type: "INCREMENT_ATTEMPTS";
      payload: { maxAttempts: number; lockoutDuration: number };
    }
  | { type: "RESET_LOCKOUT" }
  | { type: "SET_ERROR"; payload: { error: string | null } };

export const passwordInitialState: State = {
  digits: new Array(6).fill(""),
  attempts: 0,
  isLocked: false,
  lockoutEndTime: null,
  error: null,
};

export const passwordReducer = (state: State, action: Action): State => {
  switch (action.type) {
    case "INITIALIZE_PASSWORD":
      return {
        ...state,
        ...action.payload,
      };

    case "ADD_DIGIT":
      const newDigits = [...state.digits];
      const nextIndex = newDigits.findIndex((d) => !d);

      if (nextIndex !== -1) {
        newDigits[nextIndex] = action.payload.digit.toString();
      }

      return {
        ...state,
        digits: newDigits,
        error: null,
      };

    case "REMOVE_DIGIT":
      const removeDigits = [...state.digits];
      const lastIndex = removeDigits.map((d) => !!d).lastIndexOf(true);

      if (lastIndex !== -1) {
        removeDigits[lastIndex] = "";
      }

      return {
        ...state,
        digits: removeDigits,
        error: null,
      };

    case "CLEAR_DIGITS":
      return {
        ...state,
        digits: new Array(6).fill(""),
        error: null,
      };

    case "INCREMENT_ATTEMPTS":
      const newAttempts = state.attempts + 1;
      const shouldLockout = newAttempts >= action.payload.maxAttempts;
      const lockoutEndTime = shouldLockout
        ? Date.now() + action.payload.lockoutDuration
        : null;
      const errorMessage = shouldLockout
        ? `Too many attempts. Try again in ${action.payload.lockoutDuration / 1000} seconds.`
        : `Incorrect PIN. ${action.payload.maxAttempts - newAttempts} attempts remaining.`;

      return {
        ...state,
        attempts: newAttempts,
        isLocked: shouldLockout,
        lockoutEndTime,
        error: errorMessage,
        digits: new Array(6).fill(""),
      };

    case "RESET_LOCKOUT":
      return {
        ...state,
        isLocked: false,
        lockoutEndTime: null,
        error: null,
      };

    case "SET_ERROR":
      return {
        ...state,
        error: action.payload.error,
      };

    default:
      return state;
  }
};
