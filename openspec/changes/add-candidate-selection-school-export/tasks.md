## 1. Recommendation domain

- [x] 1.1 Separate candidate pool, recommendations, selected place IDs, and UI focus in the plan model
- [x] 1.2 Add five versioned fixture candidates with complete evidence-compatible fields
- [x] 1.3 Implement deterministic eligibility, multidimensional scoring, reasons, caveats, and stable ranking
- [x] 1.4 Implement multi-place selection with route, itinerary, admission-cost, version, approval, and artifact updates
- [x] 1.5 Add unit tests for hard gates, stable ranking, required places, selection, and recalculation

## 2. Candidate comparison experience

- [x] 2.1 Add accessible candidate cards and a comparison table with score, evidence state, cost, access, and weather resilience
- [x] 2.2 Support selecting one to three eligible/review candidates and applying only those candidates to the itinerary
- [x] 2.3 Synchronize candidate focus and selected-plan state with the map and itinerary
- [x] 2.4 Add responsive and server-rendered UI tests for the comparison controls

## 3. School form draft export

- [x] 3.1 Add the versioned 2025 Wondang Middle School application-draft mapping and source notice
- [x] 3.2 Map only date, destination, learning form, purpose, and selected-place itinerary while leaving personal, consent, and signature fields blank
- [x] 3.3 Add semantic A4 print HTML with escaped content and draft watermark
- [x] 3.4 Expose the new document type through the UI and document API
- [x] 3.5 Add tests for privacy exclusions, selected-place mapping, source/version notice, and HTML escaping

## 4. Documentation and verification

- [x] 4.1 Update README and PRD to distinguish deterministic fixture recommendations from live AI/place search
- [x] 4.2 Run formatting, lint, typecheck, unit/integration/browser tests, fixture smoke, evaluation, build, HTTP smoke, and strict OpenSpec validation
- [x] 4.3 Verify the production-like page exposes candidate selection and school-form draft without console/server errors
