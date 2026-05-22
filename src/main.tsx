import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "cn-fontsource-lxgw-marker-gothic-regular/font.css";
import { App } from "./App";
import "./styles.css";

const root_element = document.getElementById("root");

if (!root_element) {
  throw new Error("Root element was not found.");
}

createRoot(root_element).render(
  <StrictMode>
    <App />
  </StrictMode>
);
