// Hver side er nu et array af led: [{factor, xPow}]
let leftTerms = [ { factor: 1, xPow: 1 }, { factor: 3, xPow: 0 } ]; // fx 1x + 3
let rightTerms = [ { factor: 7, xPow: 0 } ]; // fx 7

function cloneTerms(terms) {
  return terms.map(t => ({ factor: t.factor, xPow: t.xPow }));
}

function combineTerms(terms) {
  // Kombiner led med samme xPow OG for x/a: samme den OG fracX
  let map = {};
  for (let t of terms) {
    let key = t.xPow;
    // For x/a: brug både xPow, den og fracX som key
    if (t.fracX && t.xPow === 1 && t.den) {
      key = `xOver${t.den}`;
    } else if (t.fracX && t.xPow === -1) {
      key = `aOverX`;
    }
    // Bevar ALLE properties for x/a
    if (!map[key]) {
      map[key] = { ...t };
    } else {
      map[key].factor = addFactors(map[key].factor, t.factor);
      if (t.fracX && t.xPow === 1 && t.den) {
        map[key].den = t.den;
        map[key].fracX = true;
        map[key].xPow = 1;
      }
      if (t.fracX && t.xPow === -1) {
        map[key].fracX = true;
        map[key].xPow = -1;
      }
    }
  }
  // For x/a: bevar både factor og den i output
  let combined = Object.values(map)
    .filter(t => toNumber(t.factor) !== 0)
    .sort((a, b) => b.xPow - a.xPow);

  // NYT: For x-led med brøkkoefficient, reducer hvis muligt
  combined = combined.map(t => {
    if (
      t.xPow === 1 &&
      typeof t.factor === "object" &&
      t.factor !== null &&
      "num" in t.factor &&
      "den" in t.factor
    ) {
      // Hvis nævneren går op i tælleren, lav til heltal
      if (t.factor.num % t.factor.den === 0) {
        return { factor: t.factor.num / t.factor.den, xPow: 1 };
      }
      // Hvis nævneren er 1, lav til heltal
      if (t.factor.den === 1) {
        return { factor: t.factor.num, xPow: 1 };
      }
    }
    return t;
  });

  return combined;
}

function formatEquation() {
  function formatSide(terms) {
    if (!terms.length) return "0";
    let str = "";
    terms.forEach((t, i) => {
      let s = formatTerm(t);
      if (!s) return;
      let sign = signFactor(t.factor);
      if (i > 0 && sign > 0) str += " + ";
      if (i > 0 && sign < 0) str += " - ";
      if (i === 0 && sign < 0) str += "-";
      str += formatTerm({ factor: absFactor(t.factor), xPow: t.xPow });
    });
    return str || "0";
  }
  return `${formatSide(leftTerms)} = ${formatSide(rightTerms)}`;
}

