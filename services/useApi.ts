type ApiResult<T> = { data: T | null; error: string | null; ms: number };

export async function api<T>(name: string, call: () => Promise<{ data: T; error: any }>): Promise<ApiResult<T>> {
  const s = performance.now();
  try {
    const { data, error } = await call();
    const ms = Math.round(performance.now() - s);
    if (error) return { data: null, error: String(error.message ?? error), ms };
    return { data, error: null, ms };
  } catch (e: any) {
    const ms = Math.round(performance.now() - s);
    return { data: null, error: String(e?.message ?? e), ms };
  }
}