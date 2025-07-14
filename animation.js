/**
 * Animate an operation (opText) from input to the relevant equation terms.
 * Handles brøker/x-led robustt.
 * @param {string} opText - The operation text (fx "/2", "*3", "+5").
 * @param {HTMLElement[]} targets - Array of DOM elements (spans) to animate to.
 * @param {HTMLElement} inputEl - The input element where the operation is typed.
 * @param {HTMLElement} overlay - The overlay div for animation (absolute positioned).
 */
function animateOperationToEquation(opText, targets, inputEl, overlay) {
  if (!inputEl || !overlay || !targets.length) return;

  // Find inputfeltets position
  const inputRect = inputEl.getBoundingClientRect();
  const containerRect = overlay.getBoundingClientRect();

  targets.forEach(target => {
    // Find center af target (også for brøker/x)
    let targetRect = target.getBoundingClientRect();
    // Hvis target indeholder en brøk, find midten af .frac
    const frac = target.querySelector('.frac');
    if (frac) {
      targetRect = frac.getBoundingClientRect();
    }

    // Startposition: midt på inputfeltet
    const startX = inputRect.left + inputRect.width / 2 - containerRect.left;
    const startY = inputRect.top + inputRect.height / 2 - containerRect.top;

    // Slutposition: lige over target
    const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
    const endY = targetRect.top - containerRect.top - 28;

    // Opret flyvende element
    const fly = document.createElement("div");
    fly.className = "anim-fly";
    fly.textContent = opText;
    fly.style.left = `${startX}px`;
    fly.style.top = `${startY}px`;
    fly.style.transform = "translate(-50%, -50%)";
    overlay.appendChild(fly);

    // Trigger animation til over target
    setTimeout(() => {
      fly.style.transform = `translate(${endX - startX}px, ${endY - startY}px)`;
    }, 10);

    // Efter 700ms, "fald" ned på target og fade ud
    setTimeout(() => {
      fly.style.transform = `translate(${endX - startX}px, ${targetRect.top + targetRect.height/2 - containerRect.top - startY}px) scale(0.8)`;
      fly.classList.add("fade");
    }, 900);

    // Fjern efter animation
    setTimeout(() => {
      overlay.removeChild(fly);
    }, 1300);
  });
}

// Gør funktionen globalt tilgængelig hvis du vil bruge den fra andre scripts
window.animateOperationToEquation = animateOperationToEquation;
