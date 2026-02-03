// Word list for captcha
const words = [
  "apple",
  "banana",
  "orange",
  "grape",
  "melon",
  "tiger",
  "eagle",
  "dolphin",
  "rabbit",
  "penguin",
  "river",
  "mountain",
  "forest",
  "ocean",
  "desert",
  "happy",
  "bright",
  "swift",
  "clever",
  "brave",
  "puzzle",
  "garden",
  "summer",
  "winter",
  "spring",
];

let captchaWord = "";

// Humorous error messages
const funnyErrors = [
  "Beep boop? Nice try, robot!",
  "Even my grandma types better than that!",
  "Plot twist: You're the captcha now.",
  "Error 404: Typing skills not found.",
  "Are you sure you're not a toaster?",
  "My pet goldfish got that one right...",
  "That's not it, chief.",
  "Wrong! But hey, at least you tried.",
  "Captcha says: 'Bruh.'",
  "Your keyboard called. It's disappointed.",
  "Were you typing with your elbows?",
  "Close! Just kidding, not even close.",
  "The word was RIGHT THERE!",
  "Did you sneeze on the keyboard?",
  "Autocorrect can't save you here!",
];

// Humorous success messages
const funnySuccess = [
  "You're officially not a robot. Congrats!",
  "Human verified! (Probably)",
  "Nice! You can read squiggly text!",
  "Welcome, fellow human!",
  "Captcha defeated! +10 XP",
  "You passed! Your eyes work!",
  "Humanity confirmed. Proceed, mortal.",
];

function generate() {
  // Pick a random word from the list
  captchaWord = words[Math.floor(Math.random() * words.length)];

  // Display the word in the captcha image div
  const imageDiv = document.getElementById("image");
  if (imageDiv) {
    imageDiv.innerHTML = captchaWord;

    // Add some styling to make it harder for bots (distortion effect)
    imageDiv.style.fontFamily = "monospace";
    imageDiv.style.fontSize = "24px";
    imageDiv.style.letterSpacing = "3px";
    imageDiv.style.fontStyle = "italic";
    imageDiv.style.textDecoration = "line-through";
    imageDiv.style.color = "#333";
    imageDiv.style.background = "linear-gradient(45deg, #f0f0f0, #e0e0e0)";
    imageDiv.style.padding = "10px 15px";
    imageDiv.style.userSelect = "none";

    // Clear the input field
    document.getElementById("submit").value = "";
    document.getElementById("key").innerHTML = "";
  }

  // Generate canvas captcha for home page preview
  const canvas = document.getElementById("captcha-canvas");
  if (canvas) {
    const ctx = canvas.getContext("2d");
    const previewWord =
      words[Math.floor(Math.random() * words.length)].toUpperCase();

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Background with gradient
    const gradient = ctx.createLinearGradient(
      0,
      0,
      canvas.width,
      canvas.height
    );
    gradient.addColorStop(0, "#f5f5f5");
    gradient.addColorStop(1, "#e8e8e8");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add noise lines
    for (let i = 0; i < 5; i++) {
      ctx.strokeStyle = `rgba(${Math.random() * 150}, ${Math.random() * 150}, ${
        Math.random() * 150
      }, 0.3)`;
      ctx.beginPath();
      ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height);
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Draw distorted text
    ctx.font = "bold 32px Arial";
    ctx.textBaseline = "middle";

    for (let i = 0; i < previewWord.length; i++) {
      ctx.save();
      const x = 25 + i * 28;
      const y = 30 + (Math.random() - 0.5) * 10;
      const rotation = (Math.random() - 0.5) * 0.4;

      ctx.translate(x, y);
      ctx.rotate(rotation);

      // Random color for each letter
      const colors = ["#333", "#555", "#444", "#666"];
      ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
      ctx.fillText(previewWord[i], 0, 0);

      ctx.restore();
    }

    // Add noise dots
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = `rgba(0, 0, 0, ${Math.random() * 0.3})`;
      ctx.fillRect(
        Math.random() * canvas.width,
        Math.random() * canvas.height,
        2,
        2
      );
    }
  }
}

