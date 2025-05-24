import * as SecureStore from "expo-secure-store";

export async function save(
  key: typeof SECURE_KEY,
  value: string,
): Promise<void> {
  await SecureStore.setItemAsync(key, value);
}

export async function getValueFor(
  key: typeof SECURE_KEY,
): Promise<string | null> {
  return await SecureStore.getItemAsync(key);
}

export async function deleteValueFor(key: typeof SECURE_KEY): Promise<void> {
  await SecureStore.deleteItemAsync(key);
}

export const SECURE_KEY = "photo_lab_pin";
