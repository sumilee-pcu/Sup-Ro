## ADDED Requirements

### Requirement: Candidate pool and planned places are distinct

The system SHALL preserve discovered candidates separately from the places currently included in the itinerary and SHALL keep UI focus separate from plan selection.

#### Scenario: Focus an unselected candidate

- **WHEN** a teacher focuses a candidate card or map marker without applying the selection
- **THEN** the candidate evidence is shown and the plan version, itinerary, and selected place IDs remain unchanged

### Requirement: Deterministic recommendation evidence

The system SHALL rank every candidate with eligibility, a 0–100 total score, dimension scores, reasons, caveats, and evidence references using deterministic code.

#### Scenario: Repeat the same fixture plan

- **WHEN** the same candidate data and constraints are evaluated twice
- **THEN** ranks, scores, eligibility, reasons, caveats, and tie order are identical

### Requirement: Hard constraints precede preference scores

The system SHALL NOT allow a high preference score to override an excluded place or a verified failure of a mandatory accessibility requirement.

#### Scenario: High-scoring inaccessible candidate

- **WHEN** wheelchair access is mandatory and a candidate is verified not accessible
- **THEN** the candidate is blocked, explains the access failure, and cannot be selected

### Requirement: One to three candidates can form the itinerary

The system SHALL allow a teacher to apply one, two, or three selectable candidates and SHALL build the itinerary from only the origin and those candidates.

#### Scenario: Apply two recommended candidates

- **WHEN** a teacher selects two candidates and applies the selection
- **THEN** a new plan version contains the origin plus those two places, rebuilds every route leg and stop, recalculates admission cost, clears generated artifacts, and no longer has a current-version approval

### Requirement: Selection surfaces share place identifiers

The system SHALL use the same place ID for candidate cards, comparison rows, map markers, selected IDs, and itinerary stops.

#### Scenario: Select from the comparison table

- **WHEN** a candidate is selected in the comparison controls and applied
- **THEN** the same place ID is present in selected place IDs and the resulting itinerary stop
