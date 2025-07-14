// Funktion der genererer en tilfældig ligning for et givet niveau

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomFraction(minNum, maxNum, minDen, maxDen) {
  // Returner et simpelt brøktal (positiv eller negativ)
  let num = getRandomInt(minNum, maxNum);
  let den = getRandomInt(minDen, maxDen);
  // Undgå 0 i nævner og 1/1
  while (den === 0 || Math.abs(num) === Math.abs(den)) {
    num = getRandomInt(minNum, maxNum);
    den = getRandomInt(minDen, maxDen);
  }
  // Forkort brøken hvis muligt
  function gcd(a, b) { return b ? gcd(b, a % b) : Math.abs(a); }
  const divisor = gcd(num, den);
  return { num: num / divisor, den: den / divisor };
}

function getRandomEquation(level) {
  if (level === 1) {
    // 1. Niveau: ax + b = c, a=1..6, b=0..10, c=0..20
    const a = getRandomInt(1, 5);
    const b = getRandomInt(1, 10);
    const x = getRandomInt(5, 10);
    const c = a * x + b;
    return {
      left: [ { factor: a, xPow: 1 }, { factor: b, xPow: 0 } ],
      right: [ { factor: c, xPow: 0 } ]
    };
  }
  if (level === 2) {
    // 2. Niveau: ax + b = c, a=2..12, b=-10..10, c=0..30
    const a = getRandomInt(2, 12);
    const b = getRandomInt(-10, 10);
    const x = getRandomInt(-8, 12);
    const c = a * x + b;
    return {
      left: [ { factor: a, xPow: 1 }, { factor: b, xPow: 0 } ],
      right: [ { factor: c, xPow: 0 } ]
    };
  }
  if (level === 3) {
    // 3. Niveau: ax + b = dx + e, a,d=1..10, b,e=-15..15, x=-10..15
    let a = getRandomInt(1, 10);
    let d = getRandomInt(1, 10);
    // Undgå a==d for at sikre x på begge sider
    while (a === d) d = getRandomInt(1, 10);
    const b = getRandomInt(-15, 15);
    const e = getRandomInt(-15, 15);
    const x = getRandomInt(-10, 15);
    const leftVal = a * x + b;
    const rightVal = d * x + e;
    return {
      left: [ { factor: a, xPow: 1 }, { factor: b, xPow: 0 } ],
      right: [ { factor: d, xPow: 1 }, { factor: e, xPow: 0 } ]
    };
  }
  if (level === 4) {
    // Level 4: 50% a/x (tal i tæller, x i nævner), 50% x/a (x i tæller, tal i nævner)
    let leftHasX = Math.random() < 0.5;
    let useXOverA = Math.random() < 0.5; // NYT: 50% chance for x/a
    let num = getRandomInt(2, 8);
    let factor = Math.random() < 0.5 ? num : -num;
    let leftTerm = null, rightTerm = null;

    if (useXOverA) {
      // x/a eller -x/a eller fx 3x/5
      let den = getRandomInt(2, 8);
      let numX = Math.random() < 0.5 ? 1 : getRandomInt(2, 5);
      let sign = Math.random() < 0.5 ? 1 : -1;
      let term = { factor: { num: sign * numX, den: den }, xPow: 1 };
      if (leftHasX) {
        leftTerm = term;
        rightTerm = null;
      } else {
        leftTerm = null;
        rightTerm = term;
      }
    } else {
      // a/x eller -a/x
      if (leftHasX) {
        leftTerm = { factor: factor, xPow: -1, fracX: true };
        rightTerm = null;
      } else {
        leftTerm = null;
        rightTerm = { factor: factor, xPow: -1, fracX: true };
      }
    }

    const b = getRandomInt(-20, 20);
    const e = getRandomInt(-20, 20);

    return {
      left: [
        ...(leftTerm ? [leftTerm] : []),
        { factor: b, xPow: 0 }
      ],
      right: [
        ...(rightTerm ? [rightTerm] : []),
        { factor: e, xPow: 0 }
      ]
    };
  }
  // fallback
  return {
    left: [ { factor: 1, xPow: 1 } ],
    right: [ { factor: 1, xPow: 0 } ]
  };
}

