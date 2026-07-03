import "server-only";

import { requestAdminJson } from "@/lib/admin-api-client";
import type { AdminRoutineWriteInput, Routine } from "@/lib/routines";

export async function listAdminRoutines() {
  return requestAdminJson<Routine[]>("/admin/routines");
}

export async function getAdminRoutine(routineId: number) {
  return requestAdminJson<Routine>(`/admin/routines/${routineId}`);
}

export async function createAdminRoutine(payload: AdminRoutineWriteInput) {
  return requestAdminJson<Routine>("/admin/routines", {
    body: payload,
    method: "POST",
  });
}

export async function updateAdminRoutine(routineId: number, payload: AdminRoutineWriteInput) {
  return requestAdminJson<Routine>(`/admin/routines/${routineId}`, {
    body: payload,
    method: "PUT",
  });
}

export async function deleteAdminRoutine(routineId: number) {
  return requestAdminJson<{ message: string }>(`/admin/routines/${routineId}`, {
    method: "DELETE",
  });
}

export async function duplicateAdminRoutine(routineId: number) {
  return requestAdminJson<Routine>(`/admin/routines/${routineId}/duplicate`, {
    method: "POST",
  });
}
