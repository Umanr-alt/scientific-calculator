const HISTORY_KEY = 'scientificCalculatorHistory';
const MAX_HISTORY = 20;

const state = {
  expression: '',
  result: '0',
  memory: 0,
  angleMode: 'DEG',
  history: loadHistory(),
  lastAnswer: 0,
};

const expressionEl = document.getElementById('expression');
const resultEl = document.getElementById('result');
const historyListEl = document.getElementById('history-list');

const memoryIndicator = document.createElement('span');
memoryIndicator.className = 'memory-indicator hidden';
memoryIndicator.textContent = 'M';
document.querySelector('.memory-actions').appendChild(memoryIndicator);

function loadHistory() {
  try {
    const raw = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? raw.slice(0, MAX_HISTORY) : [];
  } catch (error) {
    return [];
  }
}

function saveHistory() {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, MAX_HISTORY)));
}

function formatNumber(value) {
  if (!Number.isFinite(value)) {
    return 'Error';
  }

  if (Math.abs(value) < 1e-12) {
    return '0';
  }

  const precision = Math.abs(value) >= 1e10 || Math.abs(value) < 1e-6 ? 12 : 10;
  const rounded = Number(value.toPrecision(precision));

  if (!Number.isFinite(rounded)) {
    return Number(value).toExponential(8).replace(/\.0+e/, 'e');
  }

  return String(rounded);
}

function updateMemoryIndicator() {
  memoryIndicator.classList.toggle('hidden', state.memory === 0 || !Number.isFinite(state.memory));
}

function renderDisplay() {
  expressionEl.textContent = state.expression.trim() || '0';
  resultEl.textContent = state.result || '0';
}

function renderHistory() {
  historyListEl.innerHTML = '';

  if (!state.history.length) {
    historyListEl.innerHTML = '<div class="history-item"><div class="history-expression">No recent calculations</div><div class="history-result">—</div></div>';
    return;
  }

  state.history.forEach((entry) => {
    const item = document.createElement('button');
    item.type = 'button';
    item.className = 'history-item';
    item.innerHTML = `
      <span class="history-expression">${entry.expression}</span>
      <span class="history-result">${entry.result}</span>
    `;
    item.addEventListener('click', () => {
      state.expression = entry.expression;
      // Re-evaluates immediately so the display reflects the stored value.
      updateLiveEvaluation();
    });
    historyListEl.appendChild(item);
  });
}

function clearExpression() {
  state.expression = '';
  state.result = '0';
  renderDisplay();
}

function deleteLast() {
  state.expression = state.expression.slice(0, -1);
  updateLiveEvaluation();
}

function appendValue(value) {
  state.expression += value;
  updateLiveEvaluation();
}

function appendInsert(value) {
  state.expression += value;
  updateLiveEvaluation();
}

function addHistoryEntry(expression, result) {
  const normalizedExpression = expression.trim();
  const normalizedResult = formatNumber(result);

  if (!normalizedExpression.length) {
    return;
  }

  state.history.unshift({ expression: normalizedExpression, result: normalizedResult });
  state.history = state.history.slice(0, MAX_HISTORY);
  saveHistory();
  renderHistory();
}

function convertToRadians(angle) {
  if (state.angleMode === 'DEG') return (angle * Math.PI) / 180;
  if (state.angleMode === 'GRAD') return (angle * Math.PI) / 200;
  return angle;
}

function convertFromRadians(angle) {
  if (state.angleMode === 'DEG') return (angle * 180) / Math.PI;
  if (state.angleMode === 'GRAD') return (angle * 200) / Math.PI;
  return angle;
}

function factorial(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0) {
    throw new Error('Factorial requires a non-negative integer.');
  }
  if (n <= 1) {
    return 1;
  }

  let result = 1;
  for (let i = 2; i <= n; i += 1) {
    result *= i;
  }
  return result;
}

