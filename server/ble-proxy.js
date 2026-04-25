require('dotenv').config();
const http = require('http');

const PORT = Number(process.env.BLE_PROXY_PORT || 8787);
const HOST = process.env.BLE_PROXY_HOST || '0.0.0.0';
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://xsgymjzkuiohsqalrqkw.supabase.co';
const SUPABASE_TABLE = process.env.SUPABASE_TABLE || 'ble_scans';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

function parseLine(line) {
  const record = {};
  const parts = String(line || '').trim().split('|');

  for (const part of parts) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (!key) continue;
    record[key] = value;
  }

  if (!record.gateway_id || !record.device_address) {
    return null;
  }

  return {
    gateway_id: record.gateway_id,
    scan_batch: Number(record.scan_batch || 0),
    device_address: record.device_address,
    device_name: record.device_name === undefined ? null : record.device_name,
    rssi: Number(record.rssi || 0),
  };
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let total = 0;

    req.on('data', (chunk) => {
      total += chunk.length;
      if (total > 200_000) {
        reject(new Error('Payload too large'));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });

    req.on('end', () => {
      resolve(Buffer.concat(chunks).toString('utf8'));
    });

    req.on('error', reject);
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  });
  res.end(JSON.stringify(payload));
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    });
    res.end();
    return;
  }

  if (req.method !== 'POST' || req.url !== '/ble') {
    sendJson(res, 404, { error: 'Not found' });
    return;
  }

  if (!SUPABASE_KEY) {
    sendJson(res, 500, { error: 'Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_ANON_KEY' });
    return;
  }

  try {
    const body = await readBody(req);
    const lines = body.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const records = lines.map(parseLine).filter(Boolean);

    if (records.length === 0) {
      sendJson(res, 400, { error: 'No valid records found in body' });
      return;
    }

    const endpoint = `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${SUPABASE_TABLE}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Prefer': 'return=minimal',
      },
      body: JSON.stringify(records),
    });

    const responseText = await response.text();

    if (!response.ok) {
      sendJson(res, response.status, {
        error: 'Supabase insert failed',
        status: response.status,
        body: responseText,
        recordsSent: records.length,
      });
      return;
    }

    sendJson(res, 200, {
      ok: true,
      inserted: records.length,
    });
  } catch (error) {
    sendJson(res, 500, {
      error: error.message || String(error),
    });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`BLE proxy listening on http://${HOST}:${PORT}/ble`);
});