function formatNumber(n) {
  // Vis altid 2 decimaler hvis ikke heltal
  if (typeof n !== "number") return n;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function formatTerm(term) {
  if (term.factor === 0) return "";
  // x/a (x i tæller, tal i nævner) -- håndter også x/2, -x/2, 3x/5
  if (term.fracX && term.xPow === 1 && term.den) {
    // factor = 1: x/den, factor = -1: -x/den, ellers fx 3x/den
    let numStr = "";
    if (term.factor === 1) numStr = "x";
    else if (term.factor === -1) numStr = "-x";
    else numStr = `${formatNumber(term.factor)}x`;
    return `<span class="frac"><span class="num">${numStr}</span><span class="fracbar"></span><span class="den">${formatNumber(term.den)}</span></span>`;
  }
  // a/x (tal i tæller, x i nævner)
  if (term.fracX && term.xPow === -1 && term.factor) {
    return `<span class="frac"><span class="num">${formatNumber(term.factor)}</span><span class="fracbar"></span><span class="den">x</span></span>`;
  }
  // x^-1 skal vises som brøk (a/x)
  if (term.xPow === -1) {
    if (term.factor === 1) {
      return `<span class="frac"><span class="num">1</span><span class="fracbar"></span><span class="den">x</span></span>`;
    }
    if (term.factor === -1) {
      return `<span class="frac"><span class="num">-1</span><span class="fracbar"></span><span class="den">x</span></span>`;
    }
    return `<span class="frac"><span class="num">${formatNumber(term.factor)}</span><span class="fracbar"></span><span class="den">x</span></span>`;
  }
  // Brøkkoefficient med HTML-brøk
  if (typeof term.factor === "object" && term.factor !== null && "num" in term.factor && "den" in term.factor) {
    const num = term.factor.num;
    const den = term.factor.den;
    if (term.xPow === 0) return `<span class="frac"><span class="num">${formatNumber(num)}</span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
    if (term.xPow === 1) {
      // fx x/2, -x/5, 3x/7
      if (num === 1) return `<span class="frac"><span class="num">x</span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
      if (num === -1) return `<span class="frac"><span class="num">-x</span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
      return `<span class="frac"><span class="num">${formatNumber(num)}x</span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
    }
    if (num === 1) return `x^${term.xPow}<span class="frac"><span class="num"></span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
    if (num === -1) return `-x^${term.xPow}<span class="frac"><span class="num"></span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
    return `<span class="frac"><span class="num">${formatNumber(num)}x^${term.xPow}</span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
  }
  if (term.xPow === 0) return formatNumber(term.factor);
  if (term.xPow === 1) {
    if (term.factor === 1) return "x";
    if (term.factor === -1) return "-x";
    return `${formatNumber(term.factor)}x`;
  }
  // NYT: Brug <sup> til potens
  if (term.factor === 1) return `x<sup>${term.xPow}</sup>`;
  if (term.factor === -1) return `-x<sup>${term.xPow}</sup>`;
  return `${formatNumber(term.factor)}x<sup>${term.xPow}</sup>`;
}

function updateEquationDisplay() {
  markEquationTermsForAnimation();
}

function findTerm(terms, xPow) {
  return terms.find(t => t.xPow === xPow);
}

function addTerm(terms, factor, xPow) {
  let t = findTerm(terms, xPow);
  if (t) t.factor = addFactors(t.factor, factor);
  else terms.push({ factor, xPow });
}

let sqrtSolutions = null; // NYT: Gem begge løsninger hvis sqrt er brugt

function checkEquationSolved() {
  // x = tal eller tal = x
  if (sqrtSolutions) {
    // Hvis sqrt er brugt, godkend begge løsninger
    for (const sol of sqrtSolutions) {
      if (
        leftTerms.length === sol.left.length &&
        rightTerms.length === sol.right.length &&
        leftTerms[0].xPow === sol.left[0].xPow &&
        rightTerms[0].xPow === sol.right[0].xPow &&
        Math.abs(toNumber(leftTerms[0].factor) - toNumber(sol.left[0].factor)) < 1e-8 &&
        Math.abs(toNumber(rightTerms[0].factor) - toNumber(sol.right[0].factor)) < 1e-8
      ) {
        return true;
      }
    }
    return false;
  }
  if (leftTerms.length === 1 && rightTerms.length === 1) {
    const l = leftTerms[0], r = rightTerms[0];
    // x = tal
    if (l.xPow === 1 && l.factor === 1 && r.xPow === 0) return true;
    // tal = x
    if (l.xPow === 0 && r.xPow === 1 && r.factor === 1) return true;
    // tal = tal og ens
    if (l.xPow === 0 && r.xPow === 0 && l.factor === r.factor) return true;
  }
  return false;
}

function animateOperationToEquation(opText, targets) {
  const inputEl = document.getElementById("operationStep");
  const overlay = document.getElementById("animationOverlay");
  if (!inputEl || !overlay || !targets.length) return;

  // Find inputfeltets position
  const inputRect = inputEl.getBoundingClientRect();
  const containerRect = overlay.getBoundingClientRect();

  // For hver target (fx 2x og 10), lav en flyvende operation
  targets.forEach(target => {
    const targetRect = target.getBoundingClientRect();

    // Startposition: midt på inputfeltet
    const startX = inputRect.left + inputRect.width / 2 - containerRect.left;
    const startY = inputRect.top + inputRect.height / 2 - containerRect.top;

    // Slutposition: lige over target
    const endX = targetRect.left + targetRect.width / 2 - containerRect.left;
    const endY = targetRect.top - containerRect.top - 28; // lidt over

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

// NYT: Gør led i ligningen markerbare for animation
function markEquationTermsForAnimation() {
  // Gør alle led til spans med data-term-idx
  const eqSpan = document.getElementById("equationDisplay");
  if (!eqSpan) return;
  let html = formatEquation();
  // Marker alle tal og x-led med <span class="eq-term" data-term-idx="...">
  // Vi antager at formatEquation returnerer HTML uden spans, så vi kan wrappe led
  // For simplicity: wrap alle tal og x-led (fx 2x, 10, x, -3) med span
  html = html.replace(/([+-]?\d*\.?\d*x(\^\d+)?|[+-]?\d+(\.\d+)?)/g, '<span class="eq-term">$1</span>');
  eqSpan.innerHTML = html;
}

// NYT: Find relevante led i ligningen til animation
function findEquationTargets(opText) {
  // Fx: /2 skal ramme alle tal og x-led på begge sider
  // Vi vælger alle .eq-term i equationDisplay
  const eqSpan = document.getElementById("equationDisplay");
  if (!eqSpan) return [];
  const terms = Array.from(eqSpan.querySelectorAll(".eq-term"));
  // For /tal eller *tal: vælg alle tal og x-led
  if (/^[*/]/.test(opText)) {
    return terms;
  }
  // For +tal eller -tal: vælg kun tal-led (uden x)
  if (/^[+-]/.test(opText)) {
    return terms.filter(t => !t.textContent.includes("x"));
  }
  // Ellers: alle led
  return terms;
}



let currentLevel = 1;
let isCustomEq = false; // NYT: Om vi er i "Skriv selv"-tilstand

function updateLevelDisplay() {
  const levelDisplay = document.getElementById("levelDisplay");
  if (levelDisplay) {
    levelDisplay.textContent = isCustomEq ? "Skriv selv" : `Level: ${currentLevel}`;
  }
  // Marker valgt knap
  const btns = document.querySelectorAll("#levelBtns .level-btn");
  btns.forEach((btn, idx) => {
    if (isCustomEq && idx === 0) btn.classList.add("selected");
    else if (!isCustomEq && idx === currentLevel) btn.classList.add("selected");
    else btn.classList.remove("selected");
  });
  updateEquationDisplay();
}

// NYT: Funktion til at vise/skjule brugerinput
function showCustomEqInput(show) {
  document.getElementById("customEqInputRow").style.display = show ? "" : "none";
}

// NYT: Funktion til at håndtere brugerens ligning
function setCustomEquation(eqObj) {
  leftTerms = eqObj.left.map(t => ({ ...t }));
  rightTerms = eqObj.right.map(t => ({ ...t }));
  updateEquationDisplay();
  document.getElementById("historyList").innerHTML = "";
  const historyEntry = document.createElement("li");
  historyEntry.innerHTML = formatEquation();
  document.getElementById("historyList").appendChild(historyEntry);
  updateLevelDisplay();
}

function generateEquation(level) {
  isCustomEq = false;
  currentLevel = level;
  showCustomEqInput(false);
  // Brug random generator i stedet for array
  const eq = getRandomEquation(level);
  leftTerms = eq.left.map(t => ({ ...t }));
  rightTerms = eq.right.map(t => ({ ...t }));
  updateEquationDisplay();
  document.getElementById("historyList").innerHTML = "";
  const historyEntry = document.createElement("li");
  historyEntry.innerHTML = formatEquation(); // Brug innerHTML for brøker
  document.getElementById("historyList").appendChild(historyEntry);
  updateLevelDisplay();
}

// NYT: Funktion til at aktivere "Skriv selv"
function activateCustomEqMode() {
  isCustomEq = true;
  showCustomEqInput(true);
  leftTerms = [];
  rightTerms = [];
  updateEquationDisplay();
  document.getElementById("historyList").innerHTML = "";
  updateLevelDisplay();
}

document.addEventListener("DOMContentLoaded", function () {
  // Tilføj event listeners til de statiske level-knapper
  const levelBtns = document.querySelectorAll("#levelBtns .level-btn");
  levelBtns.forEach((btn, idx) => {
    if (idx === 0) {
      // Første knap er "Skriv selv"
      btn.addEventListener("click", function () {
        activateCustomEqMode();
      });
    } else {
      // Level-knapper (Level 1 = idx 1, Level 2 = idx 2, ...)
      btn.addEventListener("click", function () {
        generateEquation(idx);
      });
    }
  });

  generateEquation(1);

  const input = document.getElementById("operationStep");
  if (input) {
    input.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        applyStep();
      }
    });
  }

  // Tilføj event til "Næste ligning"-knap
  const nextBtn = document.getElementById("nextEquationBtn");
  if (nextBtn) {
    nextBtn.addEventListener("click", function () {
      generateEquation(currentLevel);
    });
  }

  // NYT: Tilføj event til "Skriv selv"-knap
  const customEqBtn = document.getElementById("customEqBtn");
  if (customEqBtn) {
    customEqBtn.addEventListener("click", function () {
      activateCustomEqMode();
    });
  }

  // NYT: Event for OK-knap til brugerinput
  const customEqOkBtn = document.getElementById("customEqOkBtn");
  if (customEqOkBtn) {
    customEqOkBtn.addEventListener("click", function () {
      const input = document.getElementById("customEqInput").value.trim();
      if (!input) {
        alert("Indtast en ligning, fx 2x-3=23-x");
        return;
      }
      try {
        const eqObj = window.parseUserEquation(input);
        setCustomEquation(eqObj);
      } catch (e) {
        alert("Kunne ikke forstå ligningen: " + e.message);
      }
    });
  }

  // NYT: Enter i inputfeltet for bruger-ligning
  const customEqInput = document.getElementById("customEqInput");
  if (customEqInput) {
    customEqInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        customEqOkBtn.click();
      }
    });
  }

  const undoBtn = document.getElementById("undoStepBtn");
  if (undoBtn) {
    undoBtn.addEventListener("click", function () {
      window.undoStep();
    });
  }
});

// Hjælpefunktioner til brøker
function isFraction(val) {
  return typeof val === "object" && val !== null && "num" in val && "den" in val;
}
function toNumber(val) {
  return isFraction(val) ? val.num / val.den : val;
}
function addFactors(a, b) {
  if (isFraction(a) && isFraction(b)) return { num: a.num * b.den + b.num * a.den, den: a.den * b.den };
  if (isFraction(a)) return { num: a.num + b * a.den, den: a.den };
  if (isFraction(b)) return { num: a * b.den + b.num, den: b.den };
  return a + b;
}
function mulFactors(a, b) {
  if (isFraction(a) && isFraction(b)) return { num: a.num * b.num, den: a.den * b.den };
  if (isFraction(a)) return { num: a.num * b, den: a.den };
  if (isFraction(b)) return { num: a * b.num, den: b.den };
  return a * b;
}
function powAdd(xPow, powMul) { return xPow + powMul; }
function absFactor(factor) {
  return isFraction(factor) ? { num: Math.abs(factor.num), den: Math.abs(factor.den) } : Math.abs(factor);
}
function signFactor(factor) {
  return isFraction(factor) ? Math.sign(factor.num / factor.den) : Math.sign(factor);
}
