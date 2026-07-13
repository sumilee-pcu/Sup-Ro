## 0. Naming and approval-gate split

- [x] 0.1 Compare Korean and English naming candidates for meaning, expansion fit, pronunciation, and visible web-service collisions
- [x] 0.2 Select `수업로 AI` as the Korean working brand and record the initial English and repository naming decision
- [x] 0.3 Document which tasks can proceed locally and which require external account access, legal review, physical-device access, or GitHub publication approval
- [x] 0.4 Rename the local project directory and update all project identity references before Git initialization
- [x] 0.5 Shorten the English brand to `Sup-Ro AI`, align package and internal identifiers to `sup-ro`/`SUPRO`, rename the local directory, and verify the exact GitHub repository handoff

## 1. Project foundation

- [x] 1.1 Scaffold the TypeScript web application with package scripts for development, build, lint, typecheck, test, and fixture smoke testing
- [x] 1.2 Pin the Node and package-manager versions and document equivalent Windows PowerShell and macOS shell startup commands
- [x] 1.3 Add environment validation with separate public configuration and server-only provider secrets
- [x] 1.4 Create module boundaries for plans, curriculum, geo providers, itinerary, safety, agent runs, documents, and evaluation
- [x] 1.5 Configure unit, integration, and browser test runners with deterministic time and network controls
- [x] 1.6 Add CI checks for formatting, lint, typecheck, unit tests, integration tests, build, and OpenSpec validation

## 2. Domain model and persistence

- [x] 2.1 Define shared schemas for TripPlan, ConstraintSet, plan states, mandatory preferences, and exclusions
- [x] 2.2 Define schemas for CurriculumReference, PlaceCandidate, ItineraryStop, RouteLeg, CostItem, SafetyEvidence, and SourceEvidence
- [x] 2.3 Define schemas for AgentRun, ToolCall, ValidationFinding, PlanApproval, and DocumentArtifact
- [x] 2.4 Implement the SQLite-compatible schema and migrations for plans, immutable plan versions, evidence, runs, approvals, and artifacts
- [x] 2.5 Implement repositories that save a new immutable version after every material edit
- [x] 2.6 Implement server-controlled plan-state transitions and rejection of invalid client transitions
- [x] 2.7 Add tests proving that an approved plan edit creates a new unapproved version while preserving the approved snapshot

## 3. Fixture mode and provider contracts

- [x] 3.1 Define ProviderResult with live, cache, and fixture modes, source, retrieval time, staleness, and warnings
- [x] 3.2 Define provider interfaces for map display, place search, routes, tourism, curriculum, weather, air quality, and safety facilities
- [x] 3.3 Create versioned representative ecology-trip fixtures for places, routes, curriculum, weather, safety, accessibility, and costs
- [x] 3.4 Create edge-case fixtures for venue closure, budget overrun, missing accessibility evidence, rain alternative, and route-provider failure
- [x] 3.5 Implement fixture providers and a global demo-mode switch with visible data-mode metadata
- [x] 3.6 Add contract tests that run every provider implementation against the same normalized schemas
- [x] 3.7 Add an offline smoke test that completes the representative plan without API keys or network access

## 4. Planning workspace and map experience

- [x] 4.1 Build the structured intake form for curriculum, origin, schedule, participants, budget, transport, accessibility, safety, and fallback constraints
- [x] 4.2 Implement validation that blocks planning and identifies every missing required input
- [x] 4.3 Build the desktop three-panel workspace with constraints and itinerary, map, and evidence and warning panels
- [x] 4.4 Build the mobile step flow and accessible place list that provides an alternative to map-only interaction
- [x] 4.5 Implement synchronized selection between map markers, candidate cards, and itinerary stops using internal place IDs
- [x] 4.6 Implement place locking, exclusion, reordering, and affected-segment replanning actions
- [x] 4.7 Add keyboard navigation, focus states, non-color warning indicators, and responsive layout tests

## 5. Live map, place, and route adapters

- [x] 5.1 Register the selected Kakao Maps developer application and record current quota, price, attribution, cache, and domain restrictions
- [x] 5.2 Implement Kakao map display without exposing server-only credentials
- [x] 5.3 Implement the Kakao Local place-search adapter and normalize results into internal PlaceCandidate records
- [ ] 5.4 Implement the selected route adapter for supported transit, walking, and bicycle routes and normalize RouteLeg evidence
- [x] 5.5 Implement cache boundaries and stale-data warnings allowed by each provider policy
- [x] 5.6 Add failure handling that falls back only to explicitly compatible cache or fixture results
- [x] 5.7 Add integration tests for live-result normalization using recorded, policy-compliant response fixtures rather than unrestricted network tests

## 6. Curriculum grounding and educational activities

- [x] 6.1 Select and document the authoritative curriculum source and initial supported school levels, grades, and subjects
- [x] 6.2 Build the versioned curriculum reference importer and local search index
- [x] 6.3 Implement curriculum retrieval by school level, grade, subject, keyword, and achievement-standard identifier
- [x] 6.4 Implement separate fields and rendering for authoritative source text and generated interpretation
- [x] 6.5 Implement venue-to-curriculum alignment suggestions that require evidence or an explicit unverified label
- [x] 6.6 Implement pre-visit, on-site, and post-visit activity generation tied to itinerary stops and learning goals
- [x] 6.7 Add tests that reject unsupported formal-alignment claims and preserve old references after a dataset update

## 7. Itinerary and constraint engine

