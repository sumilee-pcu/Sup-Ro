## ADDED Requirements

### Requirement: Normalized place discovery

The system SHALL normalize place results into an internal place reference containing provider ID, name, category, coordinates, address, source, retrieval time, data mode, and warnings.

#### Scenario: Live place search

- **WHEN** a user searches for science museums near an origin
- **THEN** the system returns normalized candidates without exposing provider-specific response shapes to the planning domain

### Requirement: Map and itinerary synchronization

The system SHALL use the same internal place identifier for map markers, candidate cards, and itinerary stops.

#### Scenario: Select a marker

- **WHEN** a user selects a map marker
- **THEN** the corresponding candidate or itinerary item receives focus and shows the same evidence and status

### Requirement: Route evidence

The system SHALL store each route leg with origin, destination, transport mode, distance, duration, provider, retrieval time, data mode, and warnings.

#### Scenario: Transit route returned

- **WHEN** a route provider returns a public-transit route
- **THEN** the itinerary displays the duration and mode with provider attribution and retrieval time

### Requirement: Provider failure and fallback visibility

The system SHALL distinguish live, cache, and fixture results and SHALL NOT present fallback data as current live data.

#### Scenario: Live route provider failure

- **WHEN** the live route call fails and a matching fixture is available
- **THEN** the system may continue in fixture mode while showing a visible fixture badge and provider failure warning

#### Scenario: No fallback route

- **WHEN** the live route call fails and no acceptable fallback exists
- **THEN** the affected leg remains unresolved and the plan cannot become READY_FOR_APPROVAL

### Requirement: Conflicting place facts

The system SHALL preserve conflicting values from different sources and require user review for material conflicts.

#### Scenario: Conflicting closing times

- **WHEN** two sources provide different closing times that affect the itinerary
- **THEN** the system shows both values, their sources, and a review-blocking conflict
