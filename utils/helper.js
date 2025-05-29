function addDurationToTime(startTime, durationMinutes) {
    const [hours, minutes] = startTime.split(':').map(Number);
    const date = new Date();
    date.setHours(hours);
    date.setMinutes(minutes + durationMinutes);
    const newHours = date.getHours().toString().padStart(2, '0');
    const newMinutes = date.getMinutes().toString().padStart(2, '0');
    return `${newHours}:${newMinutes}`;
  }

// Helper to format time string "HH:MM"
function formatTime(time) {
    if (typeof time === 'string') {
      return time.slice(0,5);
    }
    return time.toTimeString().slice(0,5);
  }

// Utility to generate a unique invoice number
function generateInvoiceNumber() {
    const now = new Date();
    const yy = String(now.getFullYear()).slice(-2);
    const mm = String(now.getMonth()+1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const hh = String(now.getHours()).padStart(2, '0');
    const mi = String(now.getMinutes()).padStart(2, '0');
    const ss = String(now.getSeconds()).padStart(2, '0');
    return `INV-${yy}${mm}${dd}-${hh}${mi}${ss}-${Math.floor(Math.random()*1000)}`;
  }
  
  module.exports = { addDurationToTime, formatTime, generateInvoiceNumber };