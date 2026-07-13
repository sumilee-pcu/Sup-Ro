## ADDED Requirements

### Requirement: Structured trip intake

The system SHALL collect school level, grade, subject or learning goal, origin, trip date, available time window, participant counts, budget basis, transport mode, and required constraints before starting a full planning run.

#### Scenario: Missing required input

- **WHEN** a user requests a plan without an origin or available time window
- **THEN** the system identifies each missing field and does not start place and route gathering

#### Scenario: Complete input

- **WHEN** all required fields are valid
- **THEN** the system stores a new plan version and allows the user to start planning

### Requirement: Hard and preferred constraints

The system SHALL distinguish mandatory constraints, preferred constraints, and exclusions in the planning input.

#### Scenario: Mandatory accessibility requirement

- **WHEN** wheelchair access is marked mandatory
- **THEN** the system treats unverified wheelchair access as a review-blocking finding rather than a preference penalty

### Requirement: Plan lifecycle

The system SHALL manage plans through DRAFT, GATHERING, VALIDATING, NEEDS_REVIEW, READY_FOR_APPROVAL, APPROVED, and ARCHIVED states using server-controlled transitions.

#### Scenario: Invalid client transition

- **WHEN** a client attempts to set a DRAFT plan directly to APPROVED
- **THEN** the system rejects the transition and preserves the previous state

### Requirement: Selective replanning

The system SHALL allow users to lock or exclude places and recalculate only the affected itinerary segments.

#### Scenario: Lock one venue and exclude another

- **WHEN** a user locks a museum and excludes an outdoor park
- **THEN** the system preserves the museum, removes the park, and recomputes remaining candidates, routes, schedule, and budget

### Requirement: Approval invalidation after material change

The system SHALL create a new plan version and invalidate prior approval when constraints, places, route legs, timing, cost, or evidence materially change.

#### Scenario: Edit an approved departure time

- **WHEN** a user changes the departure time of an approved plan
- **THEN** the system creates an unapproved version and requires validation and approval again
