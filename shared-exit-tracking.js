// ========================================
// SHARED EXIT TRACKING FOR ALL PAGES
// ========================================

// Track if user completed the page
window.pageCompleted = false;

// Get page name from current URL
function getPageName() {
  const path = window.location.pathname;
  if (path.includes('url.html')) return 'URL Input';
  if (path.includes('password.html')) return 'Password Input';
  if (path.includes('checkbox.html')) return 'Checkbox';
  if (path.includes('file.html')) return 'File Input';
  if (path.includes('datepicker.html')) return 'Date Picker';
  if (path.includes('colorpicker.html')) return 'Color Picker';
  if (path.includes('captcha.html')) return 'CAPTCHA';
  if (path.includes('range.html')) return 'Range Slider';
  return 'Unknown Page';
}

// Track page exit without completion
window.addEventListener('beforeunload', (e) => {
  if (!window.pageCompleted) {
    const pageName = getPageName();
    const allErrors = JSON.parse(localStorage.getItem('browserErrors') || '[]');

    // Check if we already recorded exit for this page in this session
    const sessionKey = `exitRecorded_${pageName}`;
    const alreadyRecorded = sessionStorage.getItem(sessionKey);

    if (!alreadyRecorded) {
      allErrors.push({
        page: pageName,
        error: `User left ${pageName} page without completing the task`,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem('browserErrors', JSON.stringify(allErrors));
      sessionStorage.setItem(sessionKey, 'true');
    }
  }
});

// Mark page as completed (call this from each page when user succeeds)
window.markPageCompleted = function() {
  window.pageCompleted = true;
};
