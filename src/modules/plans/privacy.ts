const sensitivePatterns = [
  { label: "전화번호", pattern: /01[016789][-\s]?\d{3,4}[-\s]?\d{4}/g },
  { label: "주민등록번호 형태", pattern: /\b\d{6}[-\s]?[1-4]\d{6}\b/g },
  { label: "이메일", pattern: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi },
  {
    label: "학생 이름 표기",
    pattern: /(?:학생|아동)\s*(?:이름|성명)?\s*[:：]\s*[가-힣]{2,4}/g,
  },
  {
    label: "진단·질환 세부정보",
    pattern: /(?:진단명|질환명|장애명)\s*[:：]\s*[^,\n]{2,30}/g,
  },
];

export function findSensitiveText(value: string): string[] {
  return sensitivePatterns
    .filter(({ pattern }) => {
      pattern.lastIndex = 0;
      return pattern.test(value);
    })
    .map(({ label }) => label);
}

export function redactSensitiveText(value: string): string {
  return sensitivePatterns.reduce((text, { label, pattern }) => {
    pattern.lastIndex = 0;
    return text.replace(pattern, `[${label} 삭제]`);
  }, value);
}

export function assertPrivacySafeSchema(value: unknown): void {
  const forbiddenKeys = [
    "studentName",
    "studentContact",
    "health",
    "diagnosis",
    "guardianContact",
    "continuousLocation",
  ];
  const serialized = JSON.stringify(value);
  for (const key of forbiddenKeys) {
    if (serialized.includes(`\"${key}\"`))
      throw new Error(`금지된 학생 개인정보 필드가 감지되었습니다: ${key}`);
  }
}