function applyFunction(name, args) {
  const a = args[0];
  const b = args[1];

  switch (name) {
    case 'sin': return Math.sin(convertToRadians(a));
    case 'cos': return Math.cos(convertToRadians(a));
    case 'tan': return Math.tan(convertToRadians(a));
    case 'cot': return 1 / Math.tan(convertToRadians(a));
    case 'sec': return 1 / Math.cos(convertToRadians(a));
    case 'csc': return 1 / Math.sin(convertToRadians(a));
    case 'asin': return convertFromRadians(Math.asin(a));
    case 'acos': return convertFromRadians(Math.acos(a));
    case 'atan': return convertFromRadians(Math.atan(a));
    case 'sinh': return Math.sinh(a);
    case 'cosh': return Math.cosh(a);
    case 'tanh': return Math.tanh(a);
    case 'asinh': return Math.asinh(a);
    case 'acosh': return Math.acosh(a);
    case 'atanh': return Math.atanh(a);
    case 'log':
      if (args.length === 0) throw new Error('log requires an argument.');
      if (args.length === 1) return Math.log10(a);
      return Math.log(a) / Math.log(b);
    case 'ln': return Math.log(a);
    case 'log10': return Math.log10(a);
    case 'sqrt': return Math.sqrt(a);
    case 'cbrt':
      if (typeof Math.cbrt === 'function') return Math.cbrt(a);
      return Math.sign(a) * Math.pow(Math.abs(a), 1 / 3);
    case 'root':
      if (args.length < 2) throw new Error('root requires a degree and a value.');
      return Math.pow(b, 1 / a);
    case 'exp': return Math.exp(a);
    case 'fact': return factorial(a);
    case 'abs': return Math.abs(a);
    case 'floor': return Math.floor(a);
    case 'ceil': return Math.ceil(a);
    case 'round': return Math.round(a);
    case 'recip':
      if (a === 0) throw new Error('Division by zero is undefined.');
      return 1 / a;
    case 'random':
      if (args.length === 0) return Math.random();
      if (args.length === 2) {
        return Math.random() * (b - a) + a;
      }
      throw new Error('random expects either no arguments or a min/max range.');
    case 'percent': return a / 100;
    default:
      throw new Error(`Unsupported function: ${name}`);
  }
}

function isFunctionName(name) {
  return [
    'sin', 'cos', 'tan', 'cot', 'sec', 'csc',
    'asin', 'acos', 'atan',
    'sinh', 'cosh', 'tanh',
    'asinh', 'acosh', 'atanh',
    'log', 'ln', 'log10',
    'sqrt', 'cbrt', 'root', 'exp',
    'fact', 'abs', 'floor', 'ceil', 'round', 'recip', 'random', 'percent',
    'mod'
  ].includes(name);
}

