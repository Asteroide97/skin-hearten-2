import "server-only";

import { resolveFallbackRoutine, type RoutineResolveData, type RoutineSource } from "@/lib/routines";

type RoutinesApiFailureReason = "api_url_missing" | "fetch_failed" | "invalid_response";

type RoutinesApiSuccess<TData> = {
  ok: true;
  data: TData;
};

type RoutinesApiFailure = {
  ok: false;
  reason: RoutinesApiFailureReason;
  message?: string;
  status?: number;
};

export type RoutinesApiResult<TData> = RoutinesApiSuccess<TData> | RoutinesApiFailure;

function getApiBaseUrl() {
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();
  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/$/, "");
}

export async function resolveRoutineForStorefront(params: {
  productRef: string;
  goal?: string | null;
  category?: string | null;
  source?: RoutineSource;
}): Promise<RoutinesApiResult<RoutineResolveData>> {
  const apiBaseUrl = getApiBaseUrl();
  const fallbackData = resolveFallbackRoutine(params);

  if (!apiBaseUrl) {
    return {
      ok: true,
      data: fallbackData,
    };
  }

  const query = new URLSearchParams({
    product: params.productRef,
    source: params.source ?? "product",
  });
  if (params.goal?.trim()) {
    query.set("goal", params.goal.trim());
  }
  if (params.category?.trim()) {
    query.set("category", params.category.trim());
  }

  try {
    const response = await fetch(`${apiBaseUrl}/routines/resolve?${query.toString()}`, {
      cache: "no-store",
    });

    if (!response.ok) {
      return {
        ok: true,
        data: fallbackData,
      };
    }

    const data = (await response.json()) as Partial<RoutineResolveData> & {
      routine?: RoutineResolveData["routine"];
      matchedBy?: string | null;
    };

    return {
      ok: true,
      data: {
        routine: data.routine ?? fallbackData.routine,
        matchedBy: data.matchedBy ?? fallbackData.matchedBy,
      },
    };
  } catch {
    return {
      ok: true,
      data: fallbackData,
    };
  }
}
