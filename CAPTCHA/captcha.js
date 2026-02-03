// DOM
const captchaImages = document.getElementById('captcha-images');
const refreshBtn = document.getElementById('refresh-btn');
const submitBtn = document.getElementById('submit-btn');
const hintButton = document.getElementById('hint-button');
const input = document.getElementById('captcha-input');
const mistakeList = document.querySelector('.mistake-list');
const container = document.querySelector('.item-content');
const feedback = document.getElementById('feedback');

const INPUT_TYPES = ['URL', 'Password', 'Checkbox', 'Range', 'Color Picker', 'Date Picker', 'File Upload', 'CAPTCHA'];
let currentAnswer = '';
let mistakes = 0;
let hintPopup = null;
let buttonEnabled = false;
let celebrationStarted = false;
let clickCount = 0;
let fireworksRunning = false;

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

// Fireworks celebration
function startFireworks() {
  if (fireworksRunning) return; // prevent duplicate overlays
  fireworksRunning = true;

  // Inject styles once
  if (!document.getElementById('fireworks-style')) {
    const style = document.createElement('style');
    style.id = 'fireworks-style';
    style.textContent = `
      .fireworks-overlay {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
        overflow: visible;
        z-index: 99999;
      }
      .firework-rocket {
        position: absolute;
        width: 4px;
        height: 4px;
        background: #fff;
        border-radius: 50%;
        bottom: 0;
        box-shadow: 0 0 6px rgba(255,255,255,0.8);
      }
      .firework-particle {
        position: absolute;
        width: 6px;
        height: 6px;
        border-radius: 50%;
        pointer-events: none;
      }
      @keyframes rocket-launch {
        0% {
          transform: translateY(0);
          opacity: 1;
        }
        100% {
          transform: translateY(var(--rocket-y));
          opacity: 0;
        }
      }
      @keyframes particle-explode {
        0% {
          transform: translate(0, 0) scale(1);
          opacity: 1;
        }
        100% {
          transform: translate(var(--particle-x), var(--particle-y)) scale(0);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement('div');
  overlay.className = 'fireworks-overlay';
  document.body.appendChild(overlay);

  const launchFirework = () => {
    // Random launch position
    const launchX = Math.random() * 100;
    const explodeY = 30 + Math.random() * 40; // Explode in upper portion of screen
    
    // Create rocket
    const rocket = document.createElement('div');
    rocket.className = 'firework-rocket';
    rocket.style.left = `${launchX}%`;
    rocket.style.bottom = '0';
    rocket.style.setProperty('--rocket-y', `-${explodeY}vh`);
    rocket.style.animation = `rocket-launch 0.8s ease-out forwards`;
    overlay.appendChild(rocket);

    // After rocket reaches top, explode
    setTimeout(() => {
      if (rocket.parentNode) rocket.remove();
      
      // Create explosion with particles
      const particleCount = 30 + Math.floor(Math.random() * 20);
      const hue = Math.floor(Math.random() * 360);
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'firework-particle';
        
        // Random angle for particle direction
        const angle = (Math.PI * 2 * i) / particleCount + Math.random() * 0.5;
        const velocity = 30 + Math.random() * 40;
        const particleX = Math.cos(angle) * velocity;
        const particleY = Math.sin(angle) * velocity;
        
        particle.style.left = `${launchX}%`;
        particle.style.top = `${100 - explodeY}%`;
        particle.style.setProperty('--particle-x', `${particleX}vw`);
        particle.style.setProperty('--particle-y', `${particleY}vh`);
        particle.style.background = `hsl(${hue + Math.random() * 30}, 80%, 60%)`;
        particle.style.boxShadow = `0 0 8px hsl(${hue}, 80%, 60%)`;
        particle.style.animation = `particle-explode ${0.8 + Math.random() * 0.4}s ease-out forwards`;
        
        overlay.appendChild(particle);
        
        setTimeout(() => {
          if (particle.parentNode) particle.remove();
        }, 1200);
      }
    }, 800);
  };

  // Launch multiple fireworks
  const launchInterval = setInterval(launchFirework, 400);
  
  // Launch initial fireworks
  launchFirework();
  setTimeout(() => launchFirework(), 200);
  setTimeout(() => launchFirework(), 400);

  setTimeout(() => {
    clearInterval(launchInterval);
    setTimeout(() => {
      if (overlay.parentNode) overlay.remove();
      fireworksRunning = false;
    }, 2000);
  }, 5000);
}

function generateInputImages() {
  captchaImages.innerHTML = '';
  currentAnswer = INPUT_TYPES[Math.floor(Math.random() * INPUT_TYPES.length)];

  // Build option list with correct answer + 5 random others (6 total)
  // Ensure all are unique and random
  const options = [currentAnswer];
  const availableTypes = [...INPUT_TYPES]; // Copy array
  
  // Remove the current answer from available types to avoid duplicates
  const answerIndex = availableTypes.indexOf(currentAnswer);
  if (answerIndex > -1) {
    availableTypes.splice(answerIndex, 1);
  }
  
  // Randomly select 5 more unique types
  while (options.length < 6 && availableTypes.length > 0) {
    const randomIndex = Math.floor(Math.random() * availableTypes.length);
    const selected = availableTypes.splice(randomIndex, 1)[0];
    options.push(selected);
  }

  // Shuffle options to randomize positions
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  options.forEach((inputType) => {
    const imgContainer = document.createElement('div');
    imgContainer.className = 'input-image-container';
    imgContainer.dataset.type = inputType;

    // Use iframe to display screenshot HTML files
    const iframe = document.createElement('iframe');
    iframe.src = getInputImage(inputType);
    iframe.scrolling = 'no';
    iframe.style.width = '100%';
    iframe.style.height = '60px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '3px';
    iframe.className = 'input-image';

    // Remove auto-fill on click - users must type the answer themselves
    // imgContainer.addEventListener('click', () => {
    //   input.value = inputType;
    //   input.focus();
    // });

    imgContainer.appendChild(iframe);
    captchaImages.appendChild(imgContainer);
  });
}

function getInputImage(inputType) {
  const images = {
    'URL': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect x='10' y='30' width='180' height='30' fill='%23f5f5f5' stroke='%23999' stroke-width='2'/%3E%3Ctext x='20' y='50' font-family='Arial' font-size='14' fill='%23666'%3Ehttps://example.com%3C/text%3E%3C/svg%3E",
    'Password': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect x='10' y='30' width='180' height='30' fill='%23f5f5f5' stroke='%23999' stroke-width='2'/%3E%3Ccircle cx='30' cy='45' r='4' fill='%23333'/%3E%3Ccircle cx='50' cy='45' r='4' fill='%23333'/%3E%3Ccircle cx='70' cy='45' r='4' fill='%23333'/%3E%3Ccircle cx='90' cy='45' r='4' fill='%23333'/%3E%3C/svg%3E",
    'Checkbox': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect x='10' y='25' width='24' height='24' fill='none' stroke='%23999' stroke-width='3'/%3E%3Cpolyline points='14 34 20 40 32 28' stroke='%23333' stroke-width='3' fill='none'/%3E%3Ctext x='50' y='43' font-family='Arial' font-size='16' fill='%23333'%3EOption%3C/text%3E%3C/svg%3E",
    'Range': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Cline x1='10' y1='45' x2='190' y2='45' stroke='%23999' stroke-width='6'/%3E%3Ccircle cx='110' cy='45' r='10' fill='%23999'/%3E%3C/svg%3E",
    'Color Picker': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect x='20' y='15' width='160' height='50' fill='%233498db' stroke='%23999' stroke-width='3'/%3E%3C/svg%3E",
    'Date Picker': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect x='10' y='30' width='180' height='30' fill='%23f5f5f5' stroke='%23999' stroke-width='2'/%3E%3Ctext x='20' y='50' font-family='Arial' font-size='16' fill='%23666'%3E12/10/2025%3C/text%3E%3C/svg%3E",
    'File Upload': "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='80' viewBox='0 0 200 80'%3E%3Crect x='10' y='30' width='180' height='30' fill='%23f5f5f5' stroke='%23999' stroke-width='2'/%3E%3Ctext x='20' y='50' font-family='Arial' font-size='14' fill='%23666'%3EChoose File%3C/text%3E%3C/svg%3E"
  };
  return images[inputType] || images['URL'];
}

function logMistake(msg) {
  const div = document.createElement('div');
  div.textContent = `Error #${mistakes}: ${msg}`;
  mistakeList.appendChild(div);

  // Persist in global error log
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'CAPTCHA',
    error: msg,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));
}