/**
 * Parser en ligning fra tekst til det format appen bruger.
 * Fx: "2x-3=23-x" => { left: [...], right: [...] }
 */
function parseUserEquation(input) {
  // Fjern mellemrum
  input = input.replace(/\s+/g, '');
  // Split ved '='
  const [leftStr, rightStr] = input.split('=');
  if (!leftStr || !rightStr) {
    throw new Error('Ugyldig ligning. Husk =');
  }

  // Hjælpefunktion til at parse en side af ligningen
  function parseSide(str) {
    // Find alle led, fx 2x, -3, -x, +5x
    // Matcher fx: +2x, -x, 3, -4x, +7
    const terms = [];
    const regex = /([+-]?[^+-]+)/g;
    let match;
    while ((match = regex.exec(str)) !== null) {
      let term = match[1];
      // NYT: Tjek om det er x^n-led, fx 2x^2, -x^3, x^4, -3x^5
      let powMatch = term.match(/^([+-]?[\d]*)x\^(\d+)$/);
      if (powMatch) {
        let factor = powMatch[1];
        if (factor === '' || factor === '+') factor = 1;
        else if (factor === '-') factor = -1;
        else factor = parseInt(factor, 10);
        let xPow = parseInt(powMatch[2], 10);
        terms.push({ factor, xPow });
        continue;
      }
      // Tjek om det er x-led
      let xMatch = term.match(/^([+-]?[\d]*)x$/);
      if (xMatch) {
        let factor = xMatch[1];
        if (factor === '' || factor === '+') factor = 1;
        else if (factor === '-') factor = -1;
        else factor = parseInt(factor, 10);
        terms.push({ factor, xPow: 1 });
        continue;
      }
      // Tjek om det er konstant led
      let numMatch = term.match(/^([+-]?[\d]+)$/);
      if (numMatch) {
        terms.push({ factor: parseInt(numMatch[1], 10), xPow: 0 });
        continue;
      }
      // Tjek om det er brøk med x i nævner fx 3/x eller -2/x
      let fracMatch = term.match(/^([+-]?[\d]+)\/x$/);
      if (fracMatch) {
        terms.push({ factor: parseInt(fracMatch[1], 10), xPow: -1, fracX: true });
        continue;
      }
      // Tjek om det er bare x (dvs. 1x)
      if (term === 'x') {
        terms.push({ factor: 1, xPow: 1 });
        continue;
      }
      if (term === '-x') {
        terms.push({ factor: -1, xPow: 1 });
        continue;
      }
      // NYT: Tjek om det er x/tal eller -x/tal (fx x/2 eller -x/5)
      let xOverMatch = term.match(/^([+-]?)(x)\/(\d+)$/);
      if (xOverMatch) {
        let sign = xOverMatch[1] === '-' ? -1 : 1;
        let den = parseInt(xOverMatch[3], 10);
        terms.push({ factor: { num: sign, den: den }, xPow: 1 });
        continue;
      }
      // NYT: Tjek om det er kx/tal eller -kx/tal (fx 5x/2 eller -3x/4)
      let kxOverMatch = term.match(/^([+-]?\d+)x\/(\d+)$/);
      if (kxOverMatch) {
        let k = parseInt(kxOverMatch[1], 10);
        let den = parseInt(kxOverMatch[2], 10);
        terms.push({ factor: { num: k, den: den }, xPow: 1 });
        continue;
      }
      // Hvis ikke genkendt, ignorer eller kast fejl
      throw new Error('Ugyldigt led: ' + term);
    }
    return terms;
  }

  return {
    left: parseSide(leftStr),
    right: parseSide(rightStr)
  };
}

// Gør funktionen globalt tilgængelig
window.getRandomEquation = getRandomEquation;
window.parseUserEquation = parseUserEquation;