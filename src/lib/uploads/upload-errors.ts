export type UploadFailure = {
  message?: string | null;
  statusCode?: string | number | null;
};

export function uploadFailureFrom(error: unknown): UploadFailure {
  if (error instanceof Error) {
    const candidate = error as Error & { statusCode?: unknown };
    return {
      message: candidate.message || null,
      statusCode:
        typeof candidate.statusCode === "string" || typeof candidate.statusCode === "number"
          ? candidate.statusCode
          : null,
    };
  }
  if (error && typeof error === "object") {
    const candidate = error as Record<string, unknown>;
    return {
      message: typeof candidate.message === "string" ? candidate.message : null,
      statusCode:
        typeof candidate.statusCode === "string" || typeof candidate.statusCode === "number"
          ? candidate.statusCode
          : null,
    };
  }
  return { message: null, statusCode: null };
}

export function describeStorageError(error: UploadFailure): string {
  const status = String(error.statusCode ?? "");
  const message = (error.message ?? "").toLowerCase();
  const text = `${status} ${message}`;

  if (
    status === "403" ||
    message.includes("row-level security") ||
    message.includes("permission denied") ||
    message.includes("not authorized")
  ) {
    return "You do not have permission to upload images for this property.";
  }
  if (status === "404" || (message.includes("bucket") && message.includes("not found"))) {
    return "Image storage is not configured. Please contact support.";
  }
  if (
    status === "413" ||
    message.includes("too large") ||
    message.includes("size limit") ||
    message.includes("entity too large")
  ) {
    return "Images must be 5 MB or smaller.";
  }
  if (status === "409" || message.includes("already exists") || message.includes("duplicate")) {
    return "That image could not be uploaded because it already exists. Please retry.";
  }
  if (
    text.includes("network") ||
    message.includes("fetch failed") ||
    message.includes("timeout") ||
    message.includes("aborted")
  ) {
    return "Upload network error. Check your connection and try again.";
  }
  return "Upload failed. Please try again.";
}

export function logUploadError(area: string, error: unknown) {
  const failure = uploadFailureFrom(error);
  console.error(`[image-upload:${area}]`, {
    message: failure.message,
    statusCode: failure.statusCode,
  });
}

export function logUploadDiagnostics(area: string, details: Record<string, unknown>) {
  console.error(`[image-upload:${area}-diagnostics]`, details);
}