function showFeedback(msg, type = 'error') {
  feedback.textContent = msg;
  feedback.className = `feedback-message ${type}`;
  feedback.classList.remove('hidden');
}

function clearFeedback() {
  feedback.textContent = '';
  feedback.className = 'feedback-message hidden';
}

function validateCaptcha() {
  const userVal = input.value.trim();
  if (!userVal) {
    playSound('error');
    mistakes++;
    logMistake('Empty input. Try typing something.');
    showFeedback('No input detected. Are you even trying?', 'error');
    container.classList.add('system-shake');
    setTimeout(() => container.classList.remove('system-shake'), 400);
    return;
  }

  const normalizedUser = userVal.toLowerCase().replace(/\s+/g, ' ');
  const normalizedAnswer = currentAnswer.toLowerCase();
  const isMatch = normalizedUser === normalizedAnswer || normalizedUser.includes(normalizedAnswer) || normalizedAnswer.includes(normalizedUser);

  if (isMatch) {
    playSound('success');
    showFeedback('Correct! But keep clicking...', 'warning');
  } else {
    playSound('error');
    mistakes++;
    logMistake(`Wrong input type: ${userVal}. Correct answer was: ${currentAnswer}`);
    showFeedback(`Nope. That's not a ${currentAnswer}. Try again.`, 'error');
    submitBtn.style.backgroundColor = ''; // Reset button color
    container.classList.add('system-shake');
    setTimeout(() => container.classList.remove('system-shake'), 400);
    generateInputImages();
    input.value = '';
    input.focus();
  }
}

