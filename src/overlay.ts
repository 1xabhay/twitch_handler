import { createServer, type ServerResponse } from 'node:http';
import { readFile } from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';

// Serves overlay pages for OBS browser sources and pushes messages over SSE.
// Bound to 127.0.0.1 only: nothing here is reachable from outside this machine.
// /lib/<path>.ts serves pure modules from src/ with types stripped, so the browser runs the tested code.
export const startOverlay = (port: number, snapshot: () => unknown) => {
  const clients = new Set<ServerResponse>();
  const event = (msg: unknown) => `data: ${JSON.stringify(msg)}\n\n`;

  createServer(async (req, res) => {
    const url = req.url ?? '';
    if (url === '/events') {
      res.writeHead(200, { 'content-type': 'text/event-stream', 'cache-control': 'no-cache' });
      res.write(event(snapshot())); // full snapshot on (re)connect: OBS unloads hidden sources
      clients.add(res);
      req.on('close', () => clients.delete(res));
      return;
    }
    const page = url.match(/^\/(town|timer)(?:\?.*)?$/)?.[1];
    if (page) {
      res.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
      return res.end(await readFile(`public/${page}.html`));
    }
    const lib = url.match(/^\/lib\/((?:[\w-]+\/)*[\w-]+\.ts)$/)?.[1]; // no dots in dirs: no ../ escapes
    if (lib) {
      const src = await readFile(`src/${lib}`, 'utf8').catch(() => null);
      if (src !== null) {
        res.writeHead(200, { 'content-type': 'text/javascript; charset=utf-8' });
        return res.end(stripTypeScriptTypes(src));
      }
    }
    res.writeHead(404).end();
  }).listen(port, '127.0.0.1');

  return (msg: unknown) => clients.forEach((c) => c.write(event(msg)));
};
