import { useState } from "react";
import { useTranslation } from "react-i18next";
import { analyzeFrequency, frequencyFamily } from "../core/math";
import { centMatch, harmonicMatch, rationalMatch } from "../core/matching";
import { scoreFrequency } from "../core/scoring";
import { NUMBERS, sourceById } from "../data/corpus";
import { Badge, KV, Warn, fmt } from "../components/Common";

export const Analyze = ({ hz, onBack }: { hz: number; onBack: () => void }) => {
  const { t } = useTranslation();
  const [other, setOther] = useState(432);
  const a = analyzeFrequency(hz);
  const s = scoreFrequency(hz, NUMBERS);
  const fam = frequencyFamily(hz);
  const cm = centMatch(hz, other), cmo = centMatch(hz, other, 8, true), rm = rationalMatch(hz, other), hm = harmonicMatch(hz, other);

  return (
    <div>
      <div className="row between"><h1>{t("analyze.title")} — <span className="mono">{hz.toFixed(3)} {t("common.hz")}</span></h1><button className="btn small" onClick={onBack}>{t("common.back")}</button></div>

      <div className="card">
        <KV k={t("analyze.integer")} v={a.integer ? t("common.yes") : t("common.no")} />
        <KV k={t("analyze.prime")} v={a.prime === null ? "—" : a.prime ? t("common.yes") : t("common.no")} />
        <KV k={t("analyze.factorization")} v={a.factorization.length ? a.factorization.join(" × ") : "—"} />
        <KV k={t("analyze.digitSum")} v={a.digitSum ?? "—"} />
        <KV k={t("analyze.digitalRoot")} v={a.digitalRoot ?? "—"} />
        <KV k={t("analyze.octaveClass")} v={fmt(a.octaveClass, 5)} />
        <KV k={t("home.note440")} v={a.note440} />
        <KV k={t("home.note432")} v={a.note432} />
      </div>

      <div className="card">
        <h3>{t("analyze.harmonics")}</h3>
        <div className="chips">{a.harmonics.map((h, i) => <span key={i} className="chip mono">{i + 1}× {fmt(h, 1)}</span>)}</div>
      </div>

      <div className="card">
        <h3>{t("analyze.ratios")}</h3>
        {a.ratios.map((r) => <KV key={r.label} k={`${r.label} ${r.numerator}:${r.denominator}`} v={fmt(r.errorCents, 2)} />)}
      </div>

      <div className="card">
        <h3>{t("analyze.family")}</h3>
        {Object.entries(fam).map(([k, v]) => <KV key={k} k={k} v={fmt(v, 3)} />)}
      </div>

      <div className="card">
        <h3>{t("analyze.corpus")}</h3>
        {s.corpusHits.length === 0 && <div className="muted">{t("common.none")}</div>}
        {s.corpusHits.map((h) => (
          <div key={h.numberId} className="list-item">
            <div>
              <Badge kind={h.evidenceLevel} />
              <span className="muted">{sourceById(h.sourceId)?.title}</span>
              <div className="muted">{t("analyze.context")}: {h.context}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <h3>{t("analyze.score")}</h3>
        <KV k={t("analyze.mathScore")} v={fmt(s.math, 1)} />
        <KV k={t("analyze.histScore")} v={fmt(s.historical, 1)} />
        <KV k={t("analyze.total")} v={fmt(s.exploratory, 1)} />
        <Warn k="warnings.exploratory" />
        <Warn k="warnings.noClaim" />
      </div>

      <div className="card">
        <h3>{t("analyze.matchTitle")}</h3>
        <div className="field"><label>{t("analyze.matchWith")}</label><input type="number" value={other} onChange={(e) => setOther(Math.max(1, Number(e.target.value)))} /></div>
        <KV k={t("analyze.cents")} v={`${fmt(cm.cents, 2)} ${cm.match ? "✓" : ""}`} />
        <KV k={t("analyze.centsOctave")} v={`${fmt(cmo.cents, 2)} ${cmo.match ? "✓" : ""}`} />
        <KV k={t("analyze.rational")} v={`${rm.ratio} (${fmt(rm.errorCents, 2)}¢)${rm.referenceLabel ? " · " + rm.referenceLabel : ""} ${rm.match ? "✓" : ""}`} />
        <KV k={t("analyze.harmonic")} v={hm.direct ? `${hm.direct.kind === "f1_of_f2" ? hz : other} = ${hm.direct.k}×` : t("analyze.noMatch")} />
        <KV k={t("analyze.commonHarmonic")} v={hm.common ? `${hm.common.p}·f₁ ≈ ${hm.common.q}·f₂ ≈ ${fmt(hm.common.commonHz, 1)}` : t("analyze.noMatch")} />
      </div>
    </div>
  );
};
