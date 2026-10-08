// State Variables
// State Variables
let currentInput = '0';
let previousInput = '';
let operator = null;
let shouldResetDisplay = false;
let history = []; // Fixed: Array to hold calculation history

// DOM Elements
const resultDisplay = document.getElementById('result');
const expressionDisplay = document.getElementById('expression');
const themeToggleBtn = document.getElementById('theme-toggle-btn');
const historyList = document.getElementById('history-list'); // Fixed: DOM element for history list
const historyPanel = document.getElementById('history-panel'); // Fixed: DOM element for history panel

// Update Screen Display
function updateDisplay() {
  resultDisplay.textContent = formatNumber(currentInput);
  if (operator !== null) {
    expressionDisplay.textContent = `${formatNumber(previousInput)} ${operator}`;
  } else {
    expressionDisplay.textContent = previousInput ? expressionDisplay.textContent : '';
  }
}

// Format number with commas for readability
function formatNumber(numStr) {
  if (numStr === '' || numStr === 'Error') return numStr;
  const parts = numStr.split('.');
  
  const isNegative = parts[0].startsWith('-');
  const rawInt = isNegative ? parts[0].slice(1) : parts[0];
  
  const formattedInt = rawInt ? Number(rawInt).toLocaleString('en-US', { maximumFractionDigits: 10 }) : '';
  parts[0] = isNegative ? '-' + formattedInt : formattedInt;
  
  return parts.join('.');
}

// Number Input Handler
function appendNumber(number) {
  if (currentInput === '0' || shouldResetDisplay) {
    currentInput = number === '.' ? '0.' : number;
    shouldResetDisplay = false;
  } else {
    if (number === '.' && currentInput.includes('.')) return;
    if (currentInput.length >= 12) return; // Prevent text overflow
    currentInput += number;
  }
  updateDisplay();
}

// Operator Selection Handler
function handleOperator(op) {
  if (operator !== null && !shouldResetDisplay) {
    calculate();
  }
  previousInput = currentInput;
  operator = op;
  shouldResetDisplay = true;
  updateDisplay();
}

// Calculation Engine
function calculate() {
  if (operator === null || shouldResetDisplay) return;

  const prev = parseFloat(previousInput);
  const curr = parseFloat(currentInput);
  let result = 0;

  if (isNaN(prev) || isNaN(curr)) return;

  switch (operator) {
    case '+':
      result = prev + curr;
      break;
    case '−':
      result = prev - curr;
      break;
    case '×':
      result = prev * curr;
      break;
    case '÷':
      if (curr === 0) {
        currentInput = 'Error';
        updateDisplay();
        return;
      }
      result = prev / curr;
      break;
    default:
      return;
  }

  // Handle rounding issues with floating-point arithmetic
  result = Math.round(result * 1e10) / 1e10;

  const expString = `${previousInput} ${operator} ${currentInput}`;
  currentInput = String(result);
  
  // Log to history
  addHistory(expString, currentInput);

  operator = null;
  expressionDisplay.textContent = `${expString} =`;
  shouldResetDisplay = true;
  updateDisplay();
}

// Special Actions
function handleAction(action) {
  let val = parseFloat(currentInput) || 0;

  switch (action) {
    case 'clear':
      currentInput = '0';
      previousInput = '';
      operator = null;
      expressionDisplay.textContent = '';
      break;

    case 'delete':
      if (shouldResetDisplay) return;
      currentInput = currentInput.slice(0, -1);
      if (currentInput === '' || currentInput === '-') currentInput = '0';
      break;

    case 'percent':
      currentInput = String(val / 100);
      break;

    case 'square':
      addHistory(`${currentInput}²`, String(val * val));
      currentInput = String(val * val);
      shouldResetDisplay = true;
      break;

    case 'sqrt':
      if (val < 0) {
        currentInput = 'Error';
      } else {
        const res = Math.sqrt(val);
        addHistory(`√(${currentInput})`, String(res));
        currentInput = String(res);
        shouldResetDisplay = true;
      }
      break;

    case 'toggle-sign':
      if (currentInput !== '0') {
        currentInput = currentInput.startsWith('-') ? currentInput.slice(1) : '-' + currentInput;
      }
      break;
  }
  updateDisplay();
}

// History Management
function addHistory(expression, result) {
  history.unshift({ expression, result });
  renderHistory();
}

function renderHistory() {
  if (!historyList) return;

  historyList.innerHTML = '';
  if (history.length === 0) {
    historyList.innerHTML = '<li class="empty-msg">No history yet</li>';
    return;
  }

  history.forEach(item => {
    const li = document.createElement('li');
    li.className = 'history-item';
    li.innerHTML = `
      <div class="hist-exp">${item.expression}</div>
      <div class="hist-res">${formatNumber(item.result)}</div>
    `;
    li.addEventListener('click', () => {
      currentInput = item.result;
      updateDisplay();
      if (historyPanel) historyPanel.classList.add('hidden');
    });
    historyList.appendChild(li);
  });
}

// Keypad Event Delegation
const keypad = document.querySelector('.keypad');
if (keypad) {
  keypad.addEventListener('click', (e) => {
    const target = e.target;
    if (!target.classList.contains('btn')) return;

    if (target.dataset.value) {
      appendNumber(target.dataset.value);
    } else if (target.dataset.operator) {
      handleOperator(target.dataset.operator);
    } else if (target.dataset.action) {
      handleAction(target.dataset.action);
    } else if (target.id === 'equals-btn') {
      calculate();
    }
  });
}

// Keyboard Controls
document.addEventListener('keydown', (e) => {
  if (e.key >= '0' && e.key <= '9') appendNumber(e.key);
  if (e.key === '.') appendNumber('.');
  if (e.key === '+') handleOperator('+');
  if (e.key === '-') handleOperator('−');
  if (e.key === '*') handleOperator('×');
  if (e.key === '/') {
    e.preventDefault();
    handleOperator('÷');
  }
  if (e.key === 'Enter' || e.key === '=') {
    e.preventDefault();
    calculate();
  }
  if (e.key === 'Backspace') handleAction('delete');
  if (e.key === 'Escape') handleAction('clear');
  if (e.key === '%') handleAction('percent');
});