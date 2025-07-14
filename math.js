// Matematik og state (alt undtagen UI/event-håndtering)

window.leftTerms = [ { factor: 1, xPow: 1 }, { factor: 3, xPow: 0 } ];
window.rightTerms = [ { factor: 7, xPow: 0 } ];
window.sqrtSolutions = null;
window.currentLevel = 1;
window.isCustomEq = false;
window.equationHistory = []; // [{ left, right, sqrtSolutions, inputStr }]
window.hideStepExplanation = false;

function cloneTerms(terms) {
  return terms.map(t => ({ factor: t.factor, xPow: t.xPow }));
}

function combineTerms(terms) {
  let map = {};
  let order = []; // NYT: Gem rækkefølge
  for (let t of terms) {
    let key = t.xPow;
    if (t.fracX && t.xPow === 1 && t.den) key = `xOver${t.den}`;
    else if (t.fracX && t.xPow === -1) key = `aOverX`;
    if (!map[key]) {
      map[key] = { ...t };
      order.push(key); // NYT: Gem rækkefølge
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
  // NYT: Bevar rækkefølge, ingen sortering!
  let combined = order
    .map(key => map[key])
    .filter(t => toNumber(t.factor) !== 0);

  combined = combined.map(t => {
    if (
      t.xPow === 1 &&
      typeof t.factor === "object" &&
      t.factor !== null &&
      "num" in t.factor &&
      "den" in t.factor
    ) {
      if (t.factor.num % t.factor.den === 0) {
        return { factor: t.factor.num / t.factor.den, xPow: 1 };
      }
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
  return `${formatSide(window.leftTerms)} = ${formatSide(window.rightTerms)}`;
}

function formatNumber(n) {
  if (typeof n !== "number") return n;
  if (Number.isInteger(n)) return n.toString();
  return n.toFixed(2);
}

function formatTerm(term) {
  if (term.factor === 0) return "";
  if (term.fracX && term.xPow === 1 && term.den) {
    let numStr = "";
    if (term.factor === 1) numStr = "x";
    else if (term.factor === -1) numStr = "-x";
    else numStr = `${formatNumber(term.factor)}x`;
    return `<span class="frac"><span class="num">${numStr}</span><span class="fracbar"></span><span class="den">${formatNumber(term.den)}</span></span>`;
  }
  if (term.fracX && term.xPow === -1 && term.factor) {
    return `<span class="frac"><span class="num">${formatNumber(term.factor)}</span><span class="fracbar"></span><span class="den">x</span></span>`;
  }
  if (term.xPow === -1) {
    if (term.factor === 1) {
      return `<span class="frac"><span class="num">1</span><span class="fracbar"></span><span class="den">x</span></span>`;
    }
    if (term.factor === -1) {
      return `<span class="frac"><span class="num">-1</span><span class="fracbar"></span><span class="den">x</span></span>`;
    }
    return `<span class="frac"><span class="num">${formatNumber(term.factor)}</span><span class="fracbar"></span><span class="den">x</span></span>`;
  }
  if (typeof term.factor === "object" && term.factor !== null && "num" in term.factor && "den" in term.factor) {
    const num = term.factor.num;
    const den = term.factor.den;
    if (term.xPow === 0) return `<span class="frac"><span class="num">${formatNumber(num)}</span><span class="fracbar"></span><span class="den">${formatNumber(den)}</span></span>`;
    if (term.xPow === 1) {
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
  if (term.factor === 1) return `x<sup>${term.xPow}</sup>`;
  if (term.factor === -1) return `-x<sup>${term.xPow}</sup>`;
  return `${formatNumber(term.factor)}x<sup>${term.xPow}</sup>`;
}

function updateEquationDisplay() {
  const eqSpan = document.getElementById("equationDisplay");
  if (!eqSpan) return;
  eqSpan.innerHTML = formatEquation();
}

function findTerm(terms, xPow) {
  return terms.find(t => t.xPow === xPow);
}

function addTerm(terms, factor, xPow) {
  let t = findTerm(terms, xPow);
  if (t) t.factor = addFactors(t.factor, factor);
  else terms.push({ factor, xPow });
}

function checkEquationSolved() {
  if (window.sqrtSolutions) {
    for (const sol of window.sqrtSolutions) {
      if (
        window.leftTerms.length === sol.left.length &&
        window.rightTerms.length === sol.right.length &&
        window.leftTerms[0].xPow === sol.left[0].xPow &&
        window.rightTerms[0].xPow === sol.right[0].xPow &&
        Math.abs(toNumber(window.leftTerms[0].factor) - toNumber(sol.left[0].factor)) < 1e-8 &&
        Math.abs(toNumber(window.rightTerms[0].factor) - toNumber(sol.right[0].factor)) < 1e-8
      ) {
        return true;
      }
    }
    return false;
  }
  if (window.leftTerms.length === 1 && window.rightTerms.length === 1) {
    const l = window.leftTerms[0], r = window.rightTerms[0];
    if (l.xPow === 1 && l.factor === 1 && r.xPow === 0) return true;
    if (l.xPow === 0 && r.xPow === 1 && r.factor === 1) return true;
    if (l.xPow === 0 && r.xPow === 0 && l.factor === r.factor) return true;
  }
  return false;
}

function generateStepExplanation(inputStr, beforeEq, afterEq) {
  // Only show the calculation where the operation happens
  const op = inputStr.trim().toLowerCase();
  if (op === "sqrt") {
    const [left, right] = beforeEq.split(" = ");
    return `<b>√(${left}) = √(${right})</b>`;
  }
  const operation = op.charAt(0);
  let stepStr = op.slice(1).replace(",", ".").toLowerCase();
  let xMatch = stepStr.match(/^(-?\d*\.?\d*)x(\^(\d+))?$/);
  let pow = 0;
  let opVis = "";
  let isXOp = false;
  if (xMatch) {
    pow = xMatch[3] ? parseInt(xMatch[3]) : 1;
    opVis = (xMatch[1] === "" ? "" : xMatch[1]) + "x" + (pow > 1 ? "^" + pow : "");
    isXOp = true;
  } else {
    opVis = stepStr;
  }
  let opSymbol = "";
  if (operation === "+" || operation === "-") {
    opSymbol = `${operation}${opVis}`;
  } else if (operation === "*") {
    opSymbol = `⋅${opVis}`;
  } else if (operation === "/") {
    opSymbol = `÷${opVis}`;
  }
  let beforeSides = beforeEq.split(" = ");

  function highlightTerms(side, isXOp, operation, isLeft) {
    if (operation === "*" || operation === "/") {
      side = side.replace(/([+-]?\d*\.?\d*x?)\/(\d+)/g, (term, num, den) => {
        return `<u>${num}${opSymbol}</u>/${den}`;
      });
      return side.replace(/([+-]?\d*\.?\d*x(\^\d+)?|[+-]?\d+(\.\d+)?)(?!\/\d+)/g, (term) => {
        return `<u>${term}${opSymbol}</u>`;
      });
    } else if (operation === "+" || operation === "-") {
      if (isXOp) {
        let foundXTerm = /([+-]?\d*\.?\d*x(\^\d+)?)/.test(side);
        if (foundXTerm) {
          return side.replace(/([+-]?\d*\.?\d*x(\^\d+)?)/g, (term) => `<u>${term}${opSymbol}</u>`);
        } else {
          // Opdateret: Tilføj operationen bagerst på højre side
          return isLeft ? side : `${side} <u>${opSymbol}</u>`;
        }
      } else {
        return side.replace(/([+-]?\d+(\.\d+)?)(?!x)/g, (term) => `<u>${term}${opSymbol}</u>`);
      }
    }
    return side;
  }

  let leftHighlighted = highlightTerms(beforeSides[0], isXOp, operation, true);
  let rightHighlighted = highlightTerms(beforeSides[1], isXOp, operation, false);

  let calcStr = `${leftHighlighted} = ${rightHighlighted}`;
  return `<b>${calcStr}</b>`;
}

// Gem nuværende tilstand og input
function saveHistory(inputStr) {
  window.equationHistory.push({
    left: JSON.parse(JSON.stringify(window.leftTerms)),
    right: JSON.parse(JSON.stringify(window.rightTerms)),
    sqrtSolutions: window.sqrtSolutions ? JSON.parse(JSON.stringify(window.sqrtSolutions)) : null,
    inputStr: inputStr || ""
  });
}

// Fortryd: gå ét trin tilbage i historik og genskab input
function undoStep() {
  if (window.equationHistory.length < 2) return;
  window.equationHistory.pop();
  const prev = window.equationHistory[window.equationHistory.length - 1];
  window.leftTerms = JSON.parse(JSON.stringify(prev.left));
  window.rightTerms = JSON.parse(JSON.stringify(prev.right));
  window.sqrtSolutions = prev.sqrtSolutions ? JSON.parse(JSON.stringify(prev.sqrtSolutions)) : null;
  updateEquationDisplay();
  // Sæt inputfeltet til forrige input hvis muligt
  const inputEl = document.getElementById("operationStep");
  if (inputEl) inputEl.value = prev.inputStr || "";
  // Fjern sidste historyList element (kun <li>)
  const list = document.getElementById("historyList");
  if (list && list.children.length) {
    list.removeChild(list.children[list.children.length - 1]);
  }
}

function applyStep() {
  const inputStr = document.getElementById("operationStep").value.trim();
  if (inputStr.length < 1) {
    alert("Please enter a valid operation, e.g. +3, -2x, /2, *x or sqrt");
    return;
  }

  // Gem nuværende tilstand og input FØR trinnet udføres
  saveHistory(inputStr);

  const before = formatEquation();

  if (inputStr.toLowerCase() === "sqrt") {
    if (
      window.leftTerms.length === 1 &&
      window.rightTerms.length === 1 &&
      (
        (window.leftTerms[0].xPow === 0 && window.rightTerms[0].xPow === 0) ||
        (window.leftTerms[0].xPow === 2 && window.rightTerms[0].xPow === 0) ||
        (window.leftTerms[0].xPow === 0 && window.rightTerms[0].xPow === 2)
      )
    ) {
      let l = window.leftTerms[0], r = window.rightTerms[0];
      window.sqrtSolutions = null;
      let sqrtStepText = "";
      let isSolved = false;

      if (l.xPow === 2 && r.xPow === 0) {
        if (typeof l.factor === "number" && typeof r.factor === "number") {
          window.leftTerms = [{ factor: 1, xPow: 1 }];
          window.rightTerms = [{ factor: Math.sqrt(r.factor), xPow: 0 }];
          window.sqrtSolutions = [
            { left: [{ factor: 1, xPow: 1 }], right: [{ factor: Math.sqrt(r.factor), xPow: 0 }] },
            { left: [{ factor: 1, xPow: 1 }], right: [{ factor: -Math.sqrt(r.factor), xPow: 0 }] }
          ];
          sqrtStepText = `x = ${formatNumber(Math.sqrt(r.factor))} eller x = ${formatNumber(-Math.sqrt(r.factor))}`;
        }
        if (window.leftTerms.length === 1 && window.rightTerms.length === 1 &&
            window.leftTerms[0].xPow === 1 && window.rightTerms[0].xPow === 0) {
          isSolved = true;
        }
      } else if (l.xPow === 0 && r.xPow === 2) {
        if (typeof l.factor === "number" && typeof r.factor === "number") {
          window.leftTerms = [{ factor: Math.sqrt(l.factor), xPow: 0 }];
          window.rightTerms = [{ factor: 1, xPow: 1 }];
          window.sqrtSolutions = [
            { left: [{ factor: Math.sqrt(l.factor), xPow: 0 }], right: [{ factor: 1, xPow: 1 }] },
            { left: [{ factor: -Math.sqrt(l.factor), xPow: 0 }], right: [{ factor: 1, xPow: 1 }] }
          ];
          sqrtStepText = `x = ${formatNumber(Math.sqrt(l.factor))} eller x = ${formatNumber(-Math.sqrt(l.factor))}`;
        }
        if (window.leftTerms.length === 1 && window.rightTerms.length === 1 &&
            window.leftTerms[0].xPow === 0 && window.rightTerms[0].xPow === 1) {
          isSolved = true;
        }
      } else if (l.xPow === 0 && r.xPow === 0) {
        if (typeof l.factor === "number" && typeof r.factor === "number") {
          window.leftTerms = [{ factor: Math.sqrt(l.factor), xPow: 0 }];
          window.rightTerms = [{ factor: Math.sqrt(r.factor), xPow: 0 }];
          window.sqrtSolutions = null;
          sqrtStepText = `${formatNumber(Math.sqrt(l.factor))} = ${formatNumber(Math.sqrt(r.factor))}`;
        }
        if (window.leftTerms.length === 1 && window.rightTerms.length === 1 &&
            window.leftTerms[0].xPow === 0 && window.rightTerms[0].xPow === 0 &&
            window.leftTerms[0].factor === window.rightTerms[0].factor) {
          isSolved = true;
        }
      } else {
        alert("sqrt can only be used for equations of the form x^2=a, a=x^2 or a=b");
        return;
      }

      updateEquationDisplay();

      const historyEntry = document.createElement("li");
      if (window.sqrtSolutions) {
        if (
          window.leftTerms.length === 1 && window.rightTerms.length === 1 &&
          ((window.leftTerms[0].xPow === 1 && window.rightTerms[0].xPow === 0) ||
           (window.leftTerms[0].xPow === 0 && window.rightTerms[0].xPow === 1))
        ) {
          historyEntry.innerHTML = formatEquation() + " (√ on both sides) <br>Solutions: " + sqrtStepText;
        } else {
          historyEntry.innerHTML = formatEquation() + " (√ on both sides) <br>Solutions: " +
            window.sqrtSolutions.map(sol =>
              `${formatEquationSide(sol.left)} = ${formatEquationSide(sol.right)}`
            ).join(" or ");
        }
      } else {
        historyEntry.innerHTML = formatEquation() + " (√ on both sides)";
      }
      // Tilføj forklaring direkte under trinet, foldbar ved klik
      const exp = document.createElement("div");
      exp.className = "step-explanation-inline";
      exp.innerHTML = generateStepExplanation(inputStr, before, formatEquation());
      exp.style.display = "none";
      historyEntry.appendChild(exp);
      historyEntry.classList.add("step-collapsible");
      historyEntry.addEventListener("click", function (e) {
        if (e.target.tagName === "A" || e.target.classList.contains("step-explanation-inline")) return;
        exp.style.display = exp.style.display === "none" ? "block" : "none";
        historyEntry.classList.toggle("open", exp.style.display === "block");
      });

      if (isSolved) {
        historyEntry.style.background = "#c8ffc8";
        historyEntry.innerHTML += " ✔️";
      }
      document.getElementById("historyList").appendChild(historyEntry);

      document.getElementById("operationStep").value = "";
      return;
    } else {
      alert("sqrt can only be used if both sides have one term and the form x^2=a, a=x^2 or a=b");
      return;
    }
  }

  const operation = inputStr.charAt(0);
  let stepStr = inputStr.slice(1).replace(",", ".").toLowerCase();

  let xMatch = stepStr.match(/^(-?\d*\.?\d*)x(\^(\d+))?$/);
  let step = 0, isXOp = false, factor = 1, pow = 0;
  if (xMatch) {
    isXOp = true;
    factor = xMatch[1] === "" || xMatch[1] === "-" ? (xMatch[1] === "-" ? -1 : 1) : parseFloat(xMatch[1]);
    pow = xMatch[3] ? parseInt(xMatch[3]) : 1;
  } else {
    step = parseFloat(stepStr);
    if (isNaN(step)) {
      alert("Please enter a valid number or x-term after the operation, e.g. +3, -2x, /2, *x");
      return;
    }
    pow = 0;
  }

  if (operation === "+" || operation === "-") {
    let sign = operation === "+" ? 1 : -1;
    if (isXOp) {
      addTerm(window.leftTerms, mulFactors(sign, factor), pow);
      addTerm(window.rightTerms, mulFactors(sign, factor), pow);
    } else {
      addTerm(window.leftTerms, sign * step, 0);
      addTerm(window.rightTerms, sign * step, 0);
    }
  } else if (operation === "*" || operation === "/") {
    let mul, powMul;
    if (operation === "*") {
      mul = isXOp ? factor : step;
      powMul = isXOp ? pow : 0;
    } else {
      if ((isXOp && toNumber(factor) === 0) || (!isXOp && step === 0)) {
        alert("Cannot divide by zero.");
        return;
      }
      if (isXOp) {
        if (isFraction(factor)) {
          mul = { num: factor.den, den: factor.num };
        } else {
          mul = 1 / factor;
        }
        powMul = -pow;
      } else {
        mul = 1 / step;
        powMul = 0;
      }
    }
    window.leftTerms = window.leftTerms.map(t => ({
      factor: mulFactors(t.factor, mul),
      xPow: powAdd(t.xPow, powMul)
    }));
    window.rightTerms = window.rightTerms.map(t => ({
      factor: mulFactors(t.factor, mul),
      xPow: powAdd(t.xPow, powMul)
    }));
  } else {
    alert("Only +, -, *, / with x-terms or numbers are allowed.");
    return;
  }

  window.leftTerms = combineTerms(window.leftTerms);
  window.rightTerms = combineTerms(window.rightTerms);

  updateEquationDisplay();

  const historyEntry = document.createElement("li");
  historyEntry.innerHTML = formatEquation() + `   ( ${operation}${isXOp ? (factor === 1 && pow === 1 ? "x" : formatNumber(factor) + (pow > 1 ? "x^" + pow : "x")) : formatNumber(step)} on both sides)`;

  // Tilføj forklaring som dropdown, kun hvis window.hideStepExplanation er false
  if (!window.hideStepExplanation) {
    const details = document.createElement("details");
    details.className = "step-explanation";
    const summary = document.createElement("summary");
    summary.textContent = "Explanation";
    details.appendChild(summary);
    const exp = document.createElement("div");
    exp.innerHTML = generateStepExplanation(inputStr, before, formatEquation());
    details.appendChild(exp);
    historyEntry.appendChild(details);
  }

  if (checkEquationSolved()) {
    historyEntry.style.background = "#c8ffc8";
    historyEntry.innerHTML += " ✔️";
  }

  document.getElementById("historyList").appendChild(historyEntry);

  document.getElementById("operationStep").value = "";
}

function formatEquationSide(terms) {
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

function hasDivision(terms) {
  return terms.some(t => t.xPow === -1 || (typeof t.factor === "object" && t.factor !== null && "den" in t.factor));
}

// UI-relaterede funktioner, så script.js kan kalde dem
function setCustomEquation(eqObj) {
  window.leftTerms = eqObj.left.map(t => ({ ...t }));
  window.rightTerms = eqObj.right.map(t => ({ ...t }));
  window.sqrtSolutions = null;
  window.equationHistory = [];
  // Skjul forklaring hvis brugerens ligning indeholder division
  window.hideStepExplanation = hasDivision(window.leftTerms) || hasDivision(window.rightTerms);
  saveHistory();
  updateEquationDisplay();
  document.getElementById("historyList").innerHTML = "";
  const historyEntry = document.createElement("li");
  historyEntry.innerHTML = formatEquation();
  document.getElementById("historyList").appendChild(historyEntry);
  updateLevelDisplay();
}

function generateEquation(level) {
  window.isCustomEq = false;
  window.currentLevel = level;
  showCustomEqInput(false);
  const eq = getRandomEquation(level);
  window.leftTerms = eq.left.map(t => ({ ...t }));
  window.rightTerms = eq.right.map(t => ({ ...t }));
  window.sqrtSolutions = null;
  window.equationHistory = [];
  // Skjul forklaring kun for level 4
  window.hideStepExplanation = (level === 4);
  saveHistory();
  updateEquationDisplay();
  document.getElementById("historyList").innerHTML = "";
  const historyEntry = document.createElement("li");
  historyEntry.innerHTML = formatEquation();
  document.getElementById("historyList").appendChild(historyEntry);
  updateLevelDisplay();
}

function activateCustomEqMode() {
  window.isCustomEq = true;
  showCustomEqInput(true);
  window.leftTerms = [];
  window.rightTerms = [];
  updateEquationDisplay();
  document.getElementById("historyList").innerHTML = "";
  updateLevelDisplay();
}

function updateLevelDisplay() {
  const levelDisplay = document.getElementById("levelDisplay");
  if (levelDisplay) {
    levelDisplay.textContent = window.isCustomEq ? "Write yourself" : `Level: ${window.currentLevel}`;
  }
  const btns = document.querySelectorAll("#levelBtns .level-btn");
  btns.forEach((btn, idx) => {
    if (window.isCustomEq && idx === 0) btn.classList.add("selected");
    else if (!window.isCustomEq && idx === window.currentLevel) btn.classList.add("selected");
    else btn.classList.remove("selected");
  });
  updateEquationDisplay();
}

function showCustomEqInput(show) {
  document.getElementById("customEqInputRow").style.display = show ? "" : "none";
}

// Eksportér alt til window
window.cloneTerms = cloneTerms;
window.combineTerms = combineTerms;
window.formatEquation = formatEquation;
window.formatNumber = formatNumber;
window.formatTerm = formatTerm;
window.updateEquationDisplay = updateEquationDisplay;
window.findTerm = findTerm;
window.addTerm = addTerm;
window.checkEquationSolved = checkEquationSolved;
window.applyStep = applyStep;
window.isFraction = isFraction;
window.toNumber = toNumber;
window.addFactors = addFactors;
window.mulFactors = mulFactors;
window.powAdd = powAdd;
window.absFactor = absFactor;
window.signFactor = signFactor;
window.setCustomEquation = setCustomEquation;
window.generateEquation = generateEquation;
window.activateCustomEqMode = activateCustomEqMode;
window.updateLevelDisplay = updateLevelDisplay;
window.showCustomEqInput = showCustomEqInput;
window.saveHistory = saveHistory;
window.undoStep = undoStep;
