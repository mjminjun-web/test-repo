const fileInput = document.getElementById('file');
const uploadButton = document.getElementById('upload-btn');
const feedback = document.getElementById('feedback');
const mistakeList = document.querySelector('.mistake-list');
const hintButton = document.getElementById('hint-button');

let clickCount = 0;
let mistakes = 0;
let buttonEnabled = false;
let selectedFile = null;
let fileDialogBlocked = false;
let hintPopup = null;

// Function to play error sound with increasing volume
function playErrorSound(errorCount) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 200; // Low frequency for error sound
  oscillator.type = 'sawtooth';

  // Increase volume by 0.2 for each error
  const volume = Math.min(0.2 + (errorCount * 0.2), 1.0);
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

// Function to play success sound
function playSuccessSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  // Play a pleasant ascending tone
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5 (C major chord)

  notes.forEach((frequency, index) => {
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    const startTime = audioContext.currentTime + (index * 0.15);
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.4);
  });
}

// Contextual humiliating file error messages
function getFileErrorMessage(fileName, errorType) {
  const messages = {
    noFile: [
      "Oops, your file forgot its name tag! Add '.pdf' or '.jpg' so it knows who it is.",
      "No file selected. Did you forget what you were doing?",
      "Empty hands. You were supposed to upload something.",
      "I'm waiting for a file. Still waiting. Any day now."
    ],
    wrongFormat: [
      `"${fileName}" - PNG format not detected. Did you mean to upload a .png?`,
      `"${fileName}" - SVG interpreter failed. Try a .jpeg instead.`,
      `"${fileName}" - PDF parser failed. Maybe upload a .docx?`,
      `"${fileName}" - GIF sequencer failed. Switch to .jpeg.`,
      `"${fileName}" - PPT loader failed. Try .pdf instead.`,
      `"${fileName}" - AI file failed. Upload .svg instead.`,
      `"${fileName}" - PSD file failed. Try .ai maybe?`,
      `"${fileName}" - INDD parser failed. Upload .psd instead.`,
      `Really? "${fileName}"? That's not even a valid format.`,
      `"${fileName}" is garbage. Upload something real.`
    ],
    tooBig: [
      `"${fileName}" is way too big. Did you upload a movie?`,
      `File "${fileName}" is THICC. Too thicc for us.`,
      `"${fileName}" ate the whole internet. Compress it.`,
      `Server looked at "${fileName}" and said "absolutely not."`,
      `"${fileName}" needs its own zip code. It's massive.`
    ],
    tooSmall: [
      `"${fileName}" is suspiciously small. Is it even a file?`,
      `"${fileName}" is basically invisible. Add some content.`,
      `Is "${fileName}" just air? It weighs nothing.`,
      `"${fileName}" is on a diet. Too skinny to process.`
    ],
    hasSpaces: [
      `"${fileName}" has spaces. System from 1995 can't handle it.`,
      `Spaces in "${fileName}" broke everything. Use underscores.`,
      `"${fileName}" - Those spaces? System hates them.`,
      `File "${fileName}" needs to remove spaces. Use _ or -`
    ],
    formatNotAccepted: [
      `"${fileName}" - Sorry, .jpg files are not accepted at this time.`,
      `"${fileName}" - .png format is temporarily unavailable. Try something else.`,
      `"${fileName}" - We don't support .pdf files right now. Use a different format.`,
      `"${fileName}" - .gif files blocked by security policy. Try .jpeg instead.`,
      `"${fileName}" - .svg files are not allowed. Upload .png instead.`,
      `"${fileName}" - .docx format disabled. System update broke it.`,
      `"${fileName}" - .jpeg files causing server issues. Try .png.`,
      `"${fileName}" - .indd files rejected. Upload .pdf instead.`,
      `"${fileName}" - That file type is on the naughty list today.`
    ],
    cannotLocate: [
      `Cannot locate '${fileName}'. Check spelling and reselect the file.`,
      `File '${fileName}' not found. Did you move it?`,
      `System cannot find '${fileName}'. Verify the file exists.`,
      `'${fileName}' is missing. Please reselect the file.`,
      `Unable to locate '${fileName}'. File may have been deleted.`,
      `'${fileName}' disappeared. Check file location and try again.`
    ],
    serverError: [
      `Server error processing request. Contact support.`,
      `Internal server error while uploading '${fileName}'. Try again later.`,
      `Server encountered an error. Unable to process '${fileName}'.`,
      `Upload failed: Server error 500. Contact administrator.`,
      `Server crashed processing '${fileName}'. Please retry.`,
      `Backend service unavailable. Cannot upload '${fileName}' right now.`
    ]
  };

  const typeMessages = messages[errorType] || messages.wrongFormat;
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

// Legacy function for non-file-specific errors
function getRandomError(type) {
  const errors = {
    connectionLost: [
      "WiFi sneezed and your file disappeared into the void. Poof!",
      "Connection had a brain fart. File vanished mid-upload.",
      "Internet connection played hide and seek. File lost. Forever? Maybe.",
      "Server got distracted by a shiny object. File escaped.",
      "Upload got interrupted by digital gremlins. They're mischievous today."
    ],
    buttonFail: [
      "Button pretending to be asleep. Try poking it again.",
      "Click landed but button was on coffee break. Rude.",
      "Button was daydreaming. Missed your click entirely.",
      "Upload button zoned out. Happens to the best of us.",
      "Button had a little glitch moment. It's back now. Probably."
    ],
    browserQuirks: [
      "Browser having a moment. File dialog shy today.",
      "File system waking up from nap. Give it a sec.",
      "Browser security being paranoid. It'll calm down.",
      "Input field got confused. Classic browser behavior.",
      "File picker needed coffee break. Recharging now."
    ]
  };

  const typeErrors = errors[type] || errors.browserQuirks;
  return typeErrors[Math.floor(Math.random() * typeErrors.length)];
}

function showFeedback(message, type = 'error') {
  // Show feedback in mistake counter instead of separate box
  const feedbackDiv = document.createElement('div');
  feedbackDiv.textContent = message;
  feedbackDiv.style.color = type === 'warning' ? '#666' : '#555';
  feedbackDiv.style.fontStyle = 'italic';
  mistakeList.appendChild(feedbackDiv);
}

function addMistake(mistakeText) {
  mistakes++;

  const mistakeDiv = document.createElement('div');
  mistakeDiv.textContent = `Error #${mistakes}: ${mistakeText}`;
  mistakeList.appendChild(mistakeDiv);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'FILE',
    error: mistakeText,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));

  // After 5 mistakes, enable the button
  if (mistakes >= 5) {
    playSuccessSound();
    buttonEnabled = true;
    showFeedback('System ready. Click Next to proceed.', 'warning');
    uploadButton.style.backgroundColor = '#28a745';
    mistakeList.innerHTML = '<div style="color: #2e7d32; font-weight: bold;">Well done, champ—your file name was wrong. STUPID!</div>';
  }
}

