// ========================================
// DOM ELEMENTS & STATE
// ========================================
const targetHexDisplay = document.getElementById('target-hex');
const previewBox = document.getElementById('preview-box');
const colorInput = document.getElementById('color-input');
const submitBtn = document.getElementById('submit-btn');
const feedback = document.getElementById('feedback');
const mistakeList = document.getElementById('mistake-list');
const hintButton = document.getElementById('hint-button');
const container = document.querySelector('.item-content');

let targetColor = generateRandomColor();
let mistakes = 0;
let hintPopup = null;
let clickCount = 0;
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
// CSS INJECTION (Styling the Errors)
// ========================================
const style = document.createElement('style');
style.textContent = `
  @keyframes shake { 0% { transform: translate(1px, 1px) rotate(0deg); } 20% { transform: translate(-3px, 0px) rotate(1deg); } 40% { transform: translate(1px, -1px) rotate(1deg); } 60% { transform: translate(-3px, 1px) rotate(0deg); } 80% { transform: translate(-1px, -1px) rotate(1deg); } 100% { transform: translate(1px, -2px) rotate(-1deg); } }

  .system-shake { animation: shake 0.4s; border-color: red !important; }

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
// COLOR LIBRARY
// ========================================
const COLOR_NAMES = {
  '#FF0000': 'Red', '#00FF00': 'Lime', '#0000FF': 'Blue', '#FFFF00': 'Yellow',
  '#00FFFF': 'Cyan', '#FF00FF': 'Magenta', '#C0C0C0': 'Silver', '#808080': 'Gray',
  '#800000': 'Maroon', '#808000': 'Olive', '#008000': 'Green', '#800080': 'Purple',
  '#008080': 'Teal', '#000080': 'Navy', '#FFA500': 'Orange', '#FFC0CB': 'Pink',
  '#A52A2A': 'Brown', '#FFD700': 'Gold', '#4B0082': 'Indigo', '#EE82EE': 'Violet',
  '#F0E68C': 'Khaki', '#E6E6FA': 'Lavender', '#FFDAB9': 'Peach Puff', '#CD5C5C': 'Indian Red',
  '#F08080': 'Light Coral', '#FA8072': 'Salmon', '#E9967A': 'Dark Salmon', '#FFA07A': 'Light Salmon',
  '#DC143C': 'Crimson', '#FF1493': 'Deep Pink', '#FF69B4': 'Hot Pink', '#FFB6C1': 'Light Pink',
  '#FF6347': 'Tomato', '#FF4500': 'Orange Red', '#FF8C00': 'Dark Orange', '#FFD700': 'Gold',
  '#FFFF00': 'Yellow', '#FFFFE0': 'Light Yellow', '#FFFACD': 'Lemon Chiffon', '#FAFAD2': 'Light Goldenrod Yellow',
  '#FFEFD5': 'Papaya Whip', '#FFE4B5': 'Moccasin', '#FFDAB9': 'Peach Puff', '#EEE8AA': 'Pale Goldenrod',
  '#F0E68C': 'Khaki', '#BDB76B': 'Dark Khaki', '#E6E6FA': 'Lavender', '#D8BFD8': 'Thistle',
  '#DDA0DD': 'Plum', '#EE82EE': 'Violet', '#DA70D6': 'Orchid', '#FF00FF': 'Fuchsia',
  '#BA55D3': 'Medium Orchid', '#9370DB': 'Medium Purple', '#8A2BE2': 'Blue Violet', '#9400D3': 'Dark Violet',
  '#9932CC': 'Dark Orchid', '#8B008B': 'Dark Magenta', '#4B0082': 'Indigo', '#6A5ACD': 'Slate Blue',
  '#483D8B': 'Dark Slate Blue', '#7B68EE': 'Medium Slate Blue', '#ADFF2F': 'Green Yellow', '#7FFF00': 'Chartreuse',
  '#7CFC00': 'Lawn Green', '#00FF00': 'Lime', '#32CD32': 'Lime Green', '#98FB98': 'Pale Green',
  '#90EE90': 'Light Green', '#00FA9A': 'Medium Spring Green', '#00FF7F': 'Spring Green', '#3CB371': 'Medium Sea Green',
  '#2E8B57': 'Sea Green', '#228B22': 'Forest Green', '#008000': 'Green', '#006400': 'Dark Green',
  '#9ACD32': 'Yellow Green', '#6B8E23': 'Olive Drab', '#808000': 'Olive', '#556B2F': 'Dark Olive Green',
  '#66CDAA': 'Medium Aquamarine', '#8FBC8F': 'Dark Sea Green', '#20B2AA': 'Light Sea Green', '#008B8B': 'Dark Cyan',
  '#008080': 'Teal', '#00CED1': 'Dark Turquoise', '#40E0D0': 'Turquoise', '#48D1CC': 'Medium Turquoise',
  '#AFEEEE': 'Pale Turquoise', '#E0FFFF': 'Light Cyan', '#00FFFF': 'Aqua', '#00FFFF': 'Cyan',
  '#5F9EA0': 'Cadet Blue', '#4682B4': 'Steel Blue', '#B0C4DE': 'Light Steel Blue', '#B0E0E6': 'Powder Blue',
  '#ADD8E6': 'Light Blue', '#87CEEB': 'Sky Blue', '#87CEFA': 'Light Sky Blue', '#00BFFF': 'Deep Sky Blue',
  '#1E90FF': 'Dodger Blue', '#6495ED': 'Cornflower Blue', '#4169E1': 'Royal Blue', '#0000FF': 'Blue',
  '#0000CD': 'Medium Blue', '#00008B': 'Dark Blue', '#000080': 'Navy', '#191970': 'Midnight Blue',
  '#FFF8DC': 'Cornsilk', '#FFEBCD': 'Blanched Almond', '#FFE4C4': 'Bisque', '#FFDEAD': 'Navajo White',
  '#F5DEB3': 'Wheat', '#DEB887': 'Burlywood', '#D2B48C': 'Tan', '#BC8F8F': 'Rosy Brown',
  '#F4A460': 'Sandy Brown', '#DAA520': 'Goldenrod', '#B8860B': 'Dark Goldenrod', '#CD853F': 'Peru',
  '#D2691E': 'Chocolate', '#8B4513': 'Saddle Brown', '#A0522D': 'Sienna', '#A52A2A': 'Brown',
  '#800000': 'Maroon', '#FFFFFF': 'White', '#FFFAFA': 'Snow', '#F0FFF0': 'Honeydew',
  '#F5FFFA': 'Mint Cream', '#F0FFFF': 'Azure', '#F0F8FF': 'Alice Blue', '#F8F8FF': 'Ghost White',
  '#F5F5F5': 'White Smoke', '#FFF5EE': 'Seashell', '#F5F5DC': 'Beige', '#FDF5E6': 'Old Lace',
  '#FFFAF0': 'Floral White', '#FFFFF0': 'Ivory', '#FAEBD7': 'Antique White', '#FAF0E6': 'Linen',
  '#FFF0F5': 'Lavender Blush', '#FFE4E1': 'Misty Rose', '#DCDCDC': 'Gainsboro', '#D3D3D3': 'Light Gray',
  '#C0C0C0': 'Silver', '#A9A9A9': 'Dark Gray', '#808080': 'Gray', '#696969': 'Dim Gray',
  '#778899': 'Light Slate Gray', '#708090': 'Slate Gray', '#2F4F4F': 'Dark Slate Gray', '#000000': 'Black'
};

// ========================================
// UTILITY FUNCTIONS
// ========================================
function generateRandomColor() {
    return '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0').toUpperCase();
}

function getColorName(hex) {
  // First, check if exact match in library
  if (COLOR_NAMES[hex]) {
    return COLOR_NAMES[hex];
  }

  // Otherwise, find closest color name
  let closestColor = null;
  let minDistance = Infinity;

  const r1 = parseInt(hex.substring(1, 3), 16);
  const g1 = parseInt(hex.substring(3, 5), 16);
  const b1 = parseInt(hex.substring(5, 7), 16);

  for (const [colorHex, colorName] of Object.entries(COLOR_NAMES)) {
    const r2 = parseInt(colorHex.substring(1, 3), 16);
    const g2 = parseInt(colorHex.substring(3, 5), 16);
    const b2 = parseInt(colorHex.substring(5, 7), 16);

    const distance = Math.sqrt(
      Math.pow(r1 - r2, 2) +
      Math.pow(g1 - g2, 2) +
      Math.pow(b1 - b2, 2)
    );

    if (distance < minDistance) {
      minDistance = distance;
      closestColor = colorName;
    }
  }

  return closestColor || 'Unknown Color';
}

function logMistake(msg) {
  const div = document.createElement('div');
  div.className = 'log-entry';
  div.textContent = `ERROR: ${msg}`;
  mistakeList.appendChild(div);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'COLOR PICKER',
    error: msg,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));

  const counter = document.querySelector('.mistake-counter');
  if(counter) counter.scrollTop = counter.scrollHeight;
}

function showFeedback(message, type = 'error') {
  // Show feedback in mistake counter instead of separate box
  const feedbackDiv = document.createElement('div');
  feedbackDiv.textContent = message;
  feedbackDiv.style.color = type === 'warning' ? '#666' : '#555';
  feedbackDiv.style.fontStyle = 'italic';
  mistakeList.appendChild(feedbackDiv);
}

// ========================================
// INITIALIZATION
// ========================================
function init() {
    const colorName = getColorName(targetColor);
    targetHexDisplay.textContent = colorName;
    targetHexDisplay.style.color = targetColor;
    previewBox.style.backgroundColor = targetColor;
    previewBox.textContent = "";

    // Keep button text as "Next" (already set in HTML)

    // Add live color display label
    const liveColorLabel = document.createElement('label');
    liveColorLabel.id = 'live-color-label';
    liveColorLabel.style.cssText = 'margin-top: 10px; font-size: 14px; color: #666;';
    liveColorLabel.innerHTML = 'Your Selection: <span id="live-color-name" style="font-weight: bold; color: #000;">None</span>';

    const colorInputElement = document.getElementById('color-input');
    colorInputElement.parentNode.insertBefore(liveColorLabel, colorInputElement.nextSibling);
}

// ========================================
// MAIN INTERACTION
// ========================================
submitBtn.addEventListener('click', (e) => {
    e.preventDefault();
    if (audioCtx.state === 'suspended') audioCtx.resume();

    // If button is already enabled, redirect to next page
    if (buttonEnabled) {
        setTimeout(() => {
            if (typeof window.markPageCompleted === 'function') {
                window.markPageCompleted();
            }
            window.location.href = '../DATEPICKER/datepicker.html';
        }, 100);
        return;
    }

    const userColor = colorInput.value.toUpperCase();

    // Count clicks toward enablement
    clickCount++;

    // On the 5th click, enable and turn green; next click will proceed
    if (clickCount >= 5) {
        buttonEnabled = true;
        submitBtn.style.backgroundColor = '#28a745';
        playSound('success');
        mistakeList.innerHTML = '<div style="color: #2e7d32; font-weight: bold;">Are you color blind?</div>';
        return;
    }

    // Keep button as "Next" (no click countdown message)
    playSound('error');

    // Validate hex color format (but don't block progression)
    const hexPattern = /^#[0-9A-F]{6}$/i;
    if (!hexPattern.test(userColor)) {
        // Invalid format
        mistakes++;
        logMistake(`Invalid color format. Please enter a valid hex color (e.g., #FF0000).`);
        container.classList.remove('system-shake');
        void container.offsetWidth;
        container.classList.add('system-shake');
        return;
    }

    // Check if color is close enough (within threshold) - just for feedback
    const colorDistance = calculateColorDistance(userColor, targetColor);
    const CLOSE_ENOUGH_THRESHOLD = 15;
    
    if (colorDistance <= CLOSE_ENOUGH_THRESHOLD) {
        // Color is close enough - show success feedback
        playSound('success');
        submitBtn.style.backgroundColor = '#28a745';
        logMistake("Color is close enough!");
        previewBox.style.backgroundColor = userColor;
        previewBox.textContent = "";
    } else {
        // Color not close enough - show error feedback
        mistakes++;
        const userColorName = getColorName(userColor);
        const specificMessage = `Wrong color. You picked ${userColorName} (${userColor}).`;
        showFeedback(specificMessage, 'error');
        logMistake(specificMessage);

        // Reset button color
        submitBtn.style.backgroundColor = '';

        container.classList.remove('system-shake');
        void container.offsetWidth;
        container.classList.add('system-shake');
    }
});

