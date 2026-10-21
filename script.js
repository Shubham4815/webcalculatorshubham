
"use strict";

const display = document.getElementById("display");
const buttons = document.querySelectorAll("[data-value]");
const clearButton = document.getElementById("clear");
const deleteButton = document.getElementById("delete");
const equalsButton = document.getElementById("equals");

let expression = "";
let justCalculated = false;

function updateDisplay() {
  display.value = expression || "0";
}

function appendValue(value) {
  if (justCalculated && /[0-9.]/.test(value)) {
    expression = "";
  }

  justCalculated = false;

  if (value === ".") {
    const currentNumber = expression.split(/[+\-*/%]/).pop();
    if (currentNumber.includes(".")) return;
    if (!currentNumber) value = "0.";
  }

  expression += value;
  updateDisplay();
}

function clearCalculator() {
  expression = "";
  justCalculated = false;
  updateDisplay();
}

function deleteLast() {
  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
}

// Safe arithmetic parser: does not use eval()
function calculate(input) {
  const tokens = input.match(
    /\d*\.?\d+(?:e[+-]?\d+)?|[()+\-*/%]/gi
  );

  if (!tokens || tokens.join("") !== input.replace(/\s/g, "")) {
    throw new Error("Invalid expression");
  }

  let pos = 0;

  function primary() {
    const token = tokens[pos++];

    if (token === "+") return primary();
    if (token === "-") return -primary();

    if (token === "(") {
      const value = addSub();
      if (tokens[pos++] !== ")") throw new Error("Missing )");
      return value;
    }

    const number = Number(token);
    if (!Number.isFinite(number)) throw new Error("Invalid number");
    return number;
  }

  function percent() {
    let value = primary();
    while (tokens[pos] === "%") {
      pos++;
      value /= 100;
    }
    return value;
  }

  function mulDiv() {
    let value = percent();

    while (tokens[pos] === "*" || tokens[pos] === "/") {
      const operator = tokens[pos++];
      const right = percent();

      if (operator === "/" && right === 0) {
        throw new Error("Cannot divide by zero");
      }

      value = operator === "*" ? value * right : value / right;
    }

    return value;
  }

  function addSub() {
    let value = mulDiv();

    while (tokens[pos] === "+" || tokens[pos] === "-") {
      const operator = tokens[pos++];
      const right = mulDiv();
      value = operator === "+" ? value + right : value - right;
    }

    return value;
  }

  const result = addSub();

  if (pos !== tokens.length || !Number.isFinite(result)) {
    throw new Error("Invalid expression");
  }

  return result;
}

function showResult() {
  if (!expression) return;

  try {
    const result = calculate(expression);
    expression = String(Number(result.toPrecision(12)));
    justCalculated = true;
    updateDisplay();
  } catch (error) {
    display.value = error.message === "Cannot divide by zero"
      ? "Cannot divide by zero"
      : "Invalid expression";
    expression = "";
    justCalculated = false;
  }
}

// Number and operator buttons
buttons.forEach((button) => {
  button.addEventListener("click", () => {
    appendValue(button.dataset.value);
  });
});

clearButton.addEventListener("click", clearCalculator);
deleteButton.addEventListener("click", deleteLast);
equalsButton.addEventListener("click", showResult);

// Keyboard support
document.addEventListener("keydown", (event) => {
  const key = event.key;

  if (/^[0-9.+\-*/%()]$/.test(key)) {
    appendValue(key);
  } else if (key === "Enter" || key === "=") {
    event.preventDefault();
    showResult();
  } else if (key === "Backspace") {
    deleteLast();
  } else if (key === "Escape") {
    clearCalculator();
  }
});

updateDisplay();
