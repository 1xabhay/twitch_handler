import { createServer, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';

// Serves overlay pages for OBS browser sources and pushes state over SSE.
// Bound to 127.0.0.1 only: nothing here is reachable from outside this machine.
export const startOverlay = (port: number, snapshot: () => unknown) => {
  const clients = new Set<ServerResponse>();
  const event = (state: unknown) => `data: ${JSON.stringify(state)}\n\n`;

  createServer(async (req, res) => {
    if (req.url === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      res.write(event(snapshot())); // full snapshot on (re)connect: OBS unloads hidden sources
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    if (req.url === '/town') {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(await readFile('public/town.html'));
    }
    res.writeHead(404).end();
  }).listen(port, '127.0.0.1');

  return (state: unknown) => clients.forEach((c) => c.write(event(state)));
};
