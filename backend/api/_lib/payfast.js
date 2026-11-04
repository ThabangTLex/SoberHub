const crypto = require("node:crypto");
const net = require("node:net");

const payfastRanges = [
  ["197.97.145.144", 28],
  ["41.74.179.192", 27],
  ["102.216.36.0", 28],
  ["102.216.36.128", 28],
  ["144.126.193.139", 32],
];

function encode(value) {
  return encodeURIComponent(String(value).trim()).replace(/%20/g, "+");
}

function createSignature(fields, passphrase = "") {
  const parameters = [];
  for (const [key, value] of Object.entries(fields)) {
    if (key === "signature") break;
    if (value !== "" && value !== null && value !== undefined) {
      parameters.push(`${key}=${encode(value)}`);
    }
  }
  if (passphrase) parameters.push(`passphrase=${encode(passphrase)}`);
  return crypto.createHash("md5").update(parameters.join("&")).digest("hex");
}

function ipv4Number(address) {
  const normalized = address.replace(/^::ffff:/i, "");
  if (net.isIP(normalized) !== 4) return null;
  return normalized
    .split(".")
    .reduce((value, octet) => ((value << 8) | Number(octet)) >>> 0, 0);
}

function isPayfastIp(address) {
  const value = ipv4Number(String(address || "").trim());
  if (value === null) return false;
  return payfastRanges.some(([network, prefix]) => {
    const base = ipv4Number(network);
    const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;
    return (value & mask) === (base & mask);
  });
}

module.exports = { createSignature, isPayfastIp };