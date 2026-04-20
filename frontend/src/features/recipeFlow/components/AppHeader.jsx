import { ChefHat } from "lucide-react";

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="brand-row">
        <ChefHat className="brand-icon icon-active" strokeWidth={1.5} aria-hidden="true" />
        <p className="micro-label app-kicker">MICHELIN</p>
      </div>
      <h1 className="display-title app-title">Michelin</h1>
    </header>
  );
}
