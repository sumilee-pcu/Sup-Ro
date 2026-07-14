## ADDED Requirements

### Requirement: Versioned school-form mapping

The system SHALL identify the school, form year, source page, retrieval basis, and plan version used for every school-form draft.

#### Scenario: Render the 2025 Wondang draft

- **WHEN** a teacher opens the school application draft
- **THEN** it identifies the 2025 Wondang Middle School form source and the current immutable plan version

### Requirement: Only non-personal plan fields are prefilled

The system SHALL prefill trip dates, selected destinations, learning form, learning purpose, and selected-place itinerary and SHALL leave student, guardian, chaperone, contact, relationship, consent, confirmation, and signature fields for direct completion.

#### Scenario: Render from an approved plan

- **WHEN** the current plan has an approval
- **THEN** the school application remains a draft and does not infer any personal field, consent, or signature

### Requirement: Post-trip reflection is not generated before the trip

The system SHALL NOT present generated reflection, learned outcomes, photos, tickets, or signatures as a completed result report.

#### Scenario: Export before field learning

- **WHEN** a teacher exports from the planning workspace before the trip
- **THEN** only the application-writing draft is available and post-trip result content is marked as requiring later student input

### Requirement: Printable output is semantic and safe

The system SHALL render A4 print HTML with headings, tables, lists, warnings, and a draft mark while escaping plan-derived text.

#### Scenario: Learning goal contains markup

- **WHEN** a learning goal contains HTML-like text
- **THEN** the print document displays it as text and does not create executable or structural markup

### Requirement: Administrative purpose is disclosed

The system SHALL state that the referenced form is an individual school-authorized off-campus learning form and may not replace a group field-class operation plan without school confirmation.

#### Scenario: Open the draft preview

- **WHEN** a teacher views the school-form draft
- **THEN** the administrative-purpose warning and a link to the official source are visible
