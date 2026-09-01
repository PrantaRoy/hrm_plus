import { ParticipantConflictDto } from "@hrm-plus/shared";

interface ApiErrorShape {
  response?: { data?: { error?: { message?: string; code?: string; details?: unknown } } };
}

function errorBody(err: unknown): { message?: string; code?: string; details?: unknown } | undefined {
  return (err as ApiErrorShape)?.response?.data?.error;
}

export function apiErrorMessage(err: unknown, fallback: string): string {
  return errorBody(err)?.message ?? fallback;
}

export function apiErrorCode(err: unknown): string | undefined {
  return errorBody(err)?.code;
}

// The meeting confirm/create endpoints attach the per-participant conflict list to
// error.details.conflicts when a booking is blocked or has unacknowledged warnings.
export function apiErrorConflicts(err: unknown): ParticipantConflictDto[] | undefined {
  const details = errorBody(err)?.details as { conflicts?: ParticipantConflictDto[] } | undefined;
  return details?.conflicts;
}
