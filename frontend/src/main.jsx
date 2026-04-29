import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Restore saved theme before first paint to avoid flash
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") {
  document.body.dataset.theme = "light";
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
