import type { DataMode } from "@/modules/plans/types";

const serverSecretNames = [
  "KAKAO_REST_API_KEY",
  "KAKAO_MOBILITY_REST_API_KEY",
  "OPENAI_API_KEY",
] as const;

export interface PublicConfig {
  kakaoMapAppKey?: string;
}

export interface ServerConfig {
  dataMode: DataMode;
  databasePath: string;
  secrets: Partial<Record<(typeof serverSecretNames)[number], string>>;
}

export function getPublicConfig(
  env: NodeJS.ProcessEnv = process.env,
): PublicConfig {
  return { kakaoMapAppKey: env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY || undefined };
}

export function getServerConfig(
  env: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const mode = env.SUEOPRO_DATA_MODE ?? "fixture";
  if (!(["live", "cache", "fixture"] as string[]).includes(mode)) {
    throw new Error(
      "SUEOPRO_DATA_MODE는 live, cache, fixture 중 하나여야 합니다.",
    );
  }

  const secrets: ServerConfig["secrets"] = {};
  for (const name of serverSecretNames) {
    if (env[name]) secrets[name] = env[name];
  }

  if (mode === "live" && !secrets.KAKAO_REST_API_KEY) {
    throw new Error(
      "라이브 모드에는 서버 전용 KAKAO_REST_API_KEY가 필요합니다.",
    );
  }

  return {
    dataMode: mode as DataMode,
    databasePath: env.SUEOPRO_DATABASE_PATH ?? ".data/sueop-ro.sqlite",
    secrets,
  };
}

export function assertNoSecretsInValue(
  value: unknown,
  env: NodeJS.ProcessEnv = process.env,
): void {
  const serialized = JSON.stringify(value);
  for (const name of serverSecretNames) {
    const secret = env[name];
    if (secret && serialized.includes(secret))
      throw new Error(`${name} 비밀값 노출이 감지되었습니다.`);
  }
}
