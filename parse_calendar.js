const fs = require('fs');

const calendarText = fs.readFileSync('calendar.txt', 'utf8');

const lines = calendarText.split('\n');

const events = [];

const monthMap = {
  'Jan': 'January',
  'Feb': 'February',
  'Mar': 'March',
  'Apr': 'April',
  'May': 'May',
  'Jun': 'June',
  'Jul': 'July',
  'Aug': 'August',
  'Sep': 'September',
  'Oct': 'October',
  'Nov': 'November',
  'Dec': 'December'
};

lines.forEach(line => {
  const match = line.match(/^(\w{3}) (\d{1,2})\s*\(([A-Z][a-z]{2})\)\s*-\s*(.+)$/);
  if (match) {
    const monthAbbr = match[1];
    const day = parseInt(match[2]);
    const dayOfWeek = match[3];
    const title = match[4].trim();
    const fullMonth = monthMap[monthAbbr];
    const date = `${fullMonth} ${day}, 2026 (${dayOfWeek})`;
    events.push({
      title: title,
      date: date,
      description: "",
      location: "Foundation of Truth Assembly"
    });
  }
});

console.log(JSON.stringify(events, null, 2));