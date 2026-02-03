// ========================================
// DOM ELEMENTS & STATE
// ========================================
const checkboxes = document.querySelectorAll('input[type="checkbox"]');
const button = document.querySelector('button:not(.hint-button)');
const feedback = document.getElementById('feedback');
const mistakeList = document.querySelector('.mistake-list');
const hintButton = document.getElementById('hint-button');

let clickCount = 0;
let mistakes = 0;
let buttonEnabled = false;
let hintPopup = null;
let checkboxInteractionCount = 0;
let liveErrorElement = null;

// ========================================
// AUDIO FUNCTIONS
// ========================================
function playErrorSound(mistakeCount) {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = 200;
  oscillator.type = 'sawtooth';

  // Volume increases by 0.2 for each mistake (0.2, 0.4, 0.6, 0.8, 1.0)
  const volume = Math.min(0.2 + (mistakeCount * 0.2), 1.0);
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

  oscillator.start(audioContext.currentTime);
  oscillator.stop(audioContext.currentTime + 0.5);
}

function playSuccessSound() {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)();
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

// ========================================
// UI FEEDBACK FUNCTIONS
// ========================================
function showFeedback(message, type = 'error') {
  // Show feedback in mistake counter instead of separate box
  const feedbackDiv = document.createElement('div');
  feedbackDiv.textContent = message;
  feedbackDiv.style.color = type === 'warning' ? '#666' : '#555';
  feedbackDiv.style.fontStyle = 'italic';
  mistakeList.appendChild(feedbackDiv);
}

// Live error messages that update as user checks/unchecks
function updateLiveError() {
  if (buttonEnabled) return;

  const checkedCount = Array.from(checkboxes).filter(cb => cb.checked).length;

  // Remove existing live error
  if (liveErrorElement) {
    liveErrorElement.remove();
    liveErrorElement = null;
  }

  let liveMessage = '';

  if (checkedCount === 0) {
    liveMessage = 'Come on, you can choose at least one...';
  } else if (checkedCount === 1) {
    liveMessage = 'That\'s all you got??';
  } else if (checkedCount === 2) {
    liveMessage = 'Two? Come on, you can do better than that!';
  } else if (checkedCount === 3) {
    liveMessage = 'Three toppings? Is that your final answer?';
  } else if (checkedCount >= 4) {
    liveMessage = 'Wow, going all out now? Interesting choice...';
  }

  if (liveMessage) {
    liveErrorElement = document.createElement('div');
    liveErrorElement.textContent = `💬 ${liveMessage}`;
    liveErrorElement.style.color = '#777';
    liveErrorElement.style.fontStyle = 'italic';
    liveErrorElement.style.fontSize = '14px';
    liveErrorElement.style.marginTop = '8px';
    liveErrorElement.id = 'live-checkbox-error';
    mistakeList.appendChild(liveErrorElement);
  }
}

function updateTryIfYouCanBold(isChecked) {
  const tryText = document.getElementById('try-text');
  if (tryText) {
    const anyChecked = Array.from(checkboxes).some(cb => cb.checked);
    if (anyChecked) {
      tryText.style.display = 'inline';
      // Ensure it starts at 12px if not already set (check both inline style and computed)
      if (!tryText.style.fontSize || tryText.style.fontSize === '') {
        const computedSize = parseInt(window.getComputedStyle(tryText).fontSize);
        if (!computedSize || computedSize === 12) {
          tryText.style.fontSize = '12px';
        }
      }
      tryText.style.fontWeight = 'bold';
      // Increase size only when a checkbox is checked (not when unchecked)
      if (isChecked === true) {
        increaseTryIfYouCanSize();
      }
    } else {
      tryText.style.fontWeight = 'normal';
    }
  }
}

function showTryIfYouCan() {
  const tryText = document.getElementById('try-text');
  if (tryText) {
    tryText.style.display = 'inline';
    tryText.style.fontSize = '12px';
    tryText.style.fontWeight = 'bold';
  }
}