function validateFile(file) {
  if (!file) {
    return { valid: false, error: getFileErrorMessage('', 'noFile') };
  }

  const fileName = file.name;
  const fileSize = file.size;

  // Check for no file extension first
  if (!fileName.includes('.')) {
    return { valid: false, error: getFileErrorMessage(fileName, 'wrongFormat') };
  }

  // Check for spaces in filename (common issue)
  if (fileName.includes(' ')) {
    return { valid: false, error: getFileErrorMessage(fileName, 'hasSpaces') };
  }

  // Check for invalid file format
  const extension = fileName.split('.').pop().toLowerCase();
  const validExtensions = ['pdf', 'doc', 'docx', 'jpg', 'jpeg', 'png', 'gif', 'svg', 'indd'];

  if (!validExtensions.includes(extension)) {
    return { valid: false, error: getFileErrorMessage(fileName, 'wrongFormat') };
  }

  // RANDOM QUIRK: Sometimes reject valid file types (15% chance)
  if (Math.random() < 0.15 && !buttonEnabled) {
    return { valid: false, error: getFileErrorMessage(fileName, 'formatNotAccepted') };
  }

  // File size too big (over 5MB)
  if (fileSize > 5 * 1024 * 1024) {
    return { valid: false, error: getFileErrorMessage(fileName, 'tooBig') };
  }

  // File size too small (suspiciously small, under 1KB)
  if (fileSize < 1024) {
    return { valid: false, error: getFileErrorMessage(fileName, 'tooSmall') };
  }

  // Check for uppercase extension (common mistake)
  const actualExtension = fileName.split('.').pop();
  if (actualExtension !== extension && validExtensions.includes(extension)) {
    return { valid: false, error: `CAPS LOCK DETECTED! "${fileName}" needs lowercase extension. Calm down.` };
  }

  return { valid: true, error: null };
}

