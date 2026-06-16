"use client";

import { useEffect } from "react";

const preferencesKey = "sib-app-preferences";

type Preferences = {
  theme?: "light" | "dark";
  language?: "pt-BR" | "en-US" | "es-ES";
  fontSize?: "small" | "medium" | "large";
};

export function readPreferences(): Required<Preferences> {
  if (typeof window === "undefined") return { theme: "light", language: "pt-BR", fontSize: "medium" };
  try {
    return { theme: "light", language: "pt-BR", fontSize: "medium", ...JSON.parse(window.localStorage.getItem(preferencesKey) || "{}") };
  } catch {
    return { theme: "light", language: "pt-BR", fontSize: "medium" };
  }
}

export function savePreferences(preferences: Preferences) {
  const next = { ...readPreferences(), ...preferences };
  window.localStorage.setItem(preferencesKey, JSON.stringify(next));
  applyPreferences(next);
  window.dispatchEvent(new CustomEvent("sib-preferences-change", { detail: next }));
  return next;
}

function applyPreferences(preferences: Required<Preferences>) {
  document.documentElement.dataset.theme = preferences.theme;
  document.documentElement.dataset.fontSize = preferences.fontSize;
  document.documentElement.lang = preferences.language;
}

export function AppPreferences() {
  useEffect(() => {
    applyPreferences(readPreferences());
  }, []);

  return null;
}
