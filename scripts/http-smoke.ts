import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { setTimeout as delay } from "node:timers/promises";

type PackageManagerCommand = {
  command: string;
  prefix: string[];
};

function resolves(command: string, prefix: string[]): boolean {
  const result = spawnSync(command, [...prefix, "--version"], {
    stdio: "ignore",
  });
  return !result.error && result.status === 0;
}

function resolvePackageManager(): PackageManagerCommand {
  const npmExecPath = process.env.npm_execpath;
  if (npmExecPath) {
    return { command: process.execPath, prefix: [npmExecPath] };
  }

  const candidates: PackageManagerCommand[] =
    process.platform === "win32"
      ? [
          { command: "pnpm.cmd", prefix: [] },
          { command: "corepack.cmd", prefix: ["pnpm"] },
        ]
      : [
          { command: "pnpm", prefix: [] },
          { command: "corepack", prefix: ["pnpm"] },
        ];

  const selected = candidates.find(({ command, prefix }) =>
    resolves(command, prefix),
  );
  if (!selected) {
    throw new Error("pnpm 또는 corepack pnpm 실행 경로를 찾을 수 없습니다.");
  }
  return selected;
}

async function stopProcessTree(child: ChildProcess): Promise<void> {
  if (!child.pid || child.exitCode !== null) return;

  if (process.platform === "win32") {
    spawnSync("taskkill.exe", ["/PID", String(child.pid), "/T", "/F"], {
      stdio: "ignore",
    });
    return;
  }

  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(5_000)]);
  if (child.exitCode === null) child.kill("SIGKILL");
}

async function main(): Promise<void> {
  const port = Number(process.env.SUPRO_HTTP_SMOKE_PORT ?? "3210");
  if (!Number.isInteger(port) || port < 1024 || port > 65_535) {
    throw new Error("SUPRO_HTTP_SMOKE_PORT는 1024~65535 정수여야 합니다.");
  }

  const { command, prefix } = resolvePackageManager();
  const child = spawn(
    command,
    [...prefix, "exec", "next", "start", "-p", String(port)],
    {
      env: {
        ...process.env,
        KAKAO_MOBILITY_REST_API_KEY: "",
        KAKAO_REST_API_KEY: "",
        NEXT_PUBLIC_KAKAO_MAP_APP_KEY: "",
        OPENAI_API_KEY: "",
        SUPRO_DATA_MODE: "fixture",
      },
      stdio: ["ignore", "pipe", "pipe"],
    },
  );

  let logs = "";
  const capture = (chunk: Buffer): void => {
    logs = `${logs}${chunk.toString("utf8")}`.slice(-4_000);
  };
  child.stdout?.on("data", capture);
  child.stderr?.on("data", capture);

  try {
    const deadline = Date.now() + 60_000;
    let response: Response | undefined;

    while (Date.now() < deadline) {
      if (child.exitCode !== null) {
        throw new Error(`Next 서버가 조기 종료했습니다.\n${logs}`);
      }
      try {
        const candidate = await fetch(`http://127.0.0.1:${port}`, {
          signal: AbortSignal.timeout(2_000),
        });
        if (candidate.ok) {
          response = candidate;
          break;
        }
      } catch {
        await delay(500);
      }
    }

    if (!response)
      throw new Error("60초 안에 로컬 HTTP 서버가 준비되지 않았습니다.");
    const html = await response.text();
    if (
      !html.includes("수업로 AI") ||
      !html.includes("FIXTURE v1") ||
      !html.includes("추천 후보 비교·선택") ||
      !html.includes("학교 신청서 초안")
    ) {
      throw new Error(
        "HTTP 응답에서 후보 선택·학교 초안이 포함된 Sup-Ro fixture 화면 표식을 찾지 못했습니다.",
      );
    }

    console.log(
      `SUPRO_HTTP_SMOKE_PASS platform=${process.platform} http=${response.status} fixture=true candidates=true schoolDraft=true`,
    );
  } finally {
    await stopProcessTree(child);
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