// Update preview box and clear feedback on input change with enhanced responsiveness
colorInput.addEventListener('input', () => {
    feedback.className = 'feedback-message hidden';
    const userColor = colorInput.value.toUpperCase();

    // Update preview box background
    previewBox.style.backgroundColor = userColor;

    // Show the hex value in real-time
    previewBox.textContent = userColor;
    previewBox.style.fontSize = '14px';
    previewBox.style.fontWeight = 'bold';
    previewBox.style.display = 'flex';
    previewBox.style.alignItems = 'center';
    previewBox.style.justifyContent = 'center';

    // Calculate color brightness to adjust text color for readability
    const r = parseInt(userColor.substring(1, 3), 16);
    const g = parseInt(userColor.substring(3, 5), 16);
    const b = parseInt(userColor.substring(5, 7), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    // Use white text on dark colors, black text on light colors
    previewBox.style.color = brightness > 128 ? '#000000' : '#FFFFFF';

    // Update live color name display
    const liveColorNameSpan = document.getElementById('live-color-name');
    if (liveColorNameSpan) {
        const userColorName = getColorName(userColor);
        liveColorNameSpan.textContent = `${userColorName} (${userColor})`;
        liveColorNameSpan.style.color = userColor;
    }

    // Add subtle pulse animation for better feedback
    previewBox.style.transition = 'all 0.15s ease';

    // Show color similarity indicator with visual feedback
    const colorDistance = calculateColorDistance(userColor, targetColor);

    // Add visual hint about how close the user is
    if (colorDistance === 0) {
        // Perfect match - strong green glow
        previewBox.style.boxShadow = '0 0 20px rgba(40, 167, 69, 1)';
        previewBox.style.border = '3px solid #28a745';
    } else if (colorDistance < 30) {
        // Very close - green glow
        previewBox.style.boxShadow = '0 0 15px rgba(40, 167, 69, 0.7)';
        previewBox.style.border = '3px solid rgba(40, 167, 69, 0.5)';
    } else if (colorDistance < 80) {
        // Getting warmer - yellow glow
        previewBox.style.boxShadow = '0 0 10px rgba(255, 193, 7, 0.6)';
        previewBox.style.border = '3px solid rgba(255, 193, 7, 0.4)';
    } else {
        // Cold - no glow
        previewBox.style.boxShadow = 'none';
        previewBox.style.border = '3px solid #999';
    }
});

// Helper function to calculate color distance
function calculateColorDistance(color1, color2) {
    const r1 = parseInt(color1.substring(1, 3), 16);
    const g1 = parseInt(color1.substring(3, 5), 16);
    const b1 = parseInt(color1.substring(5, 7), 16);

    const r2 = parseInt(color2.substring(1, 3), 16);
    const g2 = parseInt(color2.substring(3, 5), 16);
    const b2 = parseInt(color2.substring(5, 7), 16);

    return Math.sqrt(
        Math.pow(r1 - r2, 2) +
        Math.pow(g1 - g2, 2) +
        Math.pow(b1 - b2, 2)
    );
}

// HINT BUTTON
if (hintButton) {
  hintButton.addEventListener('click', () => {
    if (hintPopup) hintPopup.remove();

    hintPopup = document.createElement('div');
    hintPopup.className = 'hint-popup show';
    hintPopup.style.fontFamily = "monospace";
    hintPopup.innerHTML = `TARGET: ${targetColor}<br>ATTEMPTS: ${mistakes}`;

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

// ========================================
// SCREENSHOT FUNCTIONALITY
// ========================================
const screenshotBtn = document.getElementById('screenshot-btn');
if (screenshotBtn) {
  screenshotBtn.addEventListener('click', async () => {
    // Load all errors into the mistake list first
    const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
    const tempDiv = document.createElement('div');
    tempDiv.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 40px;
      border: 3px solid #808080;
      border-radius: 5px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      max-width: 800px;
      max-height: 80vh;
      overflow-y: auto;
      font-family: Arial, sans-serif;
    `;

    const title = document.createElement('h1');
    title.textContent = 'Browser Characteristics - Error Log';
    title.style.cssText = 'margin: 0 0 20px 0; font-size: 24px; color: #000;';
    tempDiv.appendChild(title);

    const subtitle = document.createElement('h2');
    subtitle.textContent = 'All Errors Across All Pages:';
    subtitle.style.cssText = 'margin: 0 0 15px 0; font-size: 18px; color: #333;';
    tempDiv.appendChild(subtitle);

    if (allErrors.length === 0) {
      const noErrors = document.createElement('div');
      noErrors.textContent = 'No errors recorded.';
      noErrors.style.cssText = 'padding: 20px; background: #f0f0f0; border-radius: 3px;';
      tempDiv.appendChild(noErrors);
    } else {
      allErrors.forEach((error) => {
        const errorDiv = document.createElement('div');
        errorDiv.textContent = `[${error.page}] ${error.error}`;
        errorDiv.style.cssText = `
          margin: 8px 0;
          padding: 12px;
          background-color: #f5f5f5;
          border-left: 4px solid #888;
          font-size: 14px;
          line-height: 1.6;
          color: #000;
        `;
        tempDiv.appendChild(errorDiv);
      });
    }

    document.body.appendChild(tempDiv);

    // Wait a bit for rendering
    await new Promise(resolve => setTimeout(resolve, 100));

    // Capture screenshot
    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false
      });

      // Download image
      const link = document.createElement('a');
      link.download = `browser-errors-${new Date().toISOString().slice(0,10)}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Remove temp div
      document.body.removeChild(tempDiv);

      showFeedback('Screenshot saved!', 'warning');
    } catch (error) {
      document.body.removeChild(tempDiv);
      showFeedback('Screenshot failed. Try again.', 'error');
      console.error('Screenshot error:', error);
    }
  });
}

// Start
init();
