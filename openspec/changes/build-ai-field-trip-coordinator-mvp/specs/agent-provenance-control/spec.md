## ADDED Requirements

### Requirement: Allowlisted structured tools

The agent SHALL call only server-registered tools with schema-validated arguments and results.

#### Scenario: Unknown tool requested

- **WHEN** a model attempts to invoke an unregistered tool or passes invalid arguments
- **THEN** the orchestrator rejects the call, records the failure, and does not execute external code or requests

### Requirement: Evidence for external facts

The system SHALL associate every external place, route, schedule, price, weather, safety, and accessibility claim with source evidence or an explicit unverified status.

#### Scenario: Render factual recommendation

- **WHEN** the agent recommends a venue based on its operating time and admission price
- **THEN** the rendered recommendation includes evidence references for both facts or labels either fact unverified

### Requirement: Truthful tool failure reporting

The agent SHALL NOT summarize a failed or partial tool call as a successful retrieval.

#### Scenario: Weather provider timeout

- **WHEN** the weather tool times out
- **THEN** the plan records the timeout, omits unsupported weather claims, and creates a follow-up confirmation item

### Requirement: Human approval control

The agent SHALL NOT set APPROVED status, make reservations, process payments, or send plans to external recipients.

#### Scenario: User asks agent to finalize automatically

- **WHEN** a user asks the agent to approve and send a plan without review
- **THEN** the agent explains the approval boundary and leaves the plan awaiting explicit user action

### Requirement: Auditable agent runs

The system SHALL record each agent run with plan version, workflow stage, tool name, status, latency, data mode, validation summary, and sanitized error details.

#### Scenario: Reproduce a sample run

- **WHEN** an administrator opens a completed fixture run
- **THEN** the system displays the ordered workflow stages and tool outcomes without exposing API keys or unnecessary personal data

### Requirement: Untrusted external content isolation

The system SHALL treat provider descriptions, web text, and user-entered notes as untrusted data and SHALL NOT allow them to override system rules or tool permissions.

#### Scenario: Prompt-like text in venue description

- **WHEN** a venue description contains instructions to ignore system rules or call another tool
- **THEN** the content remains quoted data and does not change orchestration or permissions
