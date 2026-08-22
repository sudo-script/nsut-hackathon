import { useState } from "react";
import FirmwareLedgerScreen from "./screens/FirmwareLedgerScreen.jsx";
import LabScreen from "./screens/LabScreen.jsx";
import PitchScreen from "./screens/PitchScreen.jsx";
import WorkstationScreen from "./screens/WorkstationScreen.jsx";
import "./workstation.css";
import "./pitch.css";
import "./firmware.css";

const TABS = [
  { id: "workstation", label: "Sandbox workstation" },
  { id: "lab", label: "Campaign lab" },
  { id: "ledger", label: "BIOS ledger" },
  { id: "pitch", label: "Pitch deck" },
];

export default function App() {
  const [screen, setScreen] = useState("workstation");
  return (
    <div className={screen === "pitch" ? "pitch-mode" : ""}>
      <div className="crt" />
      <nav className="app-nav">
        {TABS.map((tab) => (
          <button key={tab.id} className={screen === tab.id ? "on" : ""} onClick={() => setScreen(tab.id)}>
            {tab.label}
          </button>
        ))}
      </nav>
      {screen === "workstation" && <WorkstationScreen />}
      {screen === "lab" && <LabScreen />}
      {screen === "ledger" && <FirmwareLedgerScreen />}
      {screen === "pitch" && <PitchScreen />}
    </div>
  );
}