function increaseTryIfYouCanSize() {
  const tryText = document.getElementById('try-text');
  if (tryText) {
    // Read from inline style first, then computed style, then default to 12px
    let currentSize = parseInt(tryText.style.fontSize);
    if (!currentSize || isNaN(currentSize)) {
      currentSize = parseInt(window.getComputedStyle(tryText).fontSize) || 12;
    }
    const newSize = currentSize + 5;
    tryText.style.fontSize = newSize + 'px';
  }
}

function addMistake(mistakeText) {
  mistakes++;

  const mistakeDiv = document.createElement('div');
  mistakeDiv.textContent = `Error #${mistakes}: ${mistakeText}`;
  mistakeList.appendChild(mistakeDiv);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  allErrors.push({
    page: 'CHECKBOX',
    error: mistakeText,
    timestamp: new Date().toISOString()
  });
  localStorage.setItem('browserErrors', JSON.stringify(allErrors));

  // After 5 mistakes, enable the button
  if (mistakes >= 5) {
    playSuccessSound();
    buttonEnabled = true;
    showFeedback('System ready. Click Next to proceed.', 'warning');
    button.style.backgroundColor = '#28a745';
    mistakeList.innerHTML = '<div style="color: #2e7d32; font-weight: bold;">Your Weird!! <br>Thats why we moved you on.</div>';
  }
}

// ========================================
// BUTTON CLICK HANDLER
// ========================================
button.addEventListener('click', (e) => {
  showTryIfYouCan(); // Show "try if you can" when Next button is clicked
  increaseTryIfYouCanSize(); // Increase size when Next button is clicked
  
  if (!buttonEnabled) {
    e.preventDefault();

    // Get selected toppings
    const selectedToppings = Array.from(checkboxes)
      .filter(cb => cb.checked)
      .map(cb => {
        const label = cb.nextElementSibling;
        return label && label.tagName === 'LABEL' ? label.textContent.trim() : '';
      })
      .filter(text => text !== '');

    // Create discriminating error messages based on selections
    let errorMessage = '';
    
    if (selectedToppings.length === 0) {
      errorMessage = 'You selected nothing. Are you even trying?';
    } else if (selectedToppings.length === 1) {
      errorMessage = `Really? Just "${selectedToppings[0]}"? That's not a pizza, that's a crime.`;
    } else if (selectedToppings.length === 2) {
      errorMessage = `"${selectedToppings[0]}" and "${selectedToppings[1]}"? What kind of combination is that?`;
    } else if (selectedToppings.length === 3) {
      errorMessage = `"${selectedToppings[0]}", "${selectedToppings[1]}", and "${selectedToppings[2]}"? This is getting weird.`;
    } else if (selectedToppings.length === 4) {
      errorMessage = `You chose ${selectedToppings.join(', ')}. Too many choices, not enough taste.`;
    } else if (selectedToppings.length === 5) {
      errorMessage = `"${selectedToppings.slice(0, 3).join('", "')}"... and ${selectedToppings.length - 3} more? This is chaos.`;
    } else {
      errorMessage = `You selected ${selectedToppings.length} toppings: ${selectedToppings.slice(0, 3).join(', ')}... This is way too much.`;
    }

    // Add specific judgments based on combinations
    const hasLentils = selectedToppings.includes('Lentils');
    const hasKimchi = selectedToppings.includes('Kimchi');
    const hasWatermelon = selectedToppings.includes('Watermelon');
    const hasBeer = selectedToppings.includes('Beer');
    const hasMint = selectedToppings.includes('Mint');
    const hasChicken = selectedToppings.includes('Chicken');
    const hasOrange = selectedToppings.includes('Orange');
    const hasOliveOil = selectedToppings.includes('Olive Oil');

    let judgmentMessage = '';
    if (hasLentils && hasWatermelon) {
      judgmentMessage = ' Lentils and Watermelon? Are you making a smoothie or a pizza?';
    } else if (hasKimchi && hasBeer) {
      judgmentMessage = ' Kimchi and Beer? At least you have taste in drinks.';
    } else if (hasMint && hasChicken) {
      judgmentMessage = ' Mint and Chicken? Interesting... but wrong.';
    } else if (hasOrange && hasOliveOil) {
      judgmentMessage = ' Orange and Olive Oil? This is a salad, not a pizza.';
    } else if (hasBeer && hasWatermelon) {
      judgmentMessage = ' Beer and Watermelon? Summer vibes, but pizza? No.';
    } else if (hasLentils && hasKimchi) {
      judgmentMessage = ' Lentils and Kimchi? Trying to be healthy? Wrong place.';
    } else if (selectedToppings.length > 4) {
      judgmentMessage = ' You have too many toppings. Pick a lane.';
    } else if (hasLentils) {
      judgmentMessage = ' Lentils on pizza? Really?';
    } else if (hasWatermelon) {
      judgmentMessage = ' Watermelon? On pizza? That\'s a fruit, not a topping.';
    } else if (hasBeer) {
      judgmentMessage = ' Beer is a drink, not a pizza topping.';
    } else if (hasMint) {
      judgmentMessage = ' Mint? Are you making toothpaste pizza?';
    }

    const fullMessage = errorMessage + judgmentMessage;

    playErrorSound(mistakes);
    addMistake(fullMessage);

    if (clickCount === 2) {
      button.style.transform = 'translate(0, 0)';
    }

    clickCount++;
  } else {
    // Button enabled - redirect to next page
    showFeedback('Success! Redirecting...', 'warning');
    setTimeout(() => {
      window.markPageCompleted();
      window.location.href = '../RANGE/range.html';
    }, 100);
  }
});

