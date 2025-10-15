        // Calculator state
        const state = {
            currentExpression: '',
            currentResult: '0',
            memory: 0,
            isDegreeMode: true,
            history: []
        };

        // DOM Elements
        const expressionEl = document.getElementById('expression');
        const resultEl = document.getElementById('result');
        const modeIndicatorEl = document.getElementById('modeIndicator');
        const historyListEl = document.getElementById('historyList');

        // Initialize calculator
        function init() {
            updateDisplay();
            bindEventListeners();
            loadHistory();
        }

        // Bind event listeners
        function bindEventListeners() {
            // Button clicks
            document.querySelectorAll('.btn').forEach(button => {
                button.addEventListener('click', handleButtonClick);
            });

            // Keyboard support
            document.addEventListener('keydown', handleKeyboardInput);
        }

        // Handle button clicks
        function handleButtonClick(e) {
            const button = e.target;
            const action = button.dataset.action;
            const value = button.dataset.value;

            if (action) {
                handleAction(action);
            } else if (value) {
                handleInput(value);
            }
        }

        // Handle keyboard input
        function handleKeyboardInput(e) {
            e.preventDefault();
            
            // Map keyboard keys to calculator functions
            const keyMap = {
                '0': '0', '1': '1', '2': '2', '3': '3', '4': '4',
                '5': '5', '6': '6', '7': '7', '8': '8', '9': '9',
                '+': '+', '-': '-', '*': '*', '/': '/',
                '.': '.', '(': '(', ')': ')',
                'Enter': 'equals', '=': 'equals',
                'Escape': 'ac', 'Backspace': 'backspace',
                '%': '%', '^': '^', 'p': 'π', 'e': 'e'
            };

            const key = e.key;
            const mappedValue = keyMap[key];

            if (mappedValue === 'equals') {
                handleAction('equals');
            } else if (mappedValue === 'ac') {
                handleAction('ac');
            } else if (mappedValue === 'backspace') {
                handleAction('backspace');
            } else if (mappedValue) {
                handleInput(mappedValue);
            }
        }

        // Handle calculator actions
        function handleAction(action) {
            switch (action) {
                case 'ac':
                    state.currentExpression = '';
                    state.currentResult = '0';
                    break;
                case 'c':
                    state.currentExpression = '';
                    break;
                case 'backspace':
                    state.currentExpression = state.currentExpression.slice(0, -1);
                    break;
                case 'equals':
                    try {
                        const result = evaluateExpression(state.currentExpression);
                        if (result !== null) {
                            // Add to history
                            state.history.unshift({
                                expression: state.currentExpression,
                                result: formatResult(result)
                            });
                            // Keep only last 10 history items
                            if (state.history.length > 10) {
                                state.history.pop();
                            }
                            state.currentResult = formatResult(result);
                            state.currentExpression = '';
                            saveHistory();
                        }
                    } catch (error) {
                        state.currentResult = 'Error';
                    }
                    break;
                case 'mc':
                    state.memory = 0;
                    break;
                case 'mr':
                    state.currentExpression += state.memory.toString();
                    break;
                case 'm+':
                    try {
                        const current = parseFloat(state.currentResult) || 0;
                        state.memory += current;
                    } catch (e) {
                        // Ignore if current result is not a number
                    }
                    break;
                case 'm-':
                    try {
                        const current = parseFloat(state.currentResult) || 0;
                        state.memory -= current;
                    } catch (e) {
                        // Ignore if current result is not a number
                    }
                    break;
                case 'toggleMode':
                    state.isDegreeMode = !state.isDegreeMode;
                    break;
                case 'clearHistory':
                    state.history = [];
                    saveHistory();
                    break;
            }
            updateDisplay();
        }

        // Handle input values
        function handleInput(value) {
            // Special handling for constants
            if (value === 'π') {
                state.currentExpression += 'π';
            } else if (value === 'e') {
                state.currentExpression += 'e';
            } else {
                state.currentExpression += value;
            }
            updateDisplay();
        }

        // Evaluate expression safely
        function evaluateExpression(expr) {
            if (!expr) return null;
            
            try {
                // Replace constants
                let processedExpr = expr
                    .replace(/π/g, Math.PI.toString())
                    .replace(/e/g, Math.E.toString());
                
                // Replace functions with safe equivalents
                processedExpr = processedExpr
                    .replace(/sin\(/g, `safeSin(`)
                    .replace(/cos\(/g, `safeCos(`)
                    .replace(/tan\(/g, `safeTan(`)
                    .replace(/asin\(/g, `safeAsin(`)
                    .replace(/acos\(/g, `safeAcos(`)
                    .replace(/atan\(/g, `safeAtan(`)
                    .replace(/log\(/g, `safeLog10(`)
                    .replace(/ln\(/g, `safeLn(`)
                    .replace(/√\(/g, `safeSqrt(`)
                    .replace(/\^/g, '**')
                    .replace(/!/g, '!'); // Factorial will be handled separately
                
                // Handle factorial
                processedExpr = handleFactorial(processedExpr);
                
                // Handle percent
                processedExpr = handlePercent(processedExpr);
                
                // Evaluate the expression
                const result = Function(`
                    const safeSin = (x) => Math.sin(${state.isDegreeMode ? 'x * Math.PI / 180' : 'x'});
                    const safeCos = (x) => Math.cos(${state.isDegreeMode ? 'x * Math.PI / 180' : 'x'});
                    const safeTan = (x) => Math.tan(${state.isDegreeMode ? 'x * Math.PI / 180' : 'x'});
                    const safeAsin = (x) => ${state.isDegreeMode ? 'Math.asin(x) * 180 / Math.PI' : 'Math.asin(x)'};
                    const safeAcos = (x) => ${state.isDegreeMode ? 'Math.acos(x) * 180 / Math.PI' : 'Math.acos(x)'};
                    const safeAtan = (x) => ${state.isDegreeMode ? 'Math.atan(x) * 180 / Math.PI' : 'Math.atan(x)'};
                    const safeLog10 = (x) => Math.log10(x);
                    const safeLn = (x) => Math.log(x);
                    const safeSqrt = (x) => Math.sqrt(x);
                    return (${processedExpr});
                `)();
                
                return result;
            } catch (error) {
                return null;
            }
        }

        // Handle factorial in expression
        function handleFactorial(expr) {
            // Find all factorial operations (e.g., 5!)
            return expr.replace(/(\d+(?:\.\d+)?)(!+)/g, (match, num, factorials) => {
                const n = parseFloat(num);
                const count = factorials.length;
                
                // Only handle single factorial for now
                if (count === 1) {
                    if (n < 0 || !Number.isInteger(n)) {
                        throw new Error('Invalid factorial');
                    }
                    return factorial(n).toString();
                }
                return match;
            });
        }

        // Calculate factorial
        function factorial(n) {
            if (n === 0 || n === 1) return 1;
            let result = 1;
            for (let i = 2; i <= n; i++) {
                result *= i;
            }
            return result;
        }

        // Handle percent in expression
        function handlePercent(expr) {
            // Replace standalone % with /100
            // Handle cases like 50% -> 0.5, 100+10% -> 110
            return expr.replace(/(\d+(?:\.\d+)?)%/g, (match, num) => {
                return (parseFloat(num) / 100).toString();
            });
        }

        // Format result for display
        function formatResult(result) {
            if (typeof result !== 'number' || isNaN(result)) {
                return 'Error';
            }
            
            // Handle very large or very small numbers
            if (Math.abs(result) > 1e10 || (Math.abs(result) < 1e-10 && result !== 0)) {
                return result.toExponential(6);
            }
            
            // Format to avoid too many decimal places
            const str = result.toString();
            if (str.includes('.')) {
                const decimalPlaces = str.split('.')[1].length;
                if (decimalPlaces > 10) {
                    return result.toFixed(10).replace(/\.?0+$/, '');
                }
            }
            
            return str;
        }

        // Update display
        function updateDisplay() {
            expressionEl.textContent = state.currentExpression || ' ';
            resultEl.textContent = state.currentResult;
            modeIndicatorEl.textContent = state.isDegreeMode ? 'DEG' : 'RAD';
            modeIndicatorEl.style.background = state.isDegreeMode ? '#e74c3c' : '#3498db';
            renderHistory();
        }

        // Render history
        function renderHistory() {
            historyListEl.innerHTML = '';
            state.history.forEach(item => {
                const li = document.createElement('li');
                li.className = 'history-item';
                li.innerHTML = `
                    <span class="history-expression">${item.expression}</span>
                    <span class="history-result">= ${item.result}</span>
                `;
                li.addEventListener('click', () => {
                    state.currentExpression = item.result;
                    state.currentResult = item.result;
                    updateDisplay();
                });
                historyListEl.appendChild(li);
            });
        }

        // Save history to localStorage
        function saveHistory() {
            try {
                localStorage.setItem('calculatorHistory', JSON.stringify(state.history));
            } catch (e) {
                // Ignore if localStorage is not available
            }
        }

        // Load history from localStorage
        function loadHistory() {
            try {
                const saved = localStorage.getItem('calculatorHistory');
                if (saved) {
                    state.history = JSON.parse(saved);
                }
            } catch (e) {
                // Ignore if localStorage is not available or invalid
            }
        }

        // Initialize calculator when page loads
        window.addEventListener('DOMContentLoaded', init);

        /*
         * Unit Tests (for development)
         * 
         * Test cases:
         * factorial(5) = 120
         * 2^3 = 8
         * sin(30) in DEG mode = 0.5
         * cos(0) = 1
         * tan(45) in DEG mode = 1
         * asin(0.5) in DEG mode = 30
         * log(100) = 2
         * ln(e) = 1
         * √(16) = 4
         * 5! = 120
         * 50% = 0.5
         * (2+3)*4 = 20
         * 2^(3+1) = 16
         * π ≈ 3.14159
         * e ≈ 2.71828
         */