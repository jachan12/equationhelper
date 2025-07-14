export function addHistoryDropdown(equation, opText) {
  const historyEntry = document.createElement("li");
  historyEntry.className = "history-dropdown";
  const summary = document.createElement("div");
  summary.className = "history-summary";
  summary.tabIndex = 0;
  summary.innerHTML = equation;
  const details = document.createElement("div");
  details.className = "history-details";
  details.style.display = "none";
  details.innerHTML = `<div>${opText}</div>`;
  summary.addEventListener("click", function () {
    details.style.display = details.style.display === "none" ? "block" : "none";
  });
  summary.addEventListener("keydown", function (e) {
    if (e.key === "Enter" || e.key === " ") {
      details.style.display = details.style.display === "none" ? "block" : "none";
      e.preventDefault();
    }
  });
  historyEntry.appendChild(summary);
  historyEntry.appendChild(details);
  document.getElementById("historyList").appendChild(historyEntry);
}
