export interface ToolDefinition<TArgs, TResult> {
  description: string;
  argumentSchema: Record<string, unknown>;
  resultSchema: Record<string, unknown>;
  validateArguments: (value: unknown) => value is TArgs;
  validateResult: (value: unknown) => value is TResult;
  execute: (args: TArgs) => Promise<TResult>;
}

export class AllowlistedToolRegistry {
  private readonly tools = new Map<string, ToolDefinition<unknown, unknown>>();

  register<TArgs, TResult>(
    name: string,
    definition: ToolDefinition<TArgs, TResult>,
  ): void {
    if (!/^[a-z][a-z0-9._-]+$/.test(name))
      throw new Error("도구 이름은 제한된 소문자 식별자여야 합니다.");
    this.tools.set(name, definition as ToolDefinition<unknown, unknown>);
  }

  list(): string[] {
    return [...this.tools.keys()].sort();
  }

  async invoke(name: string, args: unknown): Promise<unknown> {
    const tool = this.tools.get(name);
    if (!tool) throw new Error(`허용되지 않은 도구입니다: ${name}`);
    if (!tool.validateArguments(args))
      throw new Error(`${name} 도구 인자가 JSON 계약과 일치하지 않습니다.`);
    const result = await tool.execute(args);
    if (!tool.validateResult(result))
      throw new Error(`${name} 도구 결과가 JSON 계약과 일치하지 않습니다.`);
    return result;
  }
}

const promptPatterns = [
  /ignore\s+(all\s+)?previous/gi,
  /system\s*prompt/gi,
  /도구\s*권한/gi,
  /이전\s*지시.*무시/gi,
];

export function sanitizeUntrustedText(value: string): string {
  return promptPatterns
    .reduce(
      (text, pattern) => text.replace(pattern, "[차단된 지시문형 텍스트]"),
      value,
    )
    .slice(0, 2000);
}

export const forbiddenExternalActions = [
  "reservation",
  "payment",
  "message",
  "shell",
  "arbitrary-network",
  "approval-state",
] as const;

export function assertSafeModelProposal(value: unknown): void {
  const serialized = JSON.stringify(value).toLowerCase();
  for (const action of forbiddenExternalActions) {
    if (serialized.includes(`\"action\":\"${action}\"`))
      throw new Error(`모델은 ${action} 작업을 실행할 수 없습니다.`);
  }
}