// BROWSER QUIRK: Simulate file dialog delay
fileInput.addEventListener('click', (e) => {
  if (Math.random() < 0.25 && !buttonEnabled && !fileDialogBlocked) {
    e.preventDefault();
    fileDialogBlocked = true;

    setTimeout(() => {
      fileDialogBlocked = false;
      fileInput.click();
    }, 1800);
  }
});

// File input change event
fileInput.addEventListener('change', (e) => {
  selectedFile = e.target.files[0];
});

// Upload button behavior - shake and dodge
uploadButton.addEventListener('mouseenter', () => {
  if (clickCount < 3 && !buttonEnabled) {
    const randomX = Math.random() * 20 - 10;
    const randomY = Math.random() * 20 - 10;
    uploadButton.style.transform = `translate(${randomX}px, ${randomY}px)`;
    uploadButton.style.transition = 'transform 0.3s';

    // Random chance for button to "shake nervously"
    if (Math.random() < 0.3) {
      uploadButton.style.animation = 'shake 0.5s';
      setTimeout(() => {
        uploadButton.style.animation = '';
      }, 500);
    }
  }
});

uploadButton.addEventListener('mouseleave', () => {
  if (!buttonEnabled) {
    uploadButton.style.transform = 'translate(0, 0)';
  }
});

// Add shake animation dynamically
const style = document.createElement('style');
style.textContent = `
  @keyframes shake {
    0%, 100% { transform: translate(0, 0) rotate(0deg); }
    25% { transform: translate(-3px, 0) rotate(-2deg); }
    75% { transform: translate(3px, 0) rotate(2deg); }
  }
`;
document.head.appendChild(style);

uploadButton.addEventListener('click', (e) => {
  if (!buttonEnabled) {
    e.preventDefault();

    if (!selectedFile) {
      playErrorSound(mistakes);
      addMistake('No file selected. Choose a file first.');
      clickCount++;
      return;
    }

    // Validate the file and show specific error about what's wrong
    const validation = validateFile(selectedFile);

    if (!validation.valid) {
      playErrorSound(mistakes);
      addMistake(validation.error);
    } else {
      // File format is valid, but simulate random errors
      playErrorSound(mistakes);
      // Randomly choose between "cannotLocate" and "serverError" (50/50 chance)
      const errorType = Math.random() < 0.5 ? 'cannotLocate' : 'serverError';
      addMistake(getFileErrorMessage(selectedFile.name, errorType));
    }

    clickCount++;
  } else {
    // Button is enabled, redirect to next page
    showFeedback('Success! Redirecting...', 'warning');
    setTimeout(() => {
      window.markPageCompleted();
      window.location.href = '../CAPTCHA/captcha.html';
    }, 100);
  }
});

// BROWSER QUIRK: Input randomly resets (browser loses focus)
setInterval(() => {
  if (Math.random() < 0.04 && selectedFile && !buttonEnabled) {
    fileInput.value = '';
    selectedFile = null;
    showFeedback('⚠️ Browser lost focus. Input reset. Classic browser move.', 'warning');
  }
}, 6000);

// Randomly reset file input
setInterval(() => {
  if (Math.random() < 0.03 && selectedFile && !buttonEnabled) {
    fileInput.value = '';
    selectedFile = null;
    showFeedback('⚠️ Server got bored waiting. File evaporated. Select again!', 'warning');
  }
}, 5000);

// ========================================
// HINT BUTTON
// ========================================
hintButton.addEventListener('click', (e) => {
  e.preventDefault();

  if (hintPopup) {
    hintPopup.remove();
  }

  hintPopup = document.createElement('div');
  hintPopup.className = 'hint-popup show';
  hintPopup.textContent = 'Click 5 times to proceed';

  document.querySelector('.item-content').appendChild(hintPopup);

  setTimeout(() => {
    if (hintPopup) {
      hintPopup.remove();
      hintPopup = null;
    }
  }, 3000);
});

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
      errorDiv.textContent = `[${error.page}] Error #${index + 1}: ${error.error}`;
      mistakeList.appendChild(errorDiv);
    });
  }
});