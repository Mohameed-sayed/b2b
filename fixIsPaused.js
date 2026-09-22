const fs = require('fs');
let content = fs.readFileSync('server/src/socketHandler.js', 'utf8');

content = content.replace(/status: 'lobby',\s*isPaused: false,/g, "status: 'lobby',\n          isPaused: !!room.isPaused,");
content = content.replace(/status: updatedRoom\.state\.toLowerCase\(\),\s*isPaused: false,/g, "status: updatedRoom.state.toLowerCase(),\n          isPaused: !!updatedRoom.isPaused,");
content = content.replace(/status: room\.state\.toLowerCase\(\),\s*isPaused: false,/g, "status: room.state.toLowerCase(),\n          isPaused: !!room.isPaused,");

fs.writeFileSync('server/src/socketHandler.js', content, 'utf8');
