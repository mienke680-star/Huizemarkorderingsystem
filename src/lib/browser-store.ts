// Tiny useSyncExternalStore-compatible store backed by localStorage or
// sessionStorage. Reading browser storage during render is unsafe (it
// differs between the server's render pass and the client's), and writing
// it from inside a plain useEffect trips the "no setState in an effect
// body" lint rule. useSyncExternalStore is the sanctioned way to bridge an
// external mutable source into React without either problem — this just
// adds the bit of glue localStorage/sessionStorage don't provide
// out of the box: an in-tab notify-on-write so subscribers re-render
// immediately (the native `storage` event only fires in *other* tabs).

export function createBrowserStore<T>(storage: "local" | "session", key: string, defaultValue: T) {
  let listeners: Array<() => void> = [];

  function read(): Storage | null {
    if (typeof window === "undefined") return null;
    return storage === "local" ? window.localStorage : window.sessionStorage;
  }

  function getSnapshot(): T {
    const store = read();
    if (!store) return defaultValue;
    const raw = store.getItem(key);
    if (raw === null) return defaultValue;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return defaultValue;
    }
  }

  function getServerSnapshot(): T {
    return defaultValue;
  }

  function subscribe(callback: () => void) {
    listeners.push(callback);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key) callback();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners = listeners.filter((l) => l !== callback);
      window.removeEventListener("storage", onStorage);
    };
  }

  function set(value: T) {
    const store = read();
    if (!store) return;
    store.setItem(key, JSON.stringify(value));
    for (const l of listeners) l();
  }

  return { getSnapshot, getServerSnapshot, subscribe, set };
}
