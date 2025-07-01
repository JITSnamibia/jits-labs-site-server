// Minimal WebSocket signaling server for P2P file sharing
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: 3001 });

// Map: sessionId -> [ws, ws]
const sessions = {};

wss.on('connection', ws => {
  let sessionId = null;
  ws.on('message', msg => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'join') {
        sessionId = data.sessionId;
        if (!sessions[sessionId]) sessions[sessionId] = [];
        sessions[sessionId].push(ws);
        if (sessions[sessionId].length === 2) {
          sessions[sessionId].forEach(s => s.send(JSON.stringify({ type: 'ready' })));
        }
      } else if (data.type === 'signal' && sessionId && sessions[sessionId]) {
        // Relay signal to the other peer
        sessions[sessionId].forEach(s => {
          if (s !== ws) s.send(JSON.stringify({ type: 'signal', data: data.data }));
        });
      }
    } catch {}
  });
  ws.on('close', () => {
    if (sessionId && sessions[sessionId]) {
      sessions[sessionId] = sessions[sessionId].filter(s => s !== ws);
      if (sessions[sessionId].length === 0) delete sessions[sessionId];
    }
  });
});

console.log('Signaling server running on ws://localhost:3001');