refreshBtn.addEventListener('click', (e) => {
  e.preventDefault();
  generateInputImages();
  clearFeedback();
  input.value = '';
  input.focus();
});

submitBtn.addEventListener('click', (e) => {
  e.preventDefault();
  if (audioCtx.state === 'suspended') audioCtx.resume();

  // If button is already enabled, show fireworks and proceed
  if (buttonEnabled) {
    // Prevent multiple triggers
    if (celebrationStarted) return;
    
    celebrationStarted = true;
    showFeedback('Celebrating! Redirecting after fireworks...', 'warning');
    
    // Reset fireworks flag to allow them to start
    fireworksRunning = false;
    startFireworks();
    
    // Wait 5 seconds before redirecting
    setTimeout(() => {
      if (typeof window.markPageCompleted === 'function') {
        window.markPageCompleted();
      }
      window.location.href = '../Home page/index.html';
    }, 5000);
    return;
  }

  // Count clicks toward enablement
  clickCount++;

  // On the 5th click, enable and turn green; next click will proceed with fireworks
  if (clickCount >= 5) {
    buttonEnabled = true;
    submitBtn.style.backgroundColor = '#28a745';
    playSound('success');
    mistakeList.innerHTML = '<div style="color: #2e7d32; font-weight: bold;">Dude you need Glasses!!</div>';
    return;
  }

  // If button not enabled, validate the captcha
  validateCaptcha();
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    if (buttonEnabled) {
      // If button is enabled, treat Enter like clicking the button
      submitBtn.click();
    } else {
      // Otherwise validate
      validateCaptcha();
    }
  }
});

if (hintButton) {
  hintButton.addEventListener('click', (e) => {
    e.preventDefault();
    if (hintPopup) hintPopup.remove();
    hintPopup = document.createElement('div');
    hintPopup.className = 'hint-popup show';
    hintPopup.textContent = 'Look at the images and identify the input type';
    document.querySelector('.item-content').appendChild(hintPopup);
    setTimeout(() => { if (hintPopup) hintPopup.remove(); }, 2500);
  });
}

// Start
generateInputImages();
input.focus();

// Print: show all recorded errors across pages
let prePrintContent = '';
window.addEventListener('beforeprint', () => {
  prePrintContent = mistakeList.innerHTML;
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  mistakeList.innerHTML = '';

  if (allErrors.length === 0) {
    mistakeList.innerHTML = '<div>No errors recorded.</div>';
  } else {
    allErrors.forEach((error, index) => {
      const errorDiv = document.createElement('div');
      errorDiv.textContent = `[${error.page}] Error #${index + 1}: ${error.error}`;
      mistakeList.appendChild(errorDiv);
    });
  }
});
// After print: restore original content so the page doesn't stay filled with all errors
window.addEventListener('afterprint', () => {
  if (prePrintContent !== undefined) {
    mistakeList.innerHTML = prePrintContent;
  }
});

