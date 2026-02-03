// ========================================
// DOM ELEMENTS & STATE
// ========================================
const dateInput = document.getElementById('date-input');
const button = document.querySelector('.item-content button:not(.hint-button)');
const container = document.querySelector('.item-content');
const feedback = document.getElementById('feedback');
const mistakeList = document.getElementById('mistake-list');
const hintButton = document.getElementById('hint-button');

let clickCount = 0;
let mistakes = 0;
let buttonEnabled = false;
let hintPopup = null;
let liveErrorElement = null;

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
// DATE-SPECIFIC RESPONSES (The "Brain")
// ========================================
const DATE_RESPONSES = {
  // Day of the Week (0=Sun, 6=Sat)
  days: {
    0: ["oh i dont like money", "i'm so tired i'm staying home", "it's too cold"],
    1: ["oh no i have to do laundry", "i'm so tired i'm staying home", "it's too cold"],
    2: ["today is tacotuesday", "oh no i have to do laundry", "it's too cold"],
    3: ["wednesday? that's my test date", "oh no i have to do laundry", "i'm so tired i'm staying home"],
    4: ["i want to party on friday", "oh no i have to do laundry", "it's too cold"],
    5: ["i want to party on friday", "im getting laid tonight", "oh i dont like money"],
    6: ["im getting laid tonight", "oh i dont like money", "i'm so tired i'm staying home"]
  },
  // Specific Date Numbers (1-31)
  dates: {
    1: ["oh i dont like money", "i'm so tired i'm staying home"],
    13: ["oh goldfish is ill", "it's too cold"],
    14: ["im getting laid tonight", "oh i dont like money"],
    25: ["it's too cold", "oh no i have to do laundry"],
    31: ["i'm so tired i'm staying home", "oh goldfish is ill"]
  },
  // Specific Months (0=Jan, 11=Dec)
  months: {
    1: ["it's too cold", "oh no i have to do laundry"],
    11: ["it's too cold", "i'm so tired i'm staying home"]
  }
};

const RANDOM_SASS = [
  "oh i dont like money",
  "i want to party on friday",
  "im getting laid tonight",
  "today is tacotuesday",
  "wednesday? that's my test date",
  "oh no i have to do laundry",
  "oh goldfish is ill",
  "it's too cold",
  "i'm so tired i'm staying home"
];

function getDateSpecificMessage(dateObj) {
  const dayOfWeek = dateObj.getUTCDay();
  const dateNum = dateObj.getUTCDate();
  const month = dateObj.getUTCMonth();

  // Priority 1: Specific Date Number (e.g., 13th)
  if (DATE_RESPONSES.dates[dateNum]) {
    const pool = DATE_RESPONSES.dates[dateNum];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Priority 2: Specific Month (e.g., Feb)
  if (DATE_RESPONSES.months[month] && Math.random() < 0.3) {
    const pool = DATE_RESPONSES.months[month];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  // Priority 3: Day of Week (Sunday, Monday)
  if (DATE_RESPONSES.days[dayOfWeek]) {
    const pool = DATE_RESPONSES.days[dayOfWeek];
    return pool[Math.floor(Math.random() * pool.length)];
  }

  return RANDOM_SASS[Math.floor(Math.random() * RANDOM_SASS.length)];
}

// ========================================
// TEXT-TO-SPEECH ENGINE
// ========================================
function speakText(text) {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel(); // Stop any current speech
    const utterance = new SpeechSynthesisUtterance(text);
    
    // Make it sound slightly robotic
    utterance.rate = 0.9; 
    utterance.pitch = 0.8; 
    
    // Try to pick a specific voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.name.includes('Google US English')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    window.speechSynthesis.speak(utterance);
  }
}

// ========================================
// CSS INJECTION (GLITCH & ANIMATIONS)
// ========================================
const style = document.createElement('style');
style.textContent = `
  @keyframes shake-border { 
    0% { box-shadow: 0 0 0 0 rgba(128, 128, 128, 0.5); } 
    25% { box-shadow: -2px 0 0 2px rgba(128, 128, 128, 0.5); } 
    50% { box-shadow: 2px 0 0 2px rgba(128, 128, 128, 0.5); } 
    75% { box-shadow: 0 -2px 0 2px rgba(128, 128, 128, 0.5); } 
    100% { box-shadow: 0 0 0 0 rgba(128, 128, 128, 0.5); } 
  }
  .system-shake { animation: shake-border 0.4s; border-color: #808080 !important; }
  .glitch-text { font-family: 'Courier New', monospace; color: red !important; font-weight: bold; font-size: 11px; }
  .bottom-left-description { transform: none !important; animation: none !important; }
`;
document.head.appendChild(style);

// ========================================
// LOGIC HANDLERS
// ========================================
// Live error message that updates as user selects dates
function updateLiveError(dateValue) {
  if (buttonEnabled) return;

  // Remove existing live error
  if (liveErrorElement) {
    liveErrorElement.remove();
    liveErrorElement = null;
  }

  if (!dateValue) return;

  const dateObj = new Date(dateValue);
  const msg = getDateSpecificMessage(dateObj);

  // Show live error message
  liveErrorElement = document.createElement('div');
  liveErrorElement.textContent = `💬 ${msg}`;
  liveErrorElement.style.color = '#d32f2f';
  liveErrorElement.style.fontStyle = 'italic';
  liveErrorElement.style.fontSize = '14px';
  liveErrorElement.style.marginTop = '8px';
  liveErrorElement.style.fontFamily = "'Courier New', monospace";
  liveErrorElement.id = 'live-date-error';
  mistakeList.appendChild(liveErrorElement);
}

function handleSystemReaction(message) {
  // Audio Feedback (Speak the message)
  speakText(message);
  
  // Play error sound
  playSound('error');

  // Shake visual
  container.classList.remove('system-shake');
  void container.offsetWidth; // Trigger reflow
  container.classList.add('system-shake');
}

function addMistake(logText) {
  mistakes++;

  // Add log entry
  const div = document.createElement('div');
  const time = new Date().toLocaleTimeString('en-US', { hour12: false });
  div.style.fontFamily = "'Courier New', monospace";
  if (mistakes > 3) {
    div.style.color = "red";
    div.style.fontWeight = "bold";
  }
  div.textContent = `[${time}] ERR_0${mistakes}: ${logText}`;
  mistakeList.appendChild(div);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'DATEPICKER',
    error: logText,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));

  // UNLOCK CONDITION: 5 MISTAKES
  if (mistakes >= 5) {
    buttonEnabled = true;
    speakText("System reboot successful. Safe mode engaged.");
    playSound('success');

    // Reset UI
    feedback.textContent = 'SYSTEM TIRED OF YOU! SUCCESSFUL.';
    feedback.className = 'feedback-message warning';
    feedback.style.color = "green";

    button.style.backgroundColor = '#28a745';
    button.textContent = "PROCEED >";

    mistakeList.innerHTML += '<div style="color:green; font-weight:bold; margin-top:5px;">>> SAFE MODE ENGAGED.<br>>> CLICK PROCEED TO CONTINUE.</div>';
  }
}

