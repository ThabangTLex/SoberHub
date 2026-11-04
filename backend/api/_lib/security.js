const crypto = require('crypto');

function clientIp(req) {
  const forwarded = req.headers?.['x-forwarded-for'];
  if (forwarded) return String(forwarded).split(',')[0].trim().slice(0, 100);
  return String(req.socket?.remoteAddress || 'unknown').slice(0, 100);
}

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase();
}

function validEmail(email) {
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validName(value) {
  return value.length >= 2 && value.length <= 80 && /^[\p{L}\p{M} .'-]+$/u.test(value);
}

function validPhone(value) {
  return !value || (value.length <= 25 && /^[0-9+()\-\s]{7,25}$/.test(value));
}

function validPassword(value) {
  return value.length >= 8 && value.length <= 128;
}

function randomKey(prefix, value) {
  return `${prefix}:${crypto.createHash('sha256').update(String(value)).digest('hex')}`;
}

async function rateLimit(sql, key, limit, windowSeconds) {
  await sql`
    INSERT INTO rate_limits(rate_key, window_start, request_count)
    VALUES(${key}, NOW(), 1)
    ON DUPLICATE KEY UPDATE
      request_count = IF(window_start < TIMESTAMPADD(SECOND, -${windowSeconds}, NOW()), 1, request_count + 1),
      window_start = IF(window_start < TIMESTAMPADD(SECOND, -${windowSeconds}, NOW()), NOW(), window_start)
  `;
  const rows = await sql`SELECT request_count, window_start FROM rate_limits WHERE rate_key=${key}`;
  const row = rows[0];
  const started = new Date(row.window_start).getTime();
  const retryAfter = Math.max(1, Math.ceil((started + windowSeconds * 1000 - Date.now()) / 1000));
  return { allowed: Number(row.request_count) <= limit, retryAfter };
}

function tooMany(res, retryAfter) {
  res.setHeader('Retry-After', String(retryAfter));
  res.status(429).json({ error: 'Too many attempts. Please try again later.', retryAfter });
}

module.exports = { clientIp, normalizeEmail, validEmail, validName, validPhone, validPassword, randomKey, rateLimit, tooMany };
