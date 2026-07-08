const fs = require('fs');
const path = require('path');

const soundsDir = path.join(__dirname, 'public', 'sounds');
if (!fs.existsSync(soundsDir)) {
  fs.mkdirSync(soundsDir, { recursive: true });
}

// A minimal silent MP3 base64
const base64Mp3 = 'SUQzBAAAAAAAI1RTU0UAAAAPAAADTGFtZTMuOTguNAAAAAAAAAAAAAAA//uQAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAATGltZQAAAAAAAAAAAAAA';
const buffer = Buffer.from(base64Mp3, 'base64');

fs.writeFileSync(path.join(soundsDir, 'notification.mp3'), buffer);
console.log('notification.mp3 generated successfully');