- [x] 7.1 Implement route-duration matrix construction with unresolved-leg handling
- [x] 7.2 Implement temporal scheduling with visit durations, transfer buffers, meal and rest blocks, departure, and return limits
- [x] 7.3 Implement operating-hours validation and blocking findings for closed or unverified critical intervals
- [x] 7.4 Implement confirmed, estimated, and unverified cost items and separate confirmed and projected totals
- [x] 7.5 Implement budget-overrun findings and lower-cost alternative generation inputs
- [x] 7.6 Implement hard-constraint rejection, preferred-constraint scoring, and exclusion rules
- [x] 7.7 Implement machine-readable findings with rule ID, severity, affected entity, evidence, action, and blocking status
- [x] 7.8 Add benchmark tests for feasible, overtime, closed-venue, over-budget, inaccessible, and unresolved-route plans

## 8. Agent orchestration and provenance

- [x] 8.1 Implement the Intake, Gather, Solve, Verify, NeedsReview, ReadyForApproval, Approved, and Rendered workflow states
- [x] 8.2 Create an allowlisted tool registry with JSON Schema validation for every argument and result
- [x] 8.3 Implement a model-provider adapter and structured planning and explanation responses without provider-specific domain coupling
- [x] 8.4 Prevent model output from directly changing approval state or invoking reservation, payment, message, shell, or arbitrary network actions
- [x] 8.5 Implement evidence-reference validation for external factual claims before plan rendering
- [x] 8.6 Treat provider descriptions and user notes as untrusted data that cannot override orchestration or tool permissions
- [x] 8.7 Record sanitized agent stages, tool outcomes, latency, data mode, errors, and validation summary
- [x] 8.8 Add tests for unknown tools, invalid arguments, prompt-like provider text, partial failures, retries, and truthful error summaries

## 9. Safety, accessibility, and resilient alternatives

- [x] 9.1 Implement the weather provider adapter with forecast-range and retrieval-time handling
- [x] 9.2 Implement the air-quality provider adapter with measured and forecast state separation
- [x] 9.3 Implement the safety-facility adapter and advisory display with official-confirmation messaging
- [x] 9.4 Implement verified accessible, verified not accessible, and unverified states for each mandatory access need
- [x] 9.5 Implement review-blocking accessibility findings and user-recorded verification evidence
- [x] 9.6 Implement rain, air-quality, venue-closure, and transport-disruption alternative-plan generation
- [x] 9.7 Add tests ensuring that automated checks never render an unconditional safety guarantee

## 10. Approval and document artifacts

- [x] 10.1 Implement readiness calculation that requires all mandatory validations and evidence states
- [x] 10.2 Implement explicit human approval and approval audit records bound to immutable plan versions
- [x] 10.3 Define the structured document model shared by teacher plans, student activity sheets, and parent notices
- [x] 10.4 Implement draft previews with blocking findings and final status only for approved plan versions
- [x] 10.5 Implement teacher operation-plan rendering with itinerary, budget, safety, accessibility, sources, assumptions, and confirmation checklist
- [x] 10.6 Implement student activity-sheet rendering with pre-visit, on-site, and post-visit activities
- [x] 10.7 Implement parent-notice draft rendering without unsupported safety, price, or reservation claims
- [x] 10.8 Implement Markdown download and print-optimized HTML with browser PDF output
- [x] 10.9 Add snapshot and print-layout tests for all three document types in draft and approved states

## 11. Privacy, security, and evaluation

- [x] 11.1 Confirm that schemas and forms contain no student name, contact, health, diagnosis, or continuous-location fields
- [x] 11.2 Add warnings and redaction assistance for unnecessary student-identifying text in free-form notes
- [x] 11.3 Add secret-scanning and response tests proving credentials do not reach bundles, documents, client errors, or logs
- [x] 11.4 Implement per-run completeness, hard-constraint, source-coverage, unresolved-fact, tool-success, latency, and human-edit metrics
- [x] 11.5 Build the evaluation dashboard with run drill-down and live, cache, and fixture mode visibility
- [x] 11.6 Create at least 12 synthetic benchmark plans spanning school levels, regions, transport modes, and failure conditions
- [x] 11.7 Add an evaluation command that produces a versioned Markdown and JSON report from the benchmark suite

## 12. End-to-end verification and handoff

- [x] 12.1 Verify AC-001 through AC-008 from the PRD and record exact pass evidence
- [ ] 12.2 Run the fixture demo on a designated Windows 11 device and record startup time, plan time, browser, and pass result
- [x] 12.3 Run the same fixture demo on the designated macOS verification machine and compare outputs
- [x] 12.4 Verify that live-provider outage during planning leaves existing plans usable and produces an honest unresolved state
- [x] 12.5 Verify the representative 3-minute presentation script from clean startup through document preview
- [x] 12.6 Document API activation, quota monitoring, cost limits, attribution, cache restrictions, and fixture refresh procedures
- [x] 12.7 Document local operation, environment setup, backup, reset, deployment, rollback-to-fixture, and troubleshooting procedures
- [ ] 12.8 Complete the public-release review for data licenses, attribution, location-information scope, privacy notice, and advisory wording
- [x] 12.9 Update the PRD status, milestone evidence, and OpenSpec task checkboxes after every validated milestone

## 13. Local release candidate before GitHub publication

- [x] 13.1 Initialize a local Git repository with a privacy-safe ignore file and no remote configured
- [x] 13.2 Run secret, generated-file, license, and public-document checks against the exact staged tree
- [x] 13.3 Create intentional local commits for the validated fixture-first MVP and documentation
- [x] 13.4 Produce a publication handoff containing repository name, suggested description, topics, default branch, remaining approval gates, and exact push steps without executing any GitHub mutation
