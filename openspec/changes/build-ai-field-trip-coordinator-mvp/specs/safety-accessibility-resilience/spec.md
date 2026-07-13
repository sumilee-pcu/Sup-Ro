## ADDED Requirements

### Requirement: Weather and air-quality evidence

The system SHALL attach provider, observation or forecast time, retrieval time, and status to weather and air-quality data used in a plan.

#### Scenario: Current forecast available

- **WHEN** a forecast is available for the trip location and date
- **THEN** the plan shows the forecast source, time range, and any triggered planning warnings

#### Scenario: Forecast unavailable

- **WHEN** the trip date is beyond the provider forecast range
- **THEN** the system marks weather as pending future confirmation rather than inventing a forecast

### Requirement: Accessibility uncertainty handling

The system SHALL distinguish verified accessible, verified not accessible, and unverified accessibility states for each mandatory access requirement.

#### Scenario: No wheelchair evidence

- **WHEN** wheelchair access is mandatory and no authoritative evidence is available
- **THEN** the system marks the venue unverified, provides a confirmation task, and blocks approval readiness unless the user records an accepted verification

### Requirement: Nearby safety facility context

The system SHALL identify available emergency, shelter, or safety facilities near itinerary stops when an approved data source is configured.

#### Scenario: Safety facility search succeeds

- **WHEN** a user reviews safety context for an itinerary stop
- **THEN** the system shows nearby facilities with distance, source, retrieval time, and a notice that operational availability requires official confirmation

### Requirement: Resilient alternatives

The system SHALL generate an alternative plan when outdoor activity, air quality, transport, or venue availability makes the primary plan infeasible.

#### Scenario: Rain alternative requested

- **WHEN** the primary itinerary includes an outdoor stop and the user requests a rain plan
- **THEN** the system proposes an indoor alternative and recalculates route, timing, cost, and curriculum linkage

### Requirement: Safety claims remain advisory

The system SHALL NOT state that a trip is safe solely because automated checks passed.

#### Scenario: All automated safety checks pass

- **WHEN** no safety rule reports a blocking finding
- **THEN** the system reports that automated checks found no current blocker and still provides the institution confirmation checklist
