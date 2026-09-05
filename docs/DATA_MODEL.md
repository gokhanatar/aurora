# AURORA — Veri Modeli

Kanıt seviyesi: `direct | derived | interpretive | speculative`
Hipotez durumu: `candidate | tested | validated | rejected`
Ölçüm türü: `simulation | real`

```
sources        source_id, civilization, date_range, title, location, language, provenance, citation
numbers        number_id, source_id, value, context, extraction (explicit|counted|computed), evidence_level
ratios         ratio_id, numerator, denominator, label, source_ids[], derivation
frequencies    frequency_id, hz, origin (popular|derived|user|discovery), derivation{base,num,den,formula}, source_ids[], hypothesis_status
stimuli        stimulus_id, steps[{hz,duration_s}], gaps_s[], repetitions, waveform, amplitude, sample_rate, checksum
studies        study_id, primary_outcome, conditions[{condition_id,label,stimulus_id|null,type}], frozen_at, seed, set (discovery|validation)
trials         trial_id, study_id, participant_id, condition_id, order_index, pre{6 alan}, post{6 alan}, notes, started_at, ended_at
results        study_id, condition_id, outcome, n, mean_change, sd, ci95[lo,hi], cohen_d, p_value, correction, replication_status, evidence_grade
journal        date, mood, energy, new_opportunity, positive_interaction, business_lead, unexpected_positive_event, goal_completion, social_interaction, protocol_id|null
patterns       pattern_id, hz, kind (simulation|real), plate{shape,size_cm,thickness_mm,material,boundary,excitation}, image_ref, fingerprint{symmetry,radial_symmetry,complexity,density,node_count,dominant_angle_deg}
```

Uygulama tarafında IndexedDB store adları aynıdır (`app/src/data/repo.ts`).
Python tarafında CSV/JSON dosyaları (`engine/data/`, `engine/out/`).
