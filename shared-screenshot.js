// ========================================
// SHARED SCREENSHOT FUNCTIONALITY
// ========================================
function initScreenshotButton() {
  const screenshotBtn = document.getElementById('screenshot-btn');
  if (!screenshotBtn) return;

  screenshotBtn.addEventListener('click', async () => {
    // Load all errors from localStorage
    const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');

    // Create temporary overlay div
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

    // Add title
    const title = document.createElement('h1');
    title.textContent = 'Browser Characteristics - Error Log';
    title.style.cssText = 'margin: 0 0 20px 0; font-size: 24px; color: #000; font-weight: bold;';
    tempDiv.appendChild(title);

    // Add subtitle
    const subtitle = document.createElement('h2');
    subtitle.textContent = 'All Errors Across All Pages:';
    subtitle.style.cssText = 'margin: 0 0 15px 0; font-size: 18px; color: #333; font-weight: bold;';
    tempDiv.appendChild(subtitle);

    // Add errors or "no errors" message
    if (allErrors.length === 0) {
      const noErrors = document.createElement('div');
      noErrors.textContent = 'No errors recorded.';
      noErrors.style.cssText = 'padding: 20px; background: #f0f0f0; border-radius: 3px; font-size: 14px;';
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

    // Add to document
    document.body.appendChild(tempDiv);

    // Wait for rendering
    await new Promise(resolve => setTimeout(resolve, 150));

    // Capture screenshot using html2canvas
    try {
      const canvas = await html2canvas(tempDiv, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        windowWidth: tempDiv.scrollWidth,
        windowHeight: tempDiv.scrollHeight
      });

      // Create download link
      const link = document.createElement('a');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      link.download = `browser-errors-${timestamp}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Show success feedback if available
      if (typeof showFeedback === 'function') {
        showFeedback('Screenshot saved!', 'warning');
      } else {
        alert('Screenshot saved successfully!');
      }
    } catch (error) {
      // Remove temporary div
      document.body.removeChild(tempDiv);

      // Show error feedback
      if (typeof showFeedback === 'function') {
        showFeedback('Screenshot failed. Try again.', 'error');
      } else {
        alert('Screenshot failed. Please try again.');
      }
      console.error('Screenshot error:', error);
    }
  });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initScreenshotButton);
} else {
  initScreenshotButton();
}
