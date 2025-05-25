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
function formatTime(dateObj) {
    return dateObj.toTimeString().slice(0,5);
  }
  
  
  module.exports = { addDurationToTime, formatTime };