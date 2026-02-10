// ========================================
// DOM ELEMENTS & STATE
// ========================================
const urlInput = document.getElementById("url");
const button = document.querySelector("button");
const feedback = document.getElementById("feedback");
const mistakeList = document.getElementById("mistake-list");
const hintButton = document.getElementById("hint-button");

let clickCount = 0;
let typingCount = 0;
let mistakes = 0;
let buttonEnabled = false;
let hintPopup = null;
let usedEmptyMessages = [];

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
  oscillator.type = "sawtooth";

  // Volume increases by 0.2 for each mistake (0.2, 0.4, 0.6, 0.8, 1.0)
  const volume = Math.min(0.2 + mistakeCount * 0.2, 1.0);
  gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
  gainNode.gain.exponentialRampToValueAtTime(
    0.01,
    audioContext.currentTime + 0.5,
  );

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
    oscillator.type = "sine";

    const startTime = audioContext.currentTime + index * 0.15;
    gainNode.gain.setValueAtTime(0.3, startTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + 0.4);

    oscillator.start(startTime);
    oscillator.stop(startTime + 0.4);
  });
}

// ========================================
// UI FEEDBACK FUNCTIONS
// ========================================
function showFeedback(message, type = "error") {
  // Show feedback in mistake counter instead of separate box
  const feedbackDiv = document.createElement("div");
  feedbackDiv.textContent = message;
  feedbackDiv.style.color = type === "warning" ? "#666" : "#555";
  feedbackDiv.style.fontStyle = "italic";
  mistakeList.appendChild(feedbackDiv);
}

function addMistake(mistakeText) {
  mistakes++;

  const mistakeDiv = document.createElement("div");
  mistakeDiv.textContent = `${mistakes}: ${mistakeText}`;
  mistakeList.appendChild(mistakeDiv);

  // Store error in localStorage
  const allErrors = JSON.parse(localStorage.getItem("browserErrors") || "[]");
  allErrors.push({
    page: "URL",
    error: mistakeText,
    timestamp: new Date().toISOString(),
  });
  localStorage.setItem("browserErrors", JSON.stringify(allErrors));

  // After 5 mistakes, enable the button
  if (mistakes >= 5) {
    playSuccessSound();
    buttonEnabled = true;
    showFeedback("System ready. Click Next to proceed.", "warning");
    button.style.backgroundColor = "#28a745";
    mistakeList.innerHTML =
      '<div style="color: #2e7d32; font-weight: bold;">You are not a robot. But passed.</div>';
  }
}

// ========================================
// CONTEXTUAL HUMILIATING ERROR MESSAGES
// ========================================
function getHumiliatingMessage(url, errorType) {
  const messages = {
    empty: [],
    missingProtocol: [
      `"${url}" - You forgot the https://. Did you think it was optional?`,
      `"${url}" - You forgot the .com Did you think it was optional?`,
      `Typing "${url}" without https:// is like showing up naked.`,
      `"${url}" needs https:// but you already knew that, right?`,
      `I'm looking at "${url}" and wondering where the https:// went.`,
    ],
    missingWww: [
      `"${url}" is missing www. It's literally THREE characters.`,
      `You typed all of "${url}" but forgot www? Seriously?`,
      `"${url}" - So close yet so far. Add the www already.`,
      `Almost had it with "${url}" but no www. Try again.`,
    ],
    missingDot: [
      `"${url}" has no dot. URLs need dots. Basic stuff.`,
      `Looking at "${url}" - where's the dot? Did it run away?`,
      `"${url}" without a dot is like soup without salt.`,
      `You typed "${url}" and thought dots were optional?`,
    ],
    invalidFormat: [
      `"${url}" is not even close to a valid URL.`,
      `I've seen random keyboard smashes better than "${url}".`,
      `"${url}" - What even is this?`,
      `Did you just make up "${url}" and hope for the best?`,
    ],
    websiteNotExist: [
      `"${url}" doesn't exist. Shocking, I know.`,
      `Typed "${url}" perfectly but it's still wrong. Ouch.`,
      `"${url}" is properly formatted garbage.`,
      `Nice try with "${url}" but that website is imaginary.`,
    ],
  };

  const typeMessages = messages[errorType] || messages.invalidFormat;
  return typeMessages[Math.floor(Math.random() * typeMessages.length)];
}

