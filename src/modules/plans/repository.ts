import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type { DocumentArtifact, PlanApproval, TripPlan } from "./types";

const migrationSql = `
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  current_version INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS plan_versions (
  plan_id TEXT NOT NULL,
  version INTEGER NOT NULL,
  state TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  PRIMARY KEY (plan_id, version),
  FOREIGN KEY (plan_id) REFERENCES plans(id)
);
CREATE TABLE IF NOT EXISTS evidence (
  plan_id TEXT NOT NULL,
  plan_version INTEGER NOT NULL,
  evidence_id TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (plan_id, plan_version, evidence_id)
);
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  plan_version INTEGER NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  plan_version INTEGER NOT NULL,
  payload_json TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS artifacts (
  id TEXT PRIMARY KEY,
  plan_id TEXT NOT NULL,
  plan_version INTEGER NOT NULL,
  type TEXT NOT NULL,
  payload_json TEXT NOT NULL
);
`;

export class PlanRepository {
  readonly database: DatabaseSync;

  constructor(databasePath = ":memory:") {
    if (databasePath !== ":memory:")
      mkdirSync(dirname(databasePath), { recursive: true });
    this.database = new DatabaseSync(databasePath);
    this.database.exec("PRAGMA foreign_keys = ON;");
    this.database.exec(migrationSql);
  }

  saveVersion(plan: TripPlan): void {
    const transaction = this.database.prepare(
      "INSERT OR REPLACE INTO plans (id, title, current_version, created_at, updated_at) VALUES (?, ?, ?, ?, ?)",
    );
    transaction.run(
      plan.id,
      plan.title,
      plan.version,
      plan.createdAt,
      plan.updatedAt,
    );
    this.database
      .prepare(
        "INSERT INTO plan_versions (plan_id, version, state, snapshot_json, created_at) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        plan.id,
        plan.version,
        plan.state,
        JSON.stringify(plan),
        plan.updatedAt,
      );
    const evidenceStatement = this.database.prepare(
      "INSERT INTO evidence (plan_id, plan_version, evidence_id, payload_json) VALUES (?, ?, ?, ?)",
    );
    for (const evidence of plan.evidence)
      evidenceStatement.run(
        plan.id,
        plan.version,
        evidence.id,
        JSON.stringify(evidence),
      );
    const runStatement = this.database.prepare(
      "INSERT OR IGNORE INTO agent_runs (id, plan_id, plan_version, payload_json) VALUES (?, ?, ?, ?)",
    );
    for (const run of plan.runs)
      runStatement.run(run.id, plan.id, plan.version, JSON.stringify(run));
  }

  getVersion(planId: string, version: number): TripPlan | undefined {
    const row = this.database
      .prepare(
        "SELECT snapshot_json FROM plan_versions WHERE plan_id = ? AND version = ?",
      )
      .get(planId, version) as { snapshot_json: string } | undefined;
    return row ? (JSON.parse(row.snapshot_json) as TripPlan) : undefined;
  }

  listVersions(planId: string): number[] {
    const rows = this.database
      .prepare(
        "SELECT version FROM plan_versions WHERE plan_id = ? ORDER BY version",
      )
      .all(planId) as Array<{ version: number }>;
    return rows.map((row) => row.version);
  }

  saveApproval(approval: PlanApproval): void {
    this.database
      .prepare(
        "INSERT INTO approvals (id, plan_id, plan_version, payload_json) VALUES (?, ?, ?, ?)",
      )
      .run(
        approval.id,
        approval.planId,
        approval.planVersion,
        JSON.stringify(approval),
      );
  }

  saveArtifact(artifact: DocumentArtifact): void {
    this.database
      .prepare(
        "INSERT INTO artifacts (id, plan_id, plan_version, type, payload_json) VALUES (?, ?, ?, ?, ?)",
      )
      .run(
        artifact.id,
        artifact.planId,
        artifact.planVersion,
        artifact.type,
        JSON.stringify(artifact),
      );
  }

  close(): void {
    this.database.close();
  }
}
