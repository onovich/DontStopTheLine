# ADR 0001: Deterministic discrete-event simulation

## Context

The game needs repeatable production-line outcomes for tests, saves, balancing, and future replay
tools. Browser rendering, animation frames, wall-clock time, and platform APIs are inherently
variable and must not become part of the authoritative model.

## Decision

The domain and simulation packages will remain pure TypeScript. State changes enter the simulation
as Commands and leave it as ordered Domain Events. The event queue is ordered by logical tick and a
stable sequence number. Randomness comes from an injected, serializable seeded PRNG; time comes from
an injected clock. The rendering layer only reads snapshots and may interpolate visuals, but cannot
write authoritative simulation state.

## Consequences

- Equal seed, command sequence, and initial snapshot must produce equal results.
- Tests can supply clocks and seeds without mocking browser or system APIs.
- Event/snapshot formats become compatibility surfaces and require intentional migrations.
- UI animation may lag or pause without changing simulation outcomes.

## Alternatives

- **Frame-driven simulation:** rejected because frame timing and browser throttling change outcomes.
- **Direct `Math.random()` and `Date.now()`:** rejected because results cannot be reproduced.
- **UI-owned state:** rejected because presentation concerns would become an authority boundary.
