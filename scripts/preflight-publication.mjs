import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";

function git(args, encoding = "utf8") {
  return execFileSync("git", args, {
    encoding,
    stdio: ["ignore", "pipe", "pipe"],
  });
}

const failures = [];
const requiredFiles = [
  "README.md",
  "LICENSE.md",
  ".env.example",
  "docs/PUBLICATION_HANDOFF.md",
  "docs/VALIDATION.md",
];
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`필수 공개 파일 누락: ${file}`);
}

const staged = git(["diff", "--cached", "--name-only", "-z"], "buffer")
  .toString("utf8")
  .split("\0")
  .filter(Boolean);
if (staged.length === 0) failures.push("검사할 staged 파일이 없습니다.");

const forbiddenPaths = [
  /(^|\/)node_modules\//,
  /(^|\/)\.next\//,
  /(^|\/)\.data\//,
  /\.sqlite(?:-wal|-shm)?$/,
  /(^|\/)reports\/generated\//,
  /(^|\/)\.env(?:\.|$)/,
];

const secretPatterns = [
  { label: "GitHub token", pattern: /gh[pousr]_[A-Za-z0-9_]{30,}/g },
  { label: "OpenAI key", pattern: /sk-(?:proj-)?[A-Za-z0-9_-]{20,}/g },
  { label: "AWS key", pattern: /AKIA[0-9A-Z]{16}/g },
  {
    label: "private key",
    pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g,
  },
  {
    label: "assigned secret",
    pattern:
      /(?:API_KEY|TOKEN|SECRET|PASSWORD)\s*[=:]\s*["']?[A-Za-z0-9_\/+.-]{12,}/gi,
  },
];
const privateMachinePatterns = [
  /\/Users\/[A-Za-z0-9._-]+\//g,
  /GA403[A-Z0-9-]*/gi,
  /Zephyrus\s+G14/gi,
  /RTX\s*5070/gi,
];

for (const path of staged) {
  if (forbiddenPaths.some((pattern) => pattern.test(path))) {
    if (path !== ".env.example")
      failures.push(`공개 금지 경로가 staged 상태입니다: ${path}`);
    continue;
  }
  let content;
  try {
    content = git(["show", `:${path}`], "buffer");
  } catch {
    continue;
  }
  if (content.includes(0)) continue;
  const text = content.toString("utf8");
  for (const { label, pattern } of secretPatterns) {
    pattern.lastIndex = 0;
    if (pattern.test(text)) failures.push(`${path}: ${label} 형태 감지`);
  }
  if (path !== "scripts/preflight-publication.mjs") {
    for (const pattern of privateMachinePatterns) {
      pattern.lastIndex = 0;
      if (pattern.test(text))
        failures.push(`${path}: 개인 장비·절대경로 형태 감지`);
    }
  }
}

const remotes = git(["remote"]).trim();
if (remotes) failures.push(`GitHub 승인 전 remote가 존재합니다: ${remotes}`);

if (failures.length > 0) {
  console.error(failures.map((item) => `- ${item}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `SUEOPRO_PUBLICATION_PREFLIGHT_PASS staged=${staged.length} remote=0`,
  );
}
