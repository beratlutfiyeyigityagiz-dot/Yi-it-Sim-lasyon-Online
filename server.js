const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const PORT = process.env.PORT || 3000;
const ROOT = path.join(__dirname, 'public');
const rooms = new Map();
const server = http.createServer((req, res) => {
  let pathname = decodeURIComponent((req.url || '/').split('?')[0]);
  if (pathname === '/') pathname = '/index.html';
  const file = path.join(ROOT, pathname.replace(/^\/+/, ''));
  if (!file.startsWith(ROOT)) { res.writeHead(403); return res.end('Forbidden'); }
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(file);
    res.writeHead(200, { 'Content-Type': ext === '.html' ? 'text/html; charset=utf-8' : 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(data);
  });
});
const wss = new WebSocketServer({ noServer: true, maxPayload: 16 * 1024 });
server.on('upgrade', (req, socket, head) => {
  if (req.url !== '/ws') { socket.destroy(); return; }
  wss.handleUpgrade(req, socket, head, ws => wss.emit('connection', ws, req));
});
function send(ws, obj) { if (ws.readyState === 1) ws.send(JSON.stringify(obj)); }
function code6() { let c; do { c = String(100000 + Math.floor(Math.random() * 900000)); } while (rooms.has(c)); return c; }
function broadcast(room, obj, except) { for (const p of room.players.values()) if (p.ws !== except) send(p.ws, obj); }
function leave(ws) {
  const code = ws.roomCode; if (!code) return;
  const room = rooms.get(code); ws.roomCode = null; if (!room) return;
  room.players.delete(ws.playerId);
  if (room.hostId === ws.playerId) {
    for (const p of room.players.values()) send(p.ws, { type: 'room-closed' });
    rooms.delete(code); return;
  }
  broadcast(room, { type: 'player-left', playerId: ws.playerId, count: room.players.size });
  if (!room.players.size) rooms.delete(code);
}
wss.on('connection', ws => {
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw.toString()); } catch { return send(ws, { type: 'error', message: 'Geçersiz veri.' }); }
    if (m.type === 'create') {
      if (ws.roomCode) leave(ws);
      const code = code6(), id = Math.random().toString(36).slice(2, 10);
      const room = { hostId: id, players: new Map() };
      room.players.set(id, { id, ws, state: null }); rooms.set(code, room);
      ws.roomCode = code; ws.playerId = id; send(ws, { type: 'created', code, playerId: id, count: 1 });
    } else if (m.type === 'join') {
      if (ws.roomCode) leave(ws);
      const room = rooms.get(String(m.code || ''));
      if (!room) return send(ws, { type: 'error', message: 'Bu oda bulunamadı. Oda sahibi çevrim içi mi?' });
      if (room.players.size >= 4) return send(ws, { type: 'full' });
      const id = Math.random().toString(36).slice(2, 10);
      const snapshots = [...room.players.values()].map(p => p.state && ({ id: p.id, ...p.state })).filter(Boolean);
      room.players.set(id, { id, ws, state: null }); ws.roomCode = String(m.code); ws.playerId = id;
      send(ws, { type: 'joined', code: ws.roomCode, playerId: id, count: room.players.size, players: snapshots });
      broadcast(room, { type: 'player-joined', player: { id }, count: room.players.size }, ws);
    } else if (m.type === 'state') {
      const room = rooms.get(ws.roomCode); if (!room || !room.players.has(ws.playerId)) return;
      const state = { x: Number(m.x), y: Number(m.y) || 0, z: Number(m.z), yaw: Number(m.yaw) || 0, color: Number(m.color) || 0x20a9d6 };
      if (![state.x, state.y, state.z, state.yaw].every(Number.isFinite)) return;
      room.players.get(ws.playerId).state = state;
      broadcast(room, { type: 'state', playerId: ws.playerId, ...state }, ws);
    } else if (m.type === 'leave') leave(ws);
  });
  ws.on('close', () => leave(ws));
  ws.on('error', () => leave(ws));
});
server.listen(PORT, '0.0.0.0', () => console.log(`Yigit Simulasyon online server listening on ${PORT}`));