function printmsg() {
  const userInput = document.getElementById("submit").value;
  const keyElement = document.getElementById("key");

  if (userInput.toLowerCase() === captchaWord.toLowerCase()) {
    // Pick a random success message
    const successMsg =
      funnySuccess[Math.floor(Math.random() * funnySuccess.length)];
    keyElement.innerHTML = successMsg;
    keyElement.style.color = "green";
  } else {
    // Pick a random funny error message
    const errorMsg =
      funnyErrors[Math.floor(Math.random() * funnyErrors.length)];
    keyElement.innerHTML = errorMsg;
    keyElement.style.color = "red";
    generate(); // Generate new captcha on failure
  }
}

// Function to clear all errors from localStorage
function clearAllErrors() {
  localStorage.removeItem("browserErrors");
  sessionStorage.clear();
  alert("All error logs have been cleared. You can start fresh!");

  // Optionally reload the page to reset everything
  window.location.reload();
}

// Print functionality - populate error log before printing
window.addEventListener("beforeprint", () => {
  const allErrors = JSON.parse(localStorage.getItem("browserErrors") || "[]");
  const printButtonGridItem = document.querySelector(".grid-item:last-child");

  console.log("Print triggered, errors found:", allErrors.length);

  if (printButtonGridItem) {
    const itemContent = printButtonGridItem.querySelector(".item-content");
    if (itemContent) {
      // Hide the print button
      const printButton = itemContent.querySelector(".print-button");
      if (printButton) printButton.style.display = "none";

      // Remove existing error log container if any
      const existingContainer = itemContent.querySelector(
        ".error-log-container"
      );
      if (existingContainer) existingContainer.remove();

      // Create error log container
      const errorLogContainer = document.createElement("div");
      errorLogContainer.className = "error-log-container";
      errorLogContainer.style.cssText =
        "visibility: visible !important; display: block !important; margin-top: 20px; width: 100%;";
      itemContent.appendChild(errorLogContainer);

      if (allErrors.length === 0) {
        const noErrorDiv = document.createElement("div");
        noErrorDiv.style.cssText =
          "padding: 20px; color: #666; visibility: visible !important; display: block !important;";
        noErrorDiv.textContent = "No errors recorded.";
        errorLogContainer.appendChild(noErrorDiv);
      } else {
        allErrors.forEach((error, index) => {
          const errorDiv = document.createElement("div");
          errorDiv.style.cssText =
            "margin: 8px 0; padding: 12px; background-color: #f5f5f5; border-left: 4px solid #c00; font-size: 14px; line-height: 1.6; color: #000; visibility: visible !important; display: block !important;";
          errorDiv.textContent = `[${error.page}] Error #${index + 1}: ${
            error.error
          }`;
          errorLogContainer.appendChild(errorDiv);
        });
      }
    }
  }
});

// Restore content after printing
window.addEventListener("afterprint", () => {
  const printButtonGridItem = document.querySelector(".grid-item:last-child");
  if (printButtonGridItem) {
    const itemContent = printButtonGridItem.querySelector(".item-content");
    if (itemContent) {
      // Remove error log container
      const errorLogContainer = itemContent.querySelector(
        ".error-log-container"
      );
      if (errorLogContainer) errorLogContainer.remove();

      // Restore print button
      const printButton = itemContent.querySelector(".print-button");
      if (printButton) printButton.style.display = "";
    }
  }
});

// About Modal Functions
function showAboutPopup() {
  const modal = document.getElementById("aboutModal");
  if (modal) {
    modal.style.display = "block";
  }
}

function closeAboutPopup() {
  const modal = document.getElementById("aboutModal");
  if (modal) {
    modal.style.display = "none";
  }
}

// Close modal when clicking outside of it
window.addEventListener("click", (event) => {
  const modal = document.getElementById("aboutModal");
  if (event.target === modal) {
    closeAboutPopup();
  }
});

// Close modal with Escape key
window.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeAboutPopup();
  }
});
