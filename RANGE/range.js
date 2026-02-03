// ========================================
// DOM ELEMENTS & STATE
// ========================================
const rangeSlider = document.getElementById('range-slider');
const sliderValue = document.getElementById('slider-value');
const submitBtn = document.getElementById('submit-btn');
const mistakeList = document.querySelector('.mistake-list');
const hintButton = document.getElementById('hint-button');
const container = document.querySelector('.item-content');

let clickCount = 0;
let mistakes = 0;
let hintPopup = null;
let buttonEnabled = false;

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
// CSS INJECTION
// ========================================
const style = document.createElement('style');
style.textContent = `
  @keyframes shake { 
    0% { transform: translate(1px, 1px) rotate(0deg); } 
    20% { transform: translate(-3px, 0px) rotate(1deg); } 
    40% { transform: translate(1px, -1px) rotate(1deg); } 
    60% { transform: translate(-3px, 1px) rotate(0deg); } 
    80% { transform: translate(-1px, -1px) rotate(1deg); } 
    100% { transform: translate(1px, -2px) rotate(-1deg); } 
  }
  .system-shake { animation: shake 0.4s; border-color: #808080 !important; }
  .bottom-left-description { transform: none !important; }
  .log-entry {
    font-family: inherit;
    font-size: 15px;
    font-weight: 700;
    color: #000000ff;
    margin-bottom: 10px;
    padding-bottom: 5px;
    border-bottom: 2px solid #eee;
    line-height: 1.4;
  }
`;
document.head.appendChild(style);

// ========================================
// LOGGING FUNCTION
// ========================================
function logMistake(msg) {
  if (!mistakeList) return;
  
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.textContent = `ERROR: ${msg}`;
  mistakeList.appendChild(div);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'RANGE SLIDER',
    error: msg,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));

  const counter = document.querySelector('.mistake-counter');
  if(counter) counter.scrollTop = counter.scrollHeight;
}

// ========================================
// SLIDER VALUE DISPLAY
// ========================================
if (rangeSlider && sliderValue) {
  rangeSlider.addEventListener('input', (e) => {
    const value = parseFloat(e.target.value);
    sliderValue.textContent = value.toFixed(2);
  });
}

// ========================================
// MAIN INTERACTION
// ========================================
if (submitBtn) {
  submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // If button is already enabled, redirect to next page
    if (buttonEnabled) {
      setTimeout(() => {
        if (typeof window.markPageCompleted === 'function') {
          window.markPageCompleted();
        }
        window.location.href = '../Color Picker/colorpicker.html';
      }, 100);
      return;
    }

    // Count clicks toward enablement
    clickCount++;

    // On the 5th click, enable and turn green; next click will proceed
    if (clickCount >= 5) {
      buttonEnabled = true;
      submitBtn.style.backgroundColor = '#28a745';
      playSound('success');
      mistakeList.innerHTML = '<div style="color: #2e7d32; font-weight: bold;">Can you count?</div>';
      return;
    }

    const currentValue = parseFloat(rangeSlider.value);
    
    // Create discriminating error messages based on slider value
    let errorMessage = '';
    
    if (currentValue === 0) {
      errorMessage = `Volume at ${currentValue.toFixed(2)}? That's silence, not a choice.`;
    } else if (currentValue < 10) {
      errorMessage = `Only ${currentValue.toFixed(2)}? That's barely audible. Turn it up!`;
    } else if (currentValue < 25) {
      errorMessage = `${currentValue.toFixed(2)} Is way too low. Are you trying to whisper?`;
    } else if (currentValue < 50) {
      errorMessage = `${currentValue.toFixed(2)}? That's still too low. You can do better.`;
    } else if (currentValue === 50) {
      errorMessage = `Exactly ${currentValue.toFixed(2)}? How original. Try something else.`;
    } else if (currentValue < 75) {
      errorMessage = `${currentValue.toFixed(2)} Is getting there, but not quite right.`;
    } else if (currentValue < 90) {
      errorMessage = `${currentValue.toFixed(2)}? Almost, but not good enough.`;
    } else if (currentValue < 100) {
      errorMessage = `${currentValue.toFixed(2)}? So close, yet so far.`;
    } else if (currentValue === 100) {
      errorMessage = `Maximum ${currentValue.toFixed(2)}? That's too loud! Your ears will thank you for less.`;
    }

    playSound('error');
    logMistake(errorMessage);

    // Shake effect
    container.classList.remove('system-shake');
    void container.offsetWidth;
    container.classList.add('system-shake');
  });
}

// ========================================
// HINT BUTTON
// ========================================
if (hintButton) {
  hintButton.addEventListener('click', () => {
    if (hintPopup) hintPopup.remove();

    hintPopup = document.createElement('div');
    hintPopup.className = 'hint-popup show';
    hintPopup.style.fontFamily = "monospace";
    hintPopup.innerHTML = `CLICKS: ${clickCount}/5<br>VALUE: ${rangeSlider ? parseFloat(rangeSlider.value).toFixed(2) : 'N/A'}`;

    document.querySelector('.item-content').appendChild(hintPopup);
    setTimeout(() => { if(hintPopup) hintPopup.remove(); }, 3000);
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