// ========================================
// URL VALIDATION (SIMPLIFIED - ONE MESSAGE)
// ========================================
function validateURL(url) {
  if (!url) {
    const allEmptyMessages = [
      "It's LeviOsa, not LeviOWWWsa! …Wait, wrong spell—that URL's still invalid.",
      "Did you mean www.whatdidyoutype.com? This doesn't look like a real website.",
      "Our crystal ball sees an almost-URL… but not quite. Add something like google.com.",
      "Nope, not magic enough yet. Try site.com instead of just www.",
      "Domain? More like do-mainly-missing… please include a proper website like example.com.",
      "Abra-cadabra! But seriously, where's the domain, like google.com?",
      "Mischief detected: URL still invalid. Try something like example.com.",
    ];
    const remaining = allEmptyMessages.filter((m) => !usedEmptyMessages.includes(m));
    if (remaining.length === 0) usedEmptyMessages = [];
    const pool = remaining.length > 0 ? remaining : allEmptyMessages;
    const picked = pool[Math.floor(Math.random() * pool.length)];
    usedEmptyMessages.push(picked);
    return {
      valid: false,
      mistake: picked,
    };
  }

  url = url.trim();

  // Priority 1: Check if missing www FIRST (regardless of protocol)
  // Check if url contains www anywhere
  if (!url.includes("www.")) {
    return {
      valid: false,
      mistake: getHumiliatingMessage(url, "missingWww"),
    };
  }

  // Priority 2: Check if missing https:// protocol
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return {
      valid: false,
      mistake: getHumiliatingMessage(url, "missingProtocol"),
    };
  }

  const afterProtocol = url.substring(url.indexOf("://") + 3);

  // Priority 3: Check if domain exists after protocol
  if (!afterProtocol || afterProtocol.length === 0) {
    return {
      valid: false,
      mistake: getHumiliatingMessage(url, "invalidFormat"),
    };
  }

  const domainPart = afterProtocol.split("/")[0];

  // Priority 4: Check if missing dots (no domain structure)
  if (!domainPart.includes(".")) {
    return {
      valid: false,
      mistake: getHumiliatingMessage(url, "missingDot"),
    };
  }

  // Priority 5: Check for invalid characters or other issues
  const invalidChars = ["<", ">", '"', "{", "}", "|", "\\", "^", "`", " "];
  for (let char of invalidChars) {
    if (url.includes(char)) {
      return {
        valid: false,
        mistake: getHumiliatingMessage(url, "invalidFormat"),
      };
    }
  }

  // Check for multiple dots, invalid structure, etc.
  if (
    url.includes("..") ||
    domainPart.endsWith(".") ||
    domainPart.startsWith(".")
  ) {
    return {
      valid: false,
      mistake: getHumiliatingMessage(url, "invalidFormat"),
    };
  }

  return { valid: true, error: null, mistake: null };
}

// ========================================
// VISUAL CHAOS EFFECTS (REMOVED)
// ========================================

// ========================================
// BUTTON CLICK HANDLER
// ========================================
button.addEventListener("click", (e) => {
  if (!buttonEnabled) {
    e.preventDefault();

    // If inline error is showing, don't duplicate in mistake counter
    const inlineErr = document.getElementById("inline-error");
    if (inlineErr) {
      clickCount++;
      return;
    }

    const val = urlInput.value.trim();

    // Treat input as valid if it looks like a real domain or full URL
    const looksValid =
      /^(https?:\/\/)?(www\.)?[a-zA-Z0-9-]+\.[a-zA-Z]{2,}/.test(val);

    if (looksValid) {
      playErrorSound(mistakes);
      addMistake(
        `This website does not exist. Type another URL. ${getHumiliatingMessage(
          val,
          "websiteNotExist",
        )}`,
      );
    } else {
      const validation = validateURL(urlInput.value);

      if (!validation.valid) {
        playErrorSound(mistakes);
        addMistake(validation.mistake);
      } else if (mistakes < 5) {
        playErrorSound(mistakes);
        addMistake(
          `This website does not exist. Type another URL. ${getHumiliatingMessage(
            urlInput.value,
            "websiteNotExist",
          )}`,
        );
      }
    }

    clickCount++;
  } else {
    // Button enabled - redirect to next page
    setTimeout(() => {
      window.markPageCompleted();
      window.location.href = "../PASSWORD%20/password.html";
    }, 100);
  }
});

// ========================================
// INPUT EVENT HANDLERS
// ========================================
urlInput.addEventListener("input", (e) => {
  typingCount++;

  const val = e.target.value.trim();

  // Remove any existing inline error
  const existing = document.getElementById("inline-error");
  if (existing) existing.remove();

  if (!val) return;

  // Check if user typed only "www." with nothing after it
  if (/^(https?:\/\/)?www\.?\s*$/i.test(val)) {
    const err = document.createElement("div");
    err.id = "inline-error";
    err.textContent = "You forgot to include the domain (e.g., google.com).";
    err.style.color = "#d32f2f";
    err.style.fontSize = "14px";
    err.style.marginTop = "6px";
    urlInput.parentNode.insertBefore(err, urlInput.nextSibling);
  }
});

// ========================================
// OTHER EFFECTS (CHAOS REMOVED)
// ========================================

// ========================================
// HINT BUTTON
// ========================================
hintButton.addEventListener("click", (e) => {
  e.preventDefault();

  if (hintPopup) {
    hintPopup.remove();
  }

  hintPopup = document.createElement("div");
  hintPopup.className = "hint-popup show";
  hintPopup.textContent = "Click 5 times to proceed";

  document.querySelector(".item-content").appendChild(hintPopup);

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
window.addEventListener("beforeprint", () => {
  const allErrors = JSON.parse(localStorage.getItem("browserErrors") || "[]");
  mistakeList.innerHTML = "";

  if (allErrors.length === 0) {
    mistakeList.innerHTML = "<div>No errors recorded.</div>";
  } else {
    allErrors.forEach((error, index) => {
      const errorDiv = document.createElement("div");
      errorDiv.textContent = `[${error.page}] Error #${index + 1}: ${
        error.error
      }`;
      mistakeList.appendChild(errorDiv);
    });
  }
});
