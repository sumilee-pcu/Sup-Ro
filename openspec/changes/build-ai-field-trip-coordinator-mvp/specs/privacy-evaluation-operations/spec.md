## ADDED Requirements

### Requirement: Aggregate-only participant data

The MVP SHALL store participant counts and aggregate planning needs and SHALL NOT define fields for student names, contact details, health records, or disability diagnoses.

#### Scenario: User enters a student name in notes

- **WHEN** a user attempts to save text that appears to contain unnecessary student-identifying information
- **THEN** the system warns the user and offers to remove or generalize the text before saving

### Requirement: No continuous location tracking

The MVP SHALL use a user-selected origin and SHALL NOT request continuous device location or store movement history.

#### Scenario: Create plan origin

- **WHEN** a user starts a plan
- **THEN** the user searches or enters an origin without granting background location permission

### Requirement: Server-side secret protection

The system SHALL keep map server keys, public-data keys, and model credentials out of browser bundles, exported documents, client-visible errors, and sanitized logs.

#### Scenario: Provider request fails

- **WHEN** an external API returns an authentication error
- **THEN** the client receives a generic provider configuration error and no credential value

### Requirement: Deterministic fixture operation

The system SHALL provide a versioned fixture mode that completes the representative end-to-end demo without external API keys or network access.

#### Scenario: Offline classroom demo

- **WHEN** the operator enables fixture mode and starts the representative ecology plan
- **THEN** the system completes place discovery, routing, validation, approval, and document preview with visible fixture labeling

### Requirement: Quality evaluation metrics

The system SHALL calculate input completeness, hard-constraint satisfaction, source coverage, tool success, latency, unresolved facts, and human edits for each completed planning run.

#### Scenario: Evaluate failed route case

- **WHEN** a route provider failure leaves one leg unresolved
- **THEN** the evaluation records the failed tool call, reduced constraint satisfaction, and non-approval-ready outcome

### Requirement: Cross-platform local operation

The system SHALL provide documented local startup and fixture-demo commands that work on a designated Windows 11 device and an Apple Silicon macOS verification machine without requiring Docker.

#### Scenario: Clean local fixture startup

- **WHEN** dependencies are installed on either supported operating system
- **THEN** the documented commands start the app and complete the fixture smoke test with equivalent pass criteria

### Requirement: Data-mode transparency

The system SHALL show whether each critical result came from live, cache, or fixture data in the UI, logs, and exported plan evidence.

#### Scenario: Mixed data modes

- **WHEN** places are live but routes are cached and weather is fixture data
- **THEN** each section shows its own data mode and the plan summary reports the mixed-mode state
