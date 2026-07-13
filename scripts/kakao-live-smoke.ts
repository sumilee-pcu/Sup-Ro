import { spawnSync } from "node:child_process";

type CurlResult = {
  body: string;
  status: number;
};

function runCurl(config: string): CurlResult {
  const result = spawnSync("curl", ["--config", "-"], {
    input: config,
    encoding: "utf8",
    maxBuffer: 5 * 1024 * 1024,
  });

  if (result.error || result.status !== 0) {
    throw new Error(`curl 실행 실패: exit=${result.status ?? "unknown"}`);
  }

  const match = result.stdout.match(/\n(\d{3})\s*$/);
  if (!match?.index) throw new Error("curl HTTP 상태를 확인할 수 없습니다.");

  return {
    body: result.stdout.slice(0, match.index),
    status: Number(match[1]),
  };
}

function assertSafeKey(name: string, value: string | undefined): string {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(
      `.env.local의 ${name} 값이 없거나 형식이 올바르지 않습니다.`,
    );
  }
  return value;
}

function main(): void {
  const javascriptKey = assertSafeKey(
    "NEXT_PUBLIC_KAKAO_MAP_APP_KEY",
    process.env.NEXT_PUBLIC_KAKAO_MAP_APP_KEY,
  );
  const restApiKey = assertSafeKey(
    "KAKAO_REST_API_KEY",
    process.env.KAKAO_REST_API_KEY,
  );
  const referer = new URL(
    process.env.SUPRO_KAKAO_SDK_REFERER ?? "http://localhost:3000/",
  );
  if (!["http:", "https:"].includes(referer.protocol)) {
    throw new Error("SUPRO_KAKAO_SDK_REFERER는 HTTP(S) URL이어야 합니다.");
  }

  const sdkUrl = new URL("https://dapi.kakao.com/v2/maps/sdk.js");
  sdkUrl.searchParams.set("appkey", javascriptKey);
  sdkUrl.searchParams.set("autoload", "false");

  const sdk = runCurl(
    [
      "silent",
      "show-error",
      `url = "${sdkUrl.toString()}"`,
      `header = "Referer: ${referer.toString()}"`,
      'write-out = "\\n%{http_code}"',
    ].join("\n"),
  );

  if (sdk.status !== 200 || sdk.body.length < 1_000) {
    throw new Error(
      `Kakao Maps SDK 검증 실패: status=${sdk.status} bytes=${sdk.body.length}`,
    );
  }

  const local = runCurl(
    [
      "silent",
      "show-error",
      "get",
      'url = "https://dapi.kakao.com/v2/local/search/keyword.json"',
      `header = "Authorization: KakaoAK ${restApiKey}"`,
      'data-urlencode = "query=국립중앙과학관"',
      'data = "size=1"',
      'write-out = "\\n%{http_code}"',
    ].join("\n"),
  );
  const localPayload = JSON.parse(local.body) as {
    documents?: unknown[];
    errorType?: string;
  };

  if (local.status !== 200 || !localPayload.documents?.length) {
    throw new Error(
      `Kakao Local 검증 실패: status=${local.status} error=${localPayload.errorType ?? "unknown"}`,
    );
  }

  console.log(
    `SUPRO_KAKAO_LIVE_SMOKE_PASS sdk=${sdk.status} places=${localPayload.documents.length}`,
  );
}

try {
  main();
} catch (error: unknown) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
