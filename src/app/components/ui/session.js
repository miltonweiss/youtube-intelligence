import { useSyncExternalStore } from "react";

const listeners = new Map();

function subscribe(key, onStoreChange) {
  if (!listeners.has(key)) listeners.set(key, new Set());
  listeners.get(key).add(onStoreChange);
  return () => listeners.get(key).delete(onStoreChange);
}

function emit(key) {
  const set = listeners.get(key);
  if (!set) return;
  for (const listener of set) listener();
}

export function useSessionValue(key, fallback) {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(key, onStoreChange),
    () => sessionStorage.getItem(key) ?? fallback,
    () => fallback
  );
}

export function setSessionValue(key, value) {
  sessionStorage.setItem(key, value);
  emit(key);
}

const jsonCache = new Map();

export function useSessionJson(key, fallback) {
  return useSyncExternalStore(
    (onStoreChange) => subscribe(key, onStoreChange),
    () => {
      const raw = sessionStorage.getItem(key);
      const cached = jsonCache.get(key);
      if (cached && cached.raw === raw) return cached.value;
      let value = fallback;
      if (raw) {
        try {
          value = JSON.parse(raw);
        } catch {
          value = fallback;
        }
      }
      jsonCache.set(key, { raw, value });
      return value;
    },
    () => fallback
  );
}

export function setSessionJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
  jsonCache.set(key, { raw: JSON.stringify(value), value });
  emit(key);
}
