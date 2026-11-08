// Read-only development preflight. Never launches the app or changes its data.
const http = require('node:http');

function request(url, { bundle = false, timeout = 15_000 } = {}) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    let bytes = 0;
    let body = '';
    const req = http.get(url, {
      headers: { Accept: bundle ? 'application/javascript' : '*/*' },
    });
    const timer = setTimeout(() => {
      req.destroy(new Error(`Request exceeded ${timeout / 1000}s: ${url}`));
    }, timeout);
    req.on('error', (error) => {
      clearTimeout(timer);
      reject(error);
    });
    req.on('response', (res) => {
      res.on('data', (chunk) => {
        bytes += chunk.length;
        if (!bundle && bytes <= 64 * 1024) body += chunk.toString();
      });
      res.on('error', (error) => {
        clearTimeout(timer);
        reject(error);
      });
      res.on('end', () => {
        clearTimeout(timer);
        if (res.statusCode !== 200) {
          reject(new Error(`HTTP ${res.statusCode}: ${url}`));
          return;
        }
        if (bundle && !/javascript/.test(res.headers['content-type'] ?? '')) {
          reject(new Error('Bundle endpoint did not return JavaScript'));
          return;
        }
        resolve({ body, bytes, elapsedMs: Date.now() - started });
      });
    });
  });
}

async function main() {
  const backend = await request('http://127.0.0.1:8084/actuator/health');
  if (JSON.parse(backend.body).status !== 'UP') {
    throw new Error('Isolated backend is not UP');
  }
  console.log('PASS: isolated backend on 8084 is UP');
  const metro = await request('http://127.0.0.1:8083/status');
  if (metro.body.trim() !== 'packager-status:running') {
    throw new Error('Port 8083 is not a ready Metro server');
  }
  console.log('PASS: Metro is reachable over IPv4 on 8083');
  console.log(
    'Checking Android bundle; first compilation may take several minutes.',
  );
  const bundle = await request(
    'http://127.0.0.1:8083/node_modules/expo-router/entry.bundle?platform=android&dev=true&minify=false',
    { bundle: true, timeout: 10 * 60_000 },
  );
  if (bundle.bytes === 0) throw new Error('Empty Android bundle');
  console.log(
    `PASS: Android bundle delivered (${bundle.bytes} bytes, ${bundle.elapsedMs} ms)`,
  );
  console.log(
    'Host preflight passed. Device connectivity, memory and native acceptance still require verification.',
  );
}

main().catch((error) => {
  console.error(`BLOCKED: ${error.message}`);
  process.exitCode = 1;
});
