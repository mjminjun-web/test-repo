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
      canvas.height,
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
        2,
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

// Print functionality — full session summary
const PAGE_ORDER = ['URL', 'PASSWORD INPUT', 'CHECKBOX', 'RANGE SLIDER', 'COLOR PICKER', 'DATEPICKER', 'FILE', 'CAPTCHA'];

function buildPrintReport() {
  const allErrors   = JSON.parse(localStorage.getItem('browserErrors')  || '[]');
  const allActivity = JSON.parse(localStorage.getItem('browserActivity') || '[]');

  // Group by page
  const pages = {};
  PAGE_ORDER.forEach(p => { pages[p] = { inputs: [], responses: [], errors: [] }; });

  allActivity.forEach(item => {
    const key = item.page.toUpperCase();
    if (!pages[key]) pages[key] = { inputs: [], responses: [], errors: [] };
    if (item.type === 'input')    pages[key].inputs.push(item.value);
    if (item.type === 'response') pages[key].responses.push(item.value);
  });

  let errorIdx = 0;
  allErrors.forEach(err => {
    const key = err.page.toUpperCase();
    if (!pages[key]) pages[key] = { inputs: [], responses: [], errors: [] };
    errorIdx++;
    pages[key].errors.push(`#${errorIdx} ${err.error}`);
  });

  return pages;
}

function renderPrintReport(container) {
  container.innerHTML = '';
  const pages = buildPrintReport();
  const ts = new Date().toLocaleString();

  // Header
  const header = document.createElement('div');
  header.style.cssText = 'margin-bottom:24px; padding-bottom:12px; border-bottom:3px solid #333;';
  header.innerHTML = `<h2 style="margin:0 0 4px 0; font-size:20px; color:#111;">Browser Characteristics — Session Summary</h2><p style="margin:0; color:#555; font-size:13px;">Printed: ${ts}</p>`;
  container.appendChild(header);

  const allKeys = Object.keys(pages);
  allKeys.forEach(pageName => {
    const data = pages[pageName];
    if (!data.inputs.length && !data.responses.length && !data.errors.length) return;

    const section = document.createElement('div');
    section.style.cssText = 'margin-bottom:20px; padding:14px; border:1px solid #ccc; background:#fafafa; page-break-inside:avoid;';

    const title = document.createElement('h3');
    title.textContent = pageName;
    title.style.cssText = 'margin:0 0 10px 0; font-size:15px; color:#222; border-bottom:1px solid #ddd; padding-bottom:6px;';
    section.appendChild(title);

    function addBlock(label, items, borderColor) {
      if (!items.length) return;
      const block = document.createElement('div');
      block.style.cssText = 'margin-bottom:8px;';
      const lbl = document.createElement('div');
      lbl.textContent = label;
      lbl.style.cssText = 'font-size:11px; font-weight:bold; color:#555; text-transform:uppercase; margin-bottom:4px;';
      block.appendChild(lbl);
      items.forEach(item => {
        const row = document.createElement('div');
        row.textContent = item;
        row.style.cssText = `padding:6px 10px; margin:3px 0; background:#fff; border-left:3px solid ${borderColor}; font-size:13px; color:#333; line-height:1.5;`;
        block.appendChild(row);
      });
      section.appendChild(block);
    }

    addBlock('User Input', data.inputs, '#0066cc');
    addBlock('System Responses', data.responses, '#888');
    addBlock('Errors / Validation', data.errors, '#c00');

    container.appendChild(section);
  });

  const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');
  const allActivity = JSON.parse(localStorage.getItem('browserActivity') || '[]');
  if (!allErrors.length && !allActivity.length) {
    const empty = document.createElement('p');
    empty.textContent = 'No session data recorded yet. Complete the input pages first.';
    empty.style.color = '#888';
    container.appendChild(empty);
  }
}

let printContainer = null;

window.addEventListener('beforeprint', () => {
  const gridItem = document.querySelector('.grid-item:last-child .item-content');
  if (!gridItem) return;

  const printBtn = gridItem.querySelector('.print-button');
  if (printBtn) printBtn.style.display = 'none';

  printContainer = document.createElement('div');
  printContainer.className = 'error-log-container';
  printContainer.style.cssText = 'display:block; margin-top:12px;';
  renderPrintReport(printContainer);
  gridItem.appendChild(printContainer);
});

window.addEventListener('afterprint', () => {
  if (printContainer) { printContainer.remove(); printContainer = null; }
  const printBtn = document.querySelector('.grid-item:last-child .item-content .print-button');
  if (printBtn) printBtn.style.display = '';
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
