export default function DiagnosticSidebar({ selectedRecipe, materials }) {
  return (
    <aside className="diagnostic-sidebar">
      <p className="micro-label">MATERIAL REQUIREMENTS</p>
      {selectedRecipe ? (
        <>
          <p className="sidebar-title">{selectedRecipe.title}</p>
          <ul>
            {materials.map((item) => (
              <li key={item.name}>
                <span>{item.name}</span>
                <span className={`status-chip ${item.state}`}>
                  {item.state === "ready" ? "Ready" : "Pending"}
                </span>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p>Select a recipe to lock material requirements.</p>
      )}
    </aside>
  );
}
