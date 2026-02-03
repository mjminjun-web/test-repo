// ========================================
// DOM ELEMENTS & STATE
// ========================================
const passwordInput = document.getElementById('password');
const button = document.getElementById('next-button');
const container = document.querySelector('.item-content');
const mistakeList = document.getElementById('mistake-list');
const hintButton = document.getElementById('hint-button');

let clickCount = 0;

// Debug: Check if elements are found
if (!mistakeList) {
  console.error('mistake-list element not found!');
}

// ========================================
// INITIALIZE REQUIREMENTS DISPLAY
// ========================================
let liveErrorElements = {}; // Track live error messages by rule ID

function initializeRequirements() {
  if (!mistakeList) return;
  
  const requirementsTitle = document.createElement('div');
  requirementsTitle.style.fontWeight = 'bold';
  requirementsTitle.style.marginBottom = '10px';
  requirementsTitle.style.color = '#404040';
  requirementsTitle.textContent = 'Password Requirements:';
  mistakeList.appendChild(requirementsTitle);
  
  // Only show "At least 5 characters" permanently
  const req1 = document.createElement('div');
  req1.className = 'log-entry';
  req1.textContent = '• At least 5 characters';
  mistakeList.appendChild(req1);
}

// Track live error element
let liveErrorElement = null;

// Initialize on page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeRequirements);
} else {
  initializeRequirements();
}

// Keep button text as "Next" (already set in HTML)

// ========================================
// THE PROGRESSIVE RULES
// ========================================
const RULES = [
  {
    id: 1,
    check: (val) => val.length >= 5,
    getMessage: (val) => `"${val}" is too short. Needs 5+ chars.`
  },
  {
    id: 2,
    check: (val) => /[A-Z]/.test(val),
    getMessage: (val) => `"${val}" needs an UPPERCASE letter.`
  },
  {
    id: 3,
    check: (val) => /[0-9]/.test(val),
    getMessage: (val) => `"${val}" needs a NUMBER.`
  },
  {
    id: 4,
    check: (val) => /[!@#$%^&*(),.?":{}|<>]/.test(val),
    getMessage: (val) => `"${val}" needs a SYMBOL (!@#$).`
  },
  {
    id: 5,
    check: (val) => val.toLowerCase().includes('banana'),
    getMessage: (val) => `"${val}" must contain 'banana'.`
  }
];

// ========================================
// CSS INJECTION (Styling the Errors)
// ========================================
const style = document.createElement('style');
style.textContent = `
  @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }

  .system-shake { animation: shake 0.4s; border-color: red !important; }

  /* ERROR LOG STYLING - matches existing UI */
  .log-entry {
    margin: 9px 0;
    padding: 6px;
    background-color: #ccc;
    border-left: 4px solid #888;
    font-size: 16px;
    color: #444;
    line-height: 1.6;
  }
`;
document.head.appendChild(style);

// ========================================
// AUDIO SYSTEM
// ========================================
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
  if (audioCtx.state === 'suspended') audioCtx.resume();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  
  if (type === 'error') {
    osc.type = 'sawtooth'; 
    osc.frequency.setValueAtTime(100, audioCtx.currentTime);
    osc.frequency.linearRampToValueAtTime(50, audioCtx.currentTime + 0.3);
    gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
    osc.start(); osc.stop(audioCtx.currentTime + 0.3);
  } else if (type === 'success') {
    osc.type = 'sine';
    osc.frequency.setValueAtTime(523.25, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    osc.start(); osc.stop(audioCtx.currentTime + 0.5);
  }
}

// ========================================
// LOGGING FUNCTION
// ========================================
function logMistake(msg) {
  if (!mistakeList) {
    console.error('mistakeList not found!');
    return;
  }
  
  const div = document.createElement('div');

  // Apply the new class for big, matching font
  div.className = 'log-entry';

  // No timestamp, just the clean message
  div.textContent = `ERROR: ${msg}`;

  mistakeList.appendChild(div);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'PASSWORD INPUT',
    error: msg,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));

  // Auto-scroll to bottom of list
  const counter = document.querySelector('.mistake-counter');
  if(counter) counter.scrollTop = counter.scrollHeight;
}

