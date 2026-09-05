import { useState } from "react";
import { useTranslation } from "react-i18next";
import type { EvidenceLevel, HypothesisStatus, MeasurementKind, Origin } from "../data/types";

type BadgeKind = EvidenceLevel | HypothesisStatus | MeasurementKind | Origin;

export const Badge = ({ kind }: { kind: BadgeKind }) => {
  const { t } = useTranslation();
  return <span className={`badge ${kind}`}>{t(`badges.${kind}`)}</span>;
};

export const KV = ({ k, v }: { k: string; v: React.ReactNode }) => (
  <div className="kv">
    <span>{k}</span>
    <span>{v}</span>
  </div>
);

export const Warn = ({ k, values }: { k: string; values?: Record<string, unknown> }) => {
  const { t } = useTranslation();
  return <div className="warn">⚠ {t(k, values)}</div>;
};

export const fmt = (x: number | null | undefined, d = 2): string => (x === null || x === undefined || Number.isNaN(x) ? "—" : x.toFixed(d));

export const DnaBars = ({ rows }: { rows: Array<{ label: string; value: number | null; max: number }> }) => {
  const { t } = useTranslation();
  return (
    <div className="bars">
      {rows.map((r) => (
        <div className="bar" key={r.label}>
          <span className="muted">{r.label}</span>
          <div className="track">
            <div className="fill" style={{ width: r.value === null ? "0%" : `${Math.min(100, (100 * r.value) / r.max)}%` }} />
          </div>
          <span className="mono">{r.value === null ? "—" : Math.round(r.value)}</span>
        </div>
      ))}
    </div>
  );
};

export const Rating = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
  <div className="rating">
    <span>{label}</span>
    <input type="range" min={0} max={10} step={1} value={value} onChange={(e) => onChange(Number(e.target.value))} />
    <span className="mono">{value}</span>
  </div>
);

/** Terim açıklaması — yanındaki (?) simgesine dokununca sade bir açıklama açar. */
export const Info = ({ term }: { term: string }) => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button className="info-btn" onClick={() => setOpen((v) => !v)} aria-label={t("home.quickInfo")}>?</button>
      {open && (
        <div className="info-pop" onClick={() => setOpen(false)}>
          {t(`glossary.${term}`)}
        </div>
      )}
    </>
  );
};

/** Başlık + bilgi simgesi. */
export const LabelInfo = ({ text, term }: { text: string; term: string }) => (
  <span className="label-info">
    {text}
    <Info term={term} />
  </span>
);

/** Bilgi kutusu — bir kavramı kalıcı olarak açıklar (uyarı değil, öğretici). */
export const Note = ({ children }: { children: React.ReactNode }) => (
  <div className="note">{children}</div>
);
