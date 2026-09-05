import { analyzeFrequency, cents, deriveFrequency, factorize, frequencyFamily, octaveReduce } from "../../app/src/core/math.ts";
import { centMatch, dtwDistance, harmonicMatch, rationalMatch, sequenceMatch } from "../../app/src/core/matching.ts";
import { mathematicalScore, scoreFrequency } from "../../app/src/core/scoring.ts";
import { NUMBERS } from "../../app/src/data/corpus.ts";
import { modeNumbers, modalFrequency, resonanceProximity, DEFAULT_PLATE } from "../../app/src/core/chladni.ts";
import { buildStimulus, totalSeconds } from "../../app/src/core/sequence.ts";
const a = analyzeFrequency(528);
console.log(JSON.stringify({
 octave_reduce_864: octaveReduce(864),
 cents_880_440: cents(880,440),
 derive_432_3_2: deriveFrequency(432,3,2),
 family_432_fourth: frequencyFamily(432).fourth,
 factorization_432: factorize(432),
 note440_528: a.note440, digital_root_528: a.digitalRoot,
 closest_ratio_528: [a.ratios[0].label, Math.round(a.ratios[0].errorCents*1e6)/1e6],
 math_score_432: mathematicalScore(432), math_score_528: mathematicalScore(528),
 hist_score_432: scoreFrequency(432, NUMBERS).historical,
 hist_score_27: scoreFrequency(27, NUMBERS).historical,
 rational_648_432: rationalMatch(648,432).ratio,
 harmonic_1056_528: harmonicMatch(1056,528).direct,
 cent_match_432_864_oct: centMatch(432,864,8,true).match,
 dtw_same: dtwDistance([432,528,639],[432,528,639]),
 seq_transpose: sequenceMatch([432,528,639],[864,1056,1278]).transpositionInvariantMatch,
 chladni_mode_528: modeNumbers(528),
 modal_f_2_3_steel: Math.round(modalFrequency(2,3,DEFAULT_PLATE)*1e4)/1e4,
 modal_f_2_3_alu: Math.round(modalFrequency(2,3,{...DEFAULT_PLATE,material:"aluminum"})*1e4)/1e4,
 modal_f_thick2: Math.round(modalFrequency(2,3,{...DEFAULT_PLATE,thicknessMm:2})*1e4)/1e4,
 resonance_prox_528: Math.round(resonanceProximity(528,DEFAULT_PLATE)*1e4)/1e4,
 mode_528_big_plate: modeNumbers(528,{...DEFAULT_PLATE,sizeCm:30}),
 stim_total_5_8_13: totalSeconds(buildStimulus([432,528,639],[5,8,13])),
}, null, 1));