function tokenize(input) {
  const tokens = [];
  let index = 0;
  let previousType = null;

  function maybeImplicitMultiply(nextType) {
    const valueTypes = ['number', 'constant', 'rparen'];
    if (previousType && valueTypes.includes(previousType) && ['number', 'constant', 'function', 'lparen'].includes(nextType)) {
      tokens.push({ type: 'operator', value: '*' });
      previousType = 'operator';
    }
  }

  while (index < input.length) {
    const ch = input[index];

    if (/\s/.test(ch)) {
      index += 1;
      continue;
    }

    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(input[index + 1] || ''))) {
      maybeImplicitMultiply('number');
      let numText = '';
      let seenDot = false;
      let seenExponent = false;

      while (index < input.length) {
        const currentChar = input[index];

        if (/[0-9]/.test(currentChar)) {
          numText += currentChar;
          index += 1;
        } else if (currentChar === '.' && !seenDot && !seenExponent) {
          numText += currentChar;
          seenDot = true;
          index += 1;
        } else if ((currentChar === 'e' || currentChar === 'E') && !seenExponent) {
          const nextChar = input[index + 1] || '';
          if (/[0-9]/.test(nextChar) || ['+', '-'].includes(nextChar)) {
            numText += currentChar;
            seenExponent = true;
            index += 1;
            if (['+', '-'].includes(input[index])) {
              numText += input[index];
              index += 1;
            }
          } else {
            break;
          }
        } else {
          break;
        }
      }

      if (numText === '' || numText === '.') {
        throw new Error('Invalid number.');
      }

      tokens.push({ type: 'number', value: Number(numText) });
      previousType = 'number';
      continue;
    }

    if (ch === 'π' || ch === 'φ') {
      maybeImplicitMultiply('constant');
      tokens.push({ type: 'constant', value: ch === 'π' ? Math.PI : (1 + Math.sqrt(5)) / 2 });
      previousType = 'constant';
      index += 1;
      continue;
    }

    if (ch === 'e') {
      maybeImplicitMultiply('constant');
      tokens.push({ type: 'constant', value: Math.E });
      previousType = 'constant';
      index += 1;
      continue;
    }

    if (/[a-zA-Z_]/.test(ch)) {
      maybeImplicitMultiply('function');
      let word = '';
      while (index < input.length && /[A-Za-z0-9_]/.test(input[index])) {
        word += input[index];
        index += 1;
      }
      const normalized = word.toLowerCase();

      if (normalized === 'pi') {
        tokens.push({ type: 'constant', value: Math.PI });
        previousType = 'constant';
        continue;
      }

      if (normalized === 'phi') {
        tokens.push({ type: 'constant', value: (1 + Math.sqrt(5)) / 2 });
        previousType = 'constant';
        continue;
      }

      if (normalized === 'ans') {
        tokens.push({ type: 'constant', value: state.lastAnswer });
        previousType = 'constant';
        continue;
      }

      if (normalized === 'mod') {
        tokens.push({ type: 'operator', value: '%' });
        previousType = 'operator';
        continue;
      }

      if (isFunctionName(normalized)) {
        tokens.push({ type: 'function', value: normalized });
        previousType = 'function';
        continue;
      }

      throw new Error(`Unknown symbol: ${word}`);
    }

    if (ch === '(') {
      maybeImplicitMultiply('lparen');
      tokens.push({ type: 'lparen', value: '(' });
      previousType = 'lparen';
      index += 1;
      continue;
    }

    if (ch === ')') {
      tokens.push({ type: 'rparen', value: ')' });
      previousType = 'rparen';
      index += 1;
      continue;
    }

    if (ch === ',') {
      tokens.push({ type: 'comma', value: ',' });
      previousType = 'comma';
      index += 1;
      continue;
    }

    if (ch === '+') {
      tokens.push({ type: 'operator', value: '+' });
      previousType = 'operator';
      index += 1;
      continue;
    }

    if (ch === '-') {
      const isUnary = !previousType || ['operator', 'lparen', 'comma'].includes(previousType);
      tokens.push({ type: isUnary ? 'unary' : 'operator', value: isUnary ? 'u-' : '-' });
      previousType = 'operator';
      index += 1;
      continue;
    }

    if (['*', '/', '^', '%'].includes(ch)) {
      tokens.push({ type: 'operator', value: ch });
      previousType = 'operator';
      index += 1;
      continue;
    }

    if (ch === '!') {
      tokens.push({ type: 'postfix', value: '!' });
      previousType = 'postfix';
      index += 1;
      continue;
    }

    if (ch === '√') {
      maybeImplicitMultiply('function');
      tokens.push({ type: 'function', value: 'sqrt' });
      tokens.push({ type: 'lparen', value: '(' });
      previousType = 'lparen';
      index += 1;
      continue;
    }

    if (ch === '∛') {
      maybeImplicitMultiply('function');
      tokens.push({ type: 'function', value: 'cbrt' });
      tokens.push({ type: 'lparen', value: '(' });
      previousType = 'lparen';
      index += 1;
      continue;
    }

    if (ch === '|') {
      maybeImplicitMultiply('function');
      tokens.push({ type: 'function', value: 'abs' });
      tokens.push({ type: 'lparen', value: '(' });
      previousType = 'lparen';
      index += 1;
      continue;
    }

    throw new Error(`Unexpected token: ${ch}`);
  }

  return tokens;
}

