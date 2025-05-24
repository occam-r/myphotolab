interface Password {
  digits: string[];
  attempts: number;
  isLocked: boolean;
  lockoutEndTime: number | null;
  error: string | null;
}
export type { Password };