// ========================================
// EVENT LISTENERS
// ========================================

// Live error message as user types/selects date
dateInput.addEventListener('input', (e) => {
  updateLiveError(e.target.value);
});

// 1. Date Change Logic (The Core Interaction)
dateInput.addEventListener('change', (e) => {
  if (buttonEnabled) return;

  const val = dateInput.value;
  if (!val) return;

  const dateObj = new Date(val);

  // GET THE DATE-SPECIFIC MESSAGE
  const msg = getDateSpecificMessage(dateObj);

  // React to it
  handleSystemReaction(msg);
  addMistake(`Date Rejected: ${msg}`);
});

// 2. Button Click Logic
if (button) {
  button.addEventListener('click', (e) => {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    
    if (!buttonEnabled) {
      e.preventDefault();

      const funMessages = [
        "Oh i dont like money",
        "I want to party on friday",
        "Im getting laid tonight",
        "Today is tacotuesday",
        "Wednesday? That's my test date",
        "Oh no i have to do laundry",
        "Oh my goldfish is ill",
        "It's too cold",
        "I'm so tired i'm staying home",
        "It's too hot",
        "I have a headache",
        "My car won't start",
        "I lost my keys",
        "I have to walk my dog",
        "I forgot my lunch",
        "Traffic is terrible today",
        "It's to romantic season",
        "I have Jon's zoometting",
        "My hardrive is running away",
        "I have TA Jobs",
        "We have Web To Print today",
      ];
      const msg = funMessages[Math.floor(Math.random() * funMessages.length)];
      handleSystemReaction(msg);
      addMistake(`Date Rejected: ${msg}`);

    } else {
      // Redirect
      speakText("Redirecting to Password Input.");
      button.textContent = "LOADING...";
      setTimeout(() => {
        window.markPageCompleted();
        window.location.href = '../FILE/file.html';
      }, 1000);
    }
  });
}

// 3. Hint Button
if (hintButton) {
  hintButton.addEventListener('click', () => {
    if (hintPopup) hintPopup.remove();

    const errorsLeft = Math.max(0, 5 - mistakes);
    const hintMsg = `Trigger ${errorsLeft} more errors to reboot system.`;
    speakText(hintMsg);

    hintPopup = document.createElement('div');
    hintPopup.className = 'hint-popup show';
    hintPopup.style.fontFamily = "monospace";
    hintPopup.innerHTML = `STATUS: LOCKED<br>ERRORS REQ: ${errorsLeft}`;

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
    allErrors.forEach((error) => {
      const errorDiv = document.createElement('div');
      errorDiv.style.fontFamily = "'Courier New', monospace";
      errorDiv.style.margin = '6px 0';
      errorDiv.textContent = `[${error.page}] ${error.error}`;
      mistakeList.appendChild(errorDiv);
    });
  }
});