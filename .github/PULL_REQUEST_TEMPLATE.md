## What does this change?

<!-- One or two sentences. -->

## Why?

<!-- What problem does it solve? Link an issue if there is one. -->

## Checks

- [ ] `cd engine && pytest` passes
- [ ] `cd app && npm test` passes
- [ ] `cd app && npx tsc --noEmit` is clean
- [ ] `bash scripts/parity.sh` passes — **required if you touched a formula in either engine**
- [ ] New scientific logic has a test that would fail if the logic were wrong
- [ ] No hardcoded user-visible strings (everything through i18n)

## The non-negotiable rules

- [ ] No module claims a frequency is "healing" or effective
- [ ] Evidence levels are unchanged, or changed with a cited source
- [ ] Simulation is still distinguished from measurement
- [ ] Blinding and preregistration are not bypassed
- [ ] Safety caps intact (amplitude ≤ 0.2, 0.1 Hz – 96 kHz)
