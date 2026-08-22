import { useState } from "react";
import LabScreen from "./screens/LabScreen.jsx";
import WorkstationScreen from "./screens/WorkstationScreen.jsx";
import "./workstation.css";

export default function App() {
  const [screen, setScreen] = useState("workstation");
  return (
    <>
      <div className="crt" />
      <nav className="app-nav">
        <button className={screen === "workstation" ? "on" : ""} onClick={() => setScreen("workstation")}>
          Sandbox workstation
        </button>
        <button className={screen === "lab" ? "on" : ""} onClick={() => setScreen("lab")}>
          Campaign lab
        </button>
      </nav>
      {screen === "workstation" ? <WorkstationScreen /> : <LabScreen />}
    </>
  );
}
