## ADDED Requirements

### Requirement: Temporally feasible itinerary

The system SHALL schedule each stop after the previous stop, route duration, and required transition buffer, and within the trip time window.

#### Scenario: Feasible sequence

- **WHEN** all stops, route legs, and buffers fit between departure and return time
- **THEN** the system marks the temporal constraint set as satisfied

#### Scenario: Return time exceeded

- **WHEN** the proposed itinerary returns after the mandatory return time
- **THEN** the system reports the overrun and proposes removing, shortening, or reordering stops

### Requirement: Operating-hours validation

The system SHALL compare expected arrival and visit intervals with sourced operating hours when operating hours are available.

#### Scenario: Venue closed on arrival

- **WHEN** a visit interval falls outside verified operating hours
- **THEN** the system creates a blocking finding and does not mark the itinerary ready for approval

### Requirement: Budget calculation with evidence status

The system SHALL classify cost items as confirmed, estimated, or unverified and SHALL calculate totals without treating unverified prices as zero.

#### Scenario: Unknown group admission

- **WHEN** group admission price cannot be verified
- **THEN** the cost remains unverified, is excluded from a confirmed total, and appears in the required confirmation checklist

#### Scenario: Budget exceeded

- **WHEN** the confirmed and accepted estimated total exceeds the budget
- **THEN** the system reports the amount and sources of the overage and proposes lower-cost changes

### Requirement: Mandatory constraint precedence

The system SHALL reject candidates that violate mandatory constraints even when they score highly on preferred criteria.

#### Scenario: Attractive but inaccessible venue

- **WHEN** a venue has high educational relevance but violates a mandatory verified accessibility constraint
- **THEN** the venue is not included in an approval-ready itinerary

### Requirement: Machine-readable validation findings

The system SHALL emit validation findings with rule ID, severity, affected entity, evidence, user action, and blocking status.

#### Scenario: Multiple violations

- **WHEN** an itinerary exceeds budget and includes an unresolved route leg
- **THEN** the system returns separate findings that the UI and evaluation report can inspect independently
