import { NextResponse } from "next/server";
import { approvePlan } from "@/modules/agent/orchestrator";
import { assertNoSecretsInValue } from "@/config/env";
import { assertPrivacySafeSchema } from "@/modules/plans/privacy";
import type { TripPlan } from "@/modules/plans/types";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      plan?: TripPlan;
      acknowledgement?: string;
    };
    if (!body.plan)
      return NextResponse.json(
        { error: "계획이 필요합니다." },
        { status: 400 },
      );
    assertPrivacySafeSchema(body.plan);
    const approved = approvePlan(body.plan, body.acknowledgement ?? "");
    assertNoSecretsInValue(approved);
    return NextResponse.json(approved);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "승인 처리 실패" },
      { status: 400 },
    );
  }
}
