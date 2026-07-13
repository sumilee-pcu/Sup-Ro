import type { ProviderResult } from "@/modules/plans/types";

export interface CacheEntry<T> {
  value: ProviderResult<T>;
  expiresAt: string;
  policyAllowsReuse: boolean;
}

export function readCompatibleCache<T>(
  entry: CacheEntry<T> | undefined,
  now = new Date(),
): ProviderResult<T> | undefined {
  if (!entry?.policyAllowsReuse) return undefined;
  const stale = new Date(entry.expiresAt).getTime() <= now.getTime();
  return {
    ...entry.value,
    mode: "cache",
    warnings: [
      ...entry.value.warnings,
      stale
        ? "캐시가 만료되어 최신 사실로 사용할 수 없습니다. 공식 재확인이 필요합니다."
        : "공급자 정책 범위에서 재사용한 캐시 데이터입니다.",
    ],
  };
}

export async function withCompatibleFallback<T>(
  live: () => Promise<ProviderResult<T>>,
  options: {
    cache?: CacheEntry<T>;
    fixture?: () => Promise<ProviderResult<T>>;
    now?: Date;
  },
): Promise<ProviderResult<T>> {
  try {
    return await live();
  } catch (error) {
    const cached = readCompatibleCache(options.cache, options.now);
    if (cached)
      return {
        ...cached,
        warnings: [
          ...cached.warnings,
          `라이브 공급자 실패: ${safeError(error)}`,
        ],
      };
    if (options.fixture) {
      const fixture = await options.fixture();
      return {
        ...fixture,
        mode: "fixture",
        warnings: [
          ...fixture.warnings,
          `라이브 공급자 실패 후 명시적 fixture로 전환: ${safeError(error)}`,
        ],
      };
    }
    throw error;
  }
}

export async function withRetries<T>(
  operation: () => Promise<T>,
  options: { attempts: number; shouldRetry: (error: unknown) => boolean },
): Promise<T> {
  if (!Number.isInteger(options.attempts) || options.attempts < 1)
    throw new Error("재시도 횟수는 1 이상의 정수여야 합니다.");
  let lastError: unknown;
  for (let attempt = 1; attempt <= options.attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt === options.attempts || !options.shouldRetry(error))
        throw error;
    }
  }
  throw lastError;
}

function safeError(error: unknown): string {
  return error instanceof Error
    ? error.message
        .replace(/((?:key|token|secret)=)[^\s&]+/gi, "$1[삭제]")
        .slice(0, 160)
    : "알 수 없는 오류";
}
