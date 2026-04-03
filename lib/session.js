import crypto from "crypto"

const SESSION_COOKIE_NAME = "ep_session"
const DEFAULT_MAX_AGE_SECONDS = 60 * 60 * 24 * 7

function getSessionSecret() {
  return process.env.SESSION_SECRET || "dev-only-session-secret-change-me"
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "")
}

function base64UrlDecode(value) {
  const normalized = value.replaceAll("-", "+").replaceAll("_", "/")
  const padding = normalized.length % 4 === 0 ? "" : "=".repeat(4 - (normalized.length % 4))
  return Buffer.from(`${normalized}${padding}`, "base64").toString("utf8")
}

function sign(input) {
  return crypto
    .createHmac("sha256", getSessionSecret())
    .update(input)
    .digest("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replace(/=+$/g, "")
}

export function createSessionToken({ userId, role }, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const nowInSeconds = Math.floor(Date.now() / 1000)
  const payload = {
    sub: String(userId),
    role: String(role || "student"),
    iat: nowInSeconds,
    exp: nowInSeconds + maxAgeSeconds,
  }

  const payloadJson = JSON.stringify(payload)
  const encodedPayload = base64UrlEncode(payloadJson)
  const signature = sign(encodedPayload)
  return `${encodedPayload}.${signature}`
}

export function verifySessionToken(token) {
  if (!token || typeof token !== "string") return null

  const [encodedPayload, incomingSignature] = token.split(".")
  if (!encodedPayload || !incomingSignature) return null

  const expectedSignature = sign(encodedPayload)
  const incomingBuffer = Buffer.from(incomingSignature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (incomingBuffer.length !== expectedBuffer.length) return null

  if (!crypto.timingSafeEqual(incomingBuffer, expectedBuffer)) {
    return null
  }

  try {
    const decoded = base64UrlDecode(encodedPayload)
    const payload = JSON.parse(decoded)
    const nowInSeconds = Math.floor(Date.now() / 1000)

    if (!payload?.sub || !payload?.exp || payload.exp <= nowInSeconds) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function getCookieValue(cookieHeader, name) {
  if (!cookieHeader || !name) return ""

  const parts = cookieHeader.split(";")
  for (const part of parts) {
    const [key, ...rest] = part.trim().split("=")
    if (key === name) {
      return decodeURIComponent(rest.join("="))
    }
  }

  return ""
}

export function getSessionTokenFromRequest(req) {
  const cookieHeader = req.headers.get("cookie") || ""
  return getCookieValue(cookieHeader, SESSION_COOKIE_NAME)
}

export function buildSessionCookie(token, maxAgeSeconds = DEFAULT_MAX_AGE_SECONDS) {
  const isProduction = process.env.NODE_ENV === "production"
  const parts = [
    `${SESSION_COOKIE_NAME}=${encodeURIComponent(token)}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${maxAgeSeconds}`,
  ]

  if (isProduction) {
    parts.push("Secure")
  }

  return parts.join("; ")
}

export function buildClearSessionCookie() {
  const isProduction = process.env.NODE_ENV === "production"
  const parts = [
    `${SESSION_COOKIE_NAME}=`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    "Max-Age=0",
  ]

  if (isProduction) {
    parts.push("Secure")
  }

  return parts.join("; ")
}
