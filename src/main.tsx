import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Returning visitors already had the inline head script add `splash-done`
// (boot splash hidden before paint). React won't mount the <Splash> overlay for
// them, so remove the leftover static node to keep the DOM clean.
if (document.documentElement.classList.contains("splash-done")) {
  document.getElementById("boot-splash")?.remove();
}

createRoot(document.getElementById("root")!).render(<App />);
