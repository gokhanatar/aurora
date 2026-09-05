import { useState } from "react";
import { useTranslation } from "react-i18next";
import { setLanguage } from "./i18n";
import { Home } from "./screens/Home";
import { Analyze } from "./screens/Analyze";
import { Library } from "./screens/Library";
import { Sequence } from "./screens/Sequence";
import { Experiment } from "./screens/Experiment";
import { Journal } from "./screens/Journal";
import { Lab } from "./screens/Lab";

type Tab = "home" | "library" | "sequence" | "experiment" | "journal" | "lab";
const TABS: Array<{ id: Tab; ico: string }> = [
  { id: "home", ico: "◎" }, { id: "library", ico: "☰" }, { id: "sequence", ico: "≋" },
  { id: "experiment", ico: "⚗" }, { id: "journal", ico: "▤" }, { id: "lab", ico: "✦" },
];

export const App = () => {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>("home");
  const [hz, setHz] = useState(528);
  const [analyze, setAnalyze] = useState(false);

  return (
    <div className="app">
      <div className="screen">
        <div className="topbar">
          <span className="brand">{t("app.title")} <span className="muted" style={{ letterSpacing: 0, fontWeight: 400 }}>· {t("app.subtitle")}</span></span>
          <button className="lang" onClick={() => setLanguage(i18n.language === "tr" ? "en" : "tr")}>{t("common.language")}: {i18n.language.toUpperCase()}</button>
        </div>
        {tab === "home" && (analyze ? <Analyze hz={hz} onBack={() => setAnalyze(false)} /> : <Home hz={hz} setHz={setHz} onAnalyze={() => setAnalyze(true)} />)}
        {tab === "library" && <Library onPick={(v) => { setHz(v); setAnalyze(false); setTab("home"); }} />}
        {tab === "sequence" && <Sequence />}
        {tab === "experiment" && <Experiment />}
        {tab === "journal" && <Journal />}
        {tab === "lab" && <Lab hz={hz} />}
        <div className="muted center" style={{ marginTop: 20 }}>{t("app.motto")}</div>
      </div>
      <nav className="tabs">
        {TABS.map((x) => (
          <button key={x.id} className={tab === x.id ? "active" : ""} onClick={() => { setTab(x.id); setAnalyze(false); }}>
            <span className="ico">{x.ico}</span>{t(`tabs.${x.id}`)}
          </button>
        ))}
      </nav>
    </div>
  );
};