class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.index = 0;
  }

  peek() {
    return this.tokens[this.index] || null;
  }

  match(type, value) {
    const token = this.peek();
    if (!token) {
      return false;
    }

    if (type && token.type !== type) {
      return false;
    }

    if (value && token.value !== value) {
      return false;
    }

    this.index += 1;
    return token;
  }

  consume(expectedType, expectedValue, label) {
    const token = this.peek();
    if (!token) {
      throw new Error(label || `Expected ${expectedType}.`);
    }

    if (expectedType && token.type !== expectedType) {
      throw new Error(label || `Expected ${expectedType}, received ${token.type}.`);
    }

    if (expectedValue && token.value !== expectedValue) {
      throw new Error(label || `Expected ${expectedValue}.`);
    }

    this.index += 1;
    return token;
  }

  parse() {
    const value = this.parseAdditive();
    if (this.peek()) {
      const remaining = this.peek();
      throw new Error(`Unexpected token: ${remaining.value}`);
    }
    return value;
  }

  parseAdditive() {
    let value = this.parseMultiplicative();

    while (this.peek() && ['+', '-'].includes(this.peek().value)) {
      const operator = this.peek().value;
      this.index += 1;
      const rhs = this.parseMultiplicative();
      value = operator === '+' ? value + rhs : value - rhs;
    }

    return value;
  }

  parseMultiplicative() {
    let value = this.parsePower();

    while (this.peek() && ['*', '/', '%'].includes(this.peek().value)) {
      const operator = this.peek().value;
      this.index += 1;
      const rhs = this.parsePower();

      if (operator === '*') {
        value *= rhs;
      } else if (operator === '/') {
        if (rhs === 0) {
          throw new Error('Division by zero is undefined.');
        }
        value /= rhs;
      } else {
        value %= rhs;
      }
    }

    return value;
  }

  parsePower() {
    let value = this.parseUnary();

    while (this.peek() && this.peek().value === '^') {
      this.index += 1;
      const exponent = this.parseUnary();
      value = Math.pow(value, exponent);
    }

    return value;
  }

  parseUnary() {
    const current = this.peek();
    if (!current) {
      throw new Error('Missing operand.');
    }

    if (this.match('unary', 'u-')) {
      return -this.parseUnary();
    }

    if (this.match('operator', '+')) {
      return this.parseUnary();
    }

    return this.parsePostfix();
  }

  parsePostfix() {
    let value = this.parsePrimary();

    while (this.peek() && (this.peek().type === 'postfix' || this.peek().value === '%')) {
      const token = this.peek();
      this.index += 1;
      if (token.type === 'postfix' && token.value === '!') {
        value = factorial(value);
      } else if (token.value === '%') {
        value = value / 100;
      }
    }

    return value;
  }

  parsePrimary() {
    const token = this.peek();
    if (!token) {
      throw new Error('Expected a value.');
    }

    if (token.type === 'number') {
      this.index += 1;
      return token.value;
    }

    if (token.type === 'constant') {
      this.index += 1;
      return token.value;
    }

    if (token.type === 'function') {
      return this.parseFunctionCall();
    }

    if (token.type === 'lparen') {
      this.index += 1;
      const value = this.parseAdditive();
      this.consume('rparen', ')', 'Missing closing parenthesis.');
      return value;
    }

    throw new Error(`Unexpected token: ${token.value}`);
  }

  parseFunctionCall() {
    const name = this.consume('function').value;

    if (!this.peek() || this.peek().type !== 'lparen') {
      const arg = this.parseUnary();
      return applyFunction(name, [arg]);
    }

    this.consume('lparen', '(', 'Function call missing opening parenthesis.');

    const args = [];
    if (this.peek() && this.peek().type !== 'rparen') {
      do {
        args.push(this.parseAdditive());
      } while (this.match('comma', ','));
    }

    this.consume('rparen', ')', `Missing closing parenthesis for ${name}.`);
    return applyFunction(name, args);
  }
}

function evaluateExpression(rawExpression) {
  const expression = rawExpression.trim();
  if (!expression) {
    return 0;
  }

  const tokens = tokenize(expression);
  const parser = new Parser(tokens);
  const result = parser.parse();

  if (!Number.isFinite(result)) {
    throw new Error('Result is not finite.');
  }

  return result;
}

