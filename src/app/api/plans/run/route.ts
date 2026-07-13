import { NextResponse } from "next/server";
import { createFixturePlan } from "@/modules/plans/fixture-plan";
import { assertNoSecretsInValue } from "@/config/env";

export async function POST() {
  const plan = createFixturePlan();
  assertNoSecretsInValue(plan);
  return NextResponse.json(plan, { headers: { "Cache-Control": "no-store" } });
}
