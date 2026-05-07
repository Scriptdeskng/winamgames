type JsonValue = Record<string, unknown> | Array<unknown> | string | number | boolean | null;

const DEFAULT_BASE_URL = "http://localhost:8000/api/v1";

export function getWinamApiBaseUrl(): string {
  const raw = import.meta.env.VITE_WINAM_API_BASE_URL as string | undefined;
  return (raw && raw.trim()) || DEFAULT_BASE_URL;
}

function joinUrl(base: string, path: string): string {
  const trimmedBase = base.replace(/\/+$/, "");
  const trimmedPath = path.startsWith("/") ? path : `/${path}`;
  return `${trimmedBase}${trimmedPath}`;
}

async function parseErrorMessage(response: Response): Promise<string> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      const payload = (await response.json()) as { detail?: string; message?: string };
      return payload.detail || payload.message || response.statusText || "Request failed";
    } catch {
      return response.statusText || "Request failed";
    }
  }
  const text = await response.text();
  return text || response.statusText || "Request failed";
}

export async function winamApiGet<T>(path: string): Promise<T> {
  const response = await fetch(joinUrl(getWinamApiBaseUrl(), path), {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as T;
}

export async function winamApiPost<T>(path: string, body?: JsonValue): Promise<T> {
  const response = await fetch(joinUrl(getWinamApiBaseUrl(), path), {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!response.ok) {
    throw new Error(await parseErrorMessage(response));
  }
  return (await response.json()) as T;
}
