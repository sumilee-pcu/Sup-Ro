## ADDED Requirements

### Requirement: Version-bound document generation

The system SHALL generate every document from a specific immutable plan version and record the plan version and generation time.

#### Scenario: Generate from approved plan

- **WHEN** a user generates documents from plan version 4
- **THEN** each artifact references version 4 and remains unchanged if a later plan version is created

### Requirement: Required document types

The system SHALL generate a teacher operation plan, a student activity sheet, and a parent or guardian notice draft.

#### Scenario: Generate document set

- **WHEN** an approved plan has itinerary, curriculum, cost, and safety data
- **THEN** the system produces previews for all three document types using the relevant subset of plan information

### Requirement: Evidence and unresolved-item disclosure

The system SHALL include source links or references, retrieval dates, assumptions, unresolved confirmations, and an advisory notice in exported planning documents.

#### Scenario: Export with unverified group price

- **WHEN** a plan contains an accepted but unverified group price item
- **THEN** the teacher plan includes the item in a clearly labeled confirmation checklist and does not show it as confirmed

### Requirement: Draft and final distinction

The system SHALL visibly watermark documents from unapproved plans as drafts and SHALL reserve final export status for approved plan versions.

#### Scenario: Preview unapproved plan

- **WHEN** a user previews documents from a NEEDS_REVIEW plan
- **THEN** the preview is marked DRAFT and lists blocking findings

### Requirement: Portable output formats

The system SHALL provide Markdown and print-optimized HTML output, with browser PDF printing supported as the initial PDF path.

#### Scenario: Print a teacher plan

- **WHEN** a user opens print preview for an approved teacher plan
- **THEN** the document uses print styles that preserve headings, tables, warnings, and source references without requiring the interactive map