// ========================================
// MAIN INTERACTION
// ========================================
if (button) {
  button.addEventListener('click', (e) => {
    e.preventDefault(); 
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // Always count clicks - 5 clicks total to proceed
    clickCount++;
    const remaining = Math.max(0, 5 - clickCount);

    // Check if 5 clicks reached - turn button green and redirect
    if (clickCount >= 5) {
      button.style.backgroundColor = '#28a745';
      button.textContent = 'Success! Redirecting...';

      setTimeout(() => {
        if (typeof window.markPageCompleted === 'function') {
          window.markPageCompleted();
        }
        window.location.href = '../CHECKBOX/checkbox.html';
      }, 500);
      return;
    }

    const val = passwordInput.value;
    
    // 1. Handle Empty
    if (!val) {
      playSound('error');
      logMistake('Password cannot be empty.');
      container.classList.add('system-shake');
      setTimeout(() => container.classList.remove('system-shake'), 400);
      return;
    }

    // 2. CHECK RULES LOOP (for feedback, but don't block progression)
    let failedRule = null;

    for (let i = 0; i < RULES.length; i++) {
      if (!RULES[i].check(val)) {
        failedRule = RULES[i];
        break; // Stop at first failure
      }
    }

    // 3. FAILURE - Show feedback but don't block
    if (failedRule) {
      playSound('error');

      // Remove existing live error
      if (liveErrorElement) {
        liveErrorElement.remove();
        liveErrorElement = null;
      }

      // Show LIVE error message with specific issue
      const specificMessage = failedRule.getMessage(val);
      liveErrorElement = document.createElement('div');
      liveErrorElement.className = 'log-entry';
      liveErrorElement.textContent = `💬 ${specificMessage}`;
      liveErrorElement.style.color = '#d32f2f';
      liveErrorElement.style.fontStyle = 'italic';
      liveErrorElement.id = 'live-password-error';
      mistakeList.appendChild(liveErrorElement);

      // Also add permanent error message telling user to fix
      const newErrorMessage = `You need to fix the issue and try again. Click Next when ready.`;
      const errorDiv = document.createElement('div');
      errorDiv.className = 'log-entry';
      errorDiv.textContent = `ERROR: ${newErrorMessage}`;
      mistakeList.appendChild(errorDiv);

      // Store error in localStorage
      const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
      allErrors.push({
        page: 'PASSWORD INPUT',
        error: newErrorMessage,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('browserErrors', JSON.stringify(allErrors));

      // Reset button color
      button.style.backgroundColor = '';

      // Shake effect
      container.classList.remove('system-shake');
      void container.offsetWidth;
      container.classList.add('system-shake');
    }

    // 4. SUCCESS - Password is valid (just for feedback)
    else {
      playSound('success');

      // Add success message to log
      const successDiv = document.createElement('div');
      successDiv.className = 'log-entry';
      successDiv.textContent = "Password is valid! Great job!";
      successDiv.style.color = '#28a745';
      mistakeList.appendChild(successDiv);
    }
  });
}

// HINT BUTTON
if (hintButton) {
  hintButton.addEventListener('click', () => {
    const val = passwordInput.value;
    let nextReq = "None";

    for (let i = 0; i < RULES.length; i++) {
      if (!RULES[i].check(val)) {
        if(i === 0) nextReq = "Length (5+)";
        if(i === 1) nextReq = "Uppercase Letter";
        if(i === 2) nextReq = "Number";
        if(i === 3) nextReq = "Symbol (!@#$)";
        if(i === 4) nextReq = "Word 'banana'";
        break;
      }
    }
    alert(`NEXT REQUIREMENT: ${nextReq}`);
  });
}

// ========================================
// PRINT FUNCTIONALITY
// ========================================
window.addEventListener('beforeprint', () => {
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  mistakeList.innerHTML = '';

  if (allErrors.length === 0) {
    mistakeList.innerHTML = '<div>No errors recorded.</div>';
  } else {
    allErrors.forEach((error, index) => {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'log-entry';
      errorDiv.textContent = `[${error.page}] ${error.error}`;
      mistakeList.appendChild(errorDiv);
    });
  }
});