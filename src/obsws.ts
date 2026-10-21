// obs-websocket client (edge, I/O): one connection per batch (OBS may restart between calls). Sends the requests in
// order, resolves their responseData, rejects on the first failure. Requests may be functions of the earlier answers.
// Port and password come from OBS's own config (Tools → WebSocket Server Settings), nothing to copy into .env.
// Never send GetInputPropertiesListPropertyItems for a macOS Audio Capture's application list: it crashes OBS 32.2.
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { obsAuth } from './obs.ts';

export type Req = [string, object] | ((answers: any[]) => [string, object]);
export const obs = (reqs: Req[]) => new Promise<any[]>((ok, fail) => {
  const cfg = JSON.parse(readFileSync(`${homedir()}/Library/Application Support/obs-studio/plugin_config/obs-websocket/config.json`, 'utf8'));
  const ws = new WebSocket(`ws://127.0.0.1:${cfg.server_port}`);
  const answers: any[] = [];
  const send = (op: number, d: object) => ws.send(JSON.stringify({ op, d }));
  const next = () => {
    if (answers.length === reqs.length) return done(() => ok(answers));
    const r = reqs[answers.length];
    const [requestType, requestData] = typeof r === 'function' ? r(answers) : r;
    send(6, { requestType, requestId: String(answers.length), requestData });
  };
  const timer = setTimeout(() => done(() => fail(new Error('no answer in 10 s'))), 10_000);
  const done = (f: () => void) => { clearTimeout(timer); ws.onclose = null; ws.close(); f(); };
  ws.onerror = () => done(() => fail(new Error('remote control is off (Tools → WebSocket Server Settings → Enable)')));
  ws.onclose = (e) => done(() => fail(new Error(`closed the connection (${e.code} ${e.reason})`)));
  ws.onmessage = ({ data }) => {
    const { op, d } = JSON.parse(String(data));
    if (op === 0) send(1, { rpcVersion: 1, ...(d.authentication && { authentication: obsAuth(cfg.server_password, d.authentication.salt, d.authentication.challenge) }) });
    else if (op === 2) next();
    else if (op === 7 && !d.requestStatus.result) done(() => fail(new Error(`${d.requestType}: ${d.requestStatus.comment}`)));
    else if (op === 7) answers.push(d.responseData ?? {}), next();
  };
});