// ========================================
// BUTTON HOVER EFFECTS
// ========================================
button.addEventListener('mouseenter', () => {
  if (clickCount < 3 && !buttonEnabled) {
    const randomX = Math.random() * 20 - 10;
    const randomY = Math.random() * 20 - 10;
    button.style.transform = `translate(${randomX}px, ${randomY}px)`;
    button.style.transition = 'transform 0.3s';
  }
});

button.addEventListener('mouseleave', () => {
  if (!buttonEnabled) {
    button.style.transform = 'translate(0, 0)';
  }
});

// ========================================
// CHECKBOX CHAOS EFFECTS
// ========================================

// Continuously move checkboxes around (delayed start)
setTimeout(() => {
  setInterval(() => {
    if (!buttonEnabled) {
      checkboxes.forEach(checkbox => {
        const parent = checkbox.closest('.checkbox-item');
        if (parent) {
          const randomX = Math.random() * 160 - 80;
          const randomY = Math.random() * 100 - 50;
          parent.style.transition = 'transform 0.3s ease';
          parent.style.transform = `translate(${randomX}px, ${randomY}px)`;
        }
      });
    }
  }, 400);
}, 2000); // Start moving after 2 seconds

// Checkboxes randomly uncheck themselves
checkboxes.forEach(checkbox => {
  checkbox.addEventListener('change', () => {
    checkboxInteractionCount++;
    const isNowChecked = checkbox.checked; // true if just checked, false if just unchecked
    updateTryIfYouCanBold(isNowChecked);

    // Update live error message
    updateLiveError();
  });
});


// All checkboxes temporarily disabled
setInterval(() => {
  if (mistakes >= 1 && mistakes < 5 && !buttonEnabled && Math.random() < 0.02) {
    checkboxes.forEach(cb => cb.disabled = true);
    showFeedback('⚠️ Checkboxes frozen. System needs to thaw.', 'warning');

    setTimeout(() => {
      checkboxes.forEach(cb => cb.disabled = false);
    }, 2000);
  }
}, 5000);

// Checkbox size changes randomly
setInterval(() => {
  if (mistakes >= 1 && mistakes < 5 && !buttonEnabled && Math.random() < 0.04) {
    checkboxes.forEach(checkbox => {
      const sizes = ['10px', '20px', '14px', '18px', '12px'];
      const randomSize = sizes[Math.floor(Math.random() * sizes.length)];
      checkbox.style.width = randomSize;
      checkbox.style.height = randomSize;
    });
    showFeedback('⚠️ Checkbox size unstable. Visual glitch detected.', 'warning');

    setTimeout(() => {
      checkboxes.forEach(checkbox => {
        checkbox.style.width = '16px';
        checkbox.style.height = '16px';
      });
    }, 2500);
  }
}, 6000);

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
