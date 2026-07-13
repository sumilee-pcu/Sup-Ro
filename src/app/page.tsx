import { PlanningWorkspace } from "@/components/planning-workspace";
import { createFixturePlan } from "@/modules/plans/fixture-plan";

export default function Home() {
  return <PlanningWorkspace initialPlan={createFixturePlan()} />;
}
