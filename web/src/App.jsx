import { useState } from "react";
import LabScreen from "./screens/LabScreen.jsx";
import PitchScreen from "./screens/PitchScreen.jsx";
import WorkstationScreen from "./screens/WorkstationScreen.jsx";
import "./workstation.css";
import "./pitch.css";

const TABS = [
  { id: "workstation", label: "Sandbox workstation" },
  { id: "lab", label: "Campaign lab" },
  { id: "pitch", label: "Pitch deck" },
];

export default function App() {
  const [screen, setScreen] = useState("workstation");
  return (
    <>
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
      {screen === "pitch" && <PitchScreen />}
    </>
  );
}
