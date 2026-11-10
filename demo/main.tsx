import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { SpermLab } from "../src/react/index.js";
import "../src/react/styles.css";
import "./page.css";
createRoot(document.getElementById("root")!).render(<StrictMode><main>
  <header><a href="https://esmirnov.ai/labs/">All labs</a><h1>Sperm Lab<span>.</span></h1>
    <p>Make a current. Inspect a swimmer. Explore 12 factors that relate to sperm development and function.</p>
    <nav aria-label="Package resources"><a href="https://github.com/eduard-s/sperm-lab">GitHub source</a><a href="https://www.npmjs.com/package/@esmirnov.ai/sperm-lab">npm package</a></nav>
  </header>
  <SpermLab />
  <footer><p><a href="https://esmirnov.ai/sperm-lab/">Open the lab on esmirnov.ai</a></p></footer>
</main></StrictMode>);
