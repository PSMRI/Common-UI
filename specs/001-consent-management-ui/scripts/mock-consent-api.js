#!/usr/bin/env node
// Mock Consent-API for manual testing (contracts/consent-api.md). No dependencies.
// Usage: node mock-consent-api.js [port]   (default 3999)
// Pending-actions and errors can be switched per run with env vars:
//   MOCK_PENDING=LEGACY   MOCK_SAVE=STALE|UNAVAILABLE   MOCK_OFFLINE=1
const http = require('http');
const port = Number(process.argv[2] || 3999);

const purposes = [
  { purposeCode: 'P-REG', name: 'Registration', description: 'Create your health record', isMandatory: true, isWithdrawable: false, validityDays: null },
  { purposeCode: 'P-TRT', name: 'Treatment', description: 'Clinical care at this facility', isMandatory: true, isWithdrawable: true, validityDays: null },
  { purposeCode: 'P-REM', name: 'SMS reminders', description: 'Visit and medicine reminders', isMandatory: false, isWithdrawable: true, validityDays: 365 },
  { purposeCode: 'P-SHR', name: 'Share with other facilities', description: 'Referral history', isMandatory: false, isWithdrawable: true, validityDays: 365 },
];
const notice = (lang) => ({
  noticeVersionId: 12, languageCode: lang, context: 'REGISTRATION', textHash: 'hash-' + lang,
  audioUrl: null,
  body: '<p>Mock notice in ' + lang + '.</p>' + '<p>Scroll to the end to unlock Accept.</p>'.repeat(15),
  dataItems: 'Name, age, gender, phone, address', retention: 'Kept for 5 years after the last visit',
  recipients: 'Treating facility; referral facility only if you agree', withdrawalInfo: 'Ask staff at any visit',
  grievanceInfo: 'Contact the DPO at dpo@example.org', purposes,
});
const ok = (data) => ({ statusCode: 200, status: 'Success', errorMessage: 'Success', data });
let n = 0;

http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Headers', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }
  let body = '';
  req.on('data', (c) => (body += c));
  req.on('end', () => {
    const url = new URL(req.url, 'http://x');
    const p = url.pathname;
    console.log(req.method, req.url, req.headers['idempotency-key'] ? 'key=' + req.headers['idempotency-key'] : '', body && body.length < 2000 ? body : '');
    const send = (code, obj) => { res.writeHead(code, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(obj)); };
    if (p.endsWith('/notices/active/languages')) return send(200, ok([
      { languageCode: 'en', languageName: 'English', hasAudio: false },
      { languageCode: 'hi', languageName: 'हिन्दी', hasAudio: false },
      { languageCode: 'ur', languageName: 'اردو', hasAudio: false },
    ]));
    if (p.endsWith('/notices/active')) return send(200, ok(notice(url.searchParams.get('lang') || 'en')));
    if (p.endsWith('/consents') && req.method === 'POST') {
      if (process.env.MOCK_SAVE === 'STALE') return send(409, { statusCode: 409, data: { reason: 'STALE_VERSION' } });
      if (process.env.MOCK_SAVE === 'UNAVAILABLE') return send(503, { statusCode: 503 });
      return send(200, ok({ consentId: 'mock-c-' + ++n, syncStatus: process.env.MOCK_OFFLINE ? 'NOT_SYNCED' : 'SYNCED', purposes: [] }));
    }
    if (p.endsWith('/evidence')) return send(200, ok({ evidenceId: 'mock-e-' + ++n, sha256: '' }));
    if (p.endsWith('/otp/challenges')) return send(200, ok({ challengeId: 'mock-otp-' + ++n, maskedPhone: '98******12', expiresAt: '' }));
    if (/\/otp\/challenges\/[^/]+\/verify$/.test(p)) return send(200, ok({ verified: JSON.parse(body || '{}').otp === '123456' }));
    if (p.endsWith('/pending-actions')) return send(200, ok(process.env.MOCK_PENDING ? [{ reason: process.env.MOCK_PENDING, purposeCodes: ['P-REG'], dueSince: '2026-10-01' }] : []));
    send(404, { statusCode: 404, errorMessage: 'not mocked: ' + p });
  });
}).listen(port, () => console.log('Mock Consent-API on http://localhost:' + port + '  (OTP that verifies: 123456)'));
