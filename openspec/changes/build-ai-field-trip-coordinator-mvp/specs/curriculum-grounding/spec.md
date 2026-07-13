## ADDED Requirements

### Requirement: Explicit curriculum context

The system SHALL associate each curriculum query with school level, grade, subject, curriculum version, and source identity.

#### Scenario: Select curriculum version

- **WHEN** a user selects a grade and subject for a new plan
- **THEN** the system requires or defaults a visible curriculum version before retrieving achievement standards

### Requirement: Evidence-backed curriculum linkage

The system SHALL link each claimed curriculum alignment to a stored curriculum reference or label the linkage as a user-authored learning goal.

#### Scenario: Venue recommendation with standard

- **WHEN** a place is recommended for a science achievement standard
- **THEN** the place card shows the standard identifier or source excerpt and an explanation of how the proposed activity supports it

#### Scenario: No authoritative match

- **WHEN** no curriculum reference supports a proposed activity
- **THEN** the system does not claim formal alignment and marks the activity as an unverified suggestion

### Requirement: Source text and generated explanation separation

The system SHALL visually and structurally distinguish authoritative curriculum text from AI-generated interpretation.

#### Scenario: Review curriculum evidence

- **WHEN** a user opens a curriculum evidence panel
- **THEN** the source text, source metadata, and generated explanation appear in separate labeled fields

### Requirement: Learning activity generation

The system SHALL generate pre-visit, on-site, and post-visit learning activities from approved curriculum references and plan context.

#### Scenario: Generate a student activity sequence

- **WHEN** a user requests an activity sheet for an approved ecology trip
- **THEN** the system produces activities tied to specific itinerary stops and the selected learning goals

### Requirement: Curriculum evidence freshness

The system SHALL retain the retrieval or dataset version for every curriculum reference used in a plan.

#### Scenario: Curriculum dataset updates

- **WHEN** a curriculum dataset version changes after a plan was approved
- **THEN** the existing plan retains its original reference version and a new planning run uses the updated version
