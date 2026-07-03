"use client";

import { useEffect, useState } from "react";

import {
  SKIN_QUIZ_STORAGE_UPDATED_EVENT,
  readStoredSkinQuizResult,
  type SkinQuizResult,
} from "@/lib/skin-quiz";

export function useStoredSkinQuizResult() {
  const [result, setResult] = useState<SkinQuizResult | null>(null);

  useEffect(() => {
    const syncResult = () => {
      setResult(readStoredSkinQuizResult());
    };

    syncResult();

    window.addEventListener("storage", syncResult);
    window.addEventListener(SKIN_QUIZ_STORAGE_UPDATED_EVENT, syncResult);

    return () => {
      window.removeEventListener("storage", syncResult);
      window.removeEventListener(SKIN_QUIZ_STORAGE_UPDATED_EVENT, syncResult);
    };
  }, []);

  return result;
}
