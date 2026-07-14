import { NextResponse } from "next/server";
import { renderDocument, toPrintHtml } from "@/modules/documents/render";
import type { DocumentArtifact, TripPlan } from "@/modules/plans/types";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    plan: TripPlan;
    type: DocumentArtifact["type"];
    format?: "markdown" | "html";
  };
  if (
    !body.plan ||
    !(
      [
        "teacher-plan",
        "student-worksheet",
        "parent-notice",
        "school-application-draft",
      ] as string[]
    ).includes(body.type)
  )
    return NextResponse.json(
      { error: "문서 요청 형식이 올바르지 않습니다." },
      { status: 400 },
    );
  const artifact = renderDocument(body.plan, body.type);
  if (body.format === "html")
    return new NextResponse(toPrintHtml(artifact), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  return new NextResponse(artifact.markdown, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${artifact.id}.md"`,
    },
  });
}