function updateLiveEvaluation() {
  try {
    if (!state.expression.trim()) {
      state.result = '0';
      renderDisplay();
      return;
    }

    const value = evaluateExpression(state.expression);
    state.result = formatNumber(value);
    state.lastAnswer = value;
    renderDisplay();
  } catch (error) {
    state.result = 'Error';
    renderDisplay();
  }
}

function evaluateAndStore() {
  try {
    if (!state.expression.trim()) {
      return;
    }

    const value = evaluateExpression(state.expression);
    state.lastAnswer = value;
    addHistoryEntry(state.expression, value);
    state.expression = '';
    state.result = formatNumber(value);
    renderDisplay();
  } catch (error) {
    state.result = 'Error';
    renderDisplay();
  }
}

function applyMemoryOperation(operation) {
  const expression = state.expression.trim();
  const value = expression ? evaluateExpression(expression) : state.lastAnswer;

  if (!Number.isFinite(value)) {
    state.result = 'Error';
    renderDisplay();
    return;
  }

  if (operation === 'clear') {
    state.memory = 0;
  } else if (operation === 'recall') {
    state.expression += state.memory;
    updateLiveEvaluation();
    return;
  } else if (operation === 'add') {
    state.memory += value;
  } else if (operation === 'subtract') {
    state.memory -= value;
  }

  updateMemoryIndicator();
}

function handleAction(event) {
  const { action } = event.currentTarget.dataset;

  switch (action) {
    case 'clear':
      clearExpression();
      break;
    case 'delete':
      deleteLast();
      break;
    case 'toggle-sign':
      if (!state.expression) {
        state.expression = '-';
      } else if (/[+\-*/%^()]$/.test(state.expression)) {
        state.expression += '-';
      } else {
        state.expression = `-(${state.expression})`;
      }
      updateLiveEvaluation();
      break;
    case 'percent':
      state.expression = state.expression ? `${state.expression}%` : '0%';
      updateLiveEvaluation();
      break;
    case 'equals':
      evaluateAndStore();
      break;
    case 'clear-history':
      state.history = [];
      saveHistory();
      renderHistory();
      break;
    case 'memory-clear':
      applyMemoryOperation('clear');
      break;
    case 'memory-recall':
      applyMemoryOperation('recall');
      break;
    case 'memory-add':
      applyMemoryOperation('add');
      break;
    case 'memory-subtract':
      applyMemoryOperation('subtract');
      break;
    default:
      break;
  }
}

document.querySelectorAll('[data-value]').forEach((button) => {
  button.addEventListener('click', (event) => {
    appendValue(event.currentTarget.dataset.value);
  });
});

document.querySelectorAll('[data-insert]').forEach((button) => {
  button.addEventListener('click', (event) => {
    appendInsert(event.currentTarget.dataset.insert);
  });
});

document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', handleAction);
});

document.querySelectorAll('.mode-btn').forEach((button) => {
  button.addEventListener('click', () => {
    state.angleMode = button.dataset.mode;
    document.querySelectorAll('.mode-btn').forEach((node) => {
      node.classList.toggle('active', node === button);
    });
    updateLiveEvaluation();
  });
});

document.addEventListener('keydown', (event) => {
  const key = event.key;

  if (/^[0-9]$/.test(key)) {
    appendValue(key);
    return;
  }

  if (['+', '-', '*', '/', '^', '(', ')', '.', '%', '!'].includes(key)) {
    appendValue(key);
    return;
  }

  if (key === 'Enter' || key === '=') {
    event.preventDefault();
    evaluateAndStore();
    return;
  }

  if (key === 'Backspace') {
    event.preventDefault();
    deleteLast();
    return;
  }

  if (key === 'Escape') {
    event.preventDefault();
    clearExpression();
    return;
  }

  if (key === 'Delete') {
    event.preventDefault();
    clearExpression();
  }
});

function initialize() {
  state.result = '0';
  renderDisplay();
  renderHistory();
  updateMemoryIndicator();
}

initialize();
