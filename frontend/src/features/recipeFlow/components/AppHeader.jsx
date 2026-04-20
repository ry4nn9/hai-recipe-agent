import { ChefHat } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="app-header-brand">
        <div className="brand-row">
          <ChefHat className="brand-icon icon-active" strokeWidth={1.5} aria-hidden="true" />
          <p className="micro-label app-kicker">AGENT</p>
        </div>
        <h1 className="display-title app-title">
          Michelin <em>Atelier</em>
        </h1>
      </div>
    </header>
  );
}
