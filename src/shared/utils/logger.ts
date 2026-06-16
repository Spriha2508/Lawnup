/**
 * LawnUp AI — Structured Development Logger
 *
 * - In __DEV__: full colored output in Metro terminal, all events tracked
 * - In production: errors only (ready to route to Sentry/Crashlytics)
 *
 * Usage:
 *   import { logger } from '@/shared/utils/logger';
 *   logger.auth.login('user@example.com');
 *   logger.scan.started();
 *   logger.api.error('/processPlantScan', new Error('timeout'));
 */

import { reportError } from '../../services/monitoring/crashReporting';

// ── ANSI color codes (work in Metro bundler terminal) ─────────────────────────
const C = {
  reset:   '\x1b[0m',
  bold:    '\x1b[1m',
  dim:     '\x1b[2m',
  red:     '\x1b[31m',
  green:   '\x1b[32m',
  yellow:  '\x1b[33m',
  blue:    '\x1b[34m',
  magenta: '\x1b[35m',
  cyan:    '\x1b[36m',
  white:   '\x1b[37m',
  bgRed:   '\x1b[41m',
} as const;

// ── Log levels ────────────────────────────────────────────────────────────────
type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'event';

const LEVEL_COLOR: Record<LogLevel, string> = {
  debug: C.dim,
  info:  C.white,
  warn:  C.yellow,
  error: C.red,
  event: C.green,
};

// ── Namespace definitions ─────────────────────────────────────────────────────
type Namespace =
  | 'APP'
  | 'AUTH'
  | 'SCAN'
  | 'CAMERA'
  | 'AI'
  | 'API'
  | 'FIREBASE'
  | 'PAYMENT'
  | 'REMINDER'
  | 'WEATHER'
  | 'MY_GARDEN'
  | 'PAYWALL'
  | 'NAV'
  | 'BUNDLE'
  | 'RENDER'
  | 'ERROR';

const NS_COLOR: Record<Namespace, string> = {
  APP:      C.green,
  AUTH:     C.yellow,
  SCAN:     C.cyan,
  CAMERA:   C.cyan,
  AI:       C.blue,
  API:      C.blue,
  FIREBASE: C.magenta,
  PAYMENT:  C.yellow,
  REMINDER: C.cyan,
  WEATHER:  C.blue,
  MY_GARDEN:C.green,
  PAYWALL:  C.yellow,
  BUNDLE:   C.bgRed,
  RENDER:   C.red,
  NAV:      C.white,
  ERROR:    C.red,
};

// ── Core print function ───────────────────────────────────────────────────────
const isDev = typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production';

const ts = (): string => new Date().toLocaleTimeString('en-IN', { hour12: false });

function print(ns: Namespace, level: LogLevel, message: string, data?: unknown): void {
  // Production: warnings + errors only. debug/info/event are dev-only console noise.
  if (!isDev && (level === 'debug' || level === 'info' || level === 'event')) return;

  // Route handled errors to crash reporting (no-op until Sentry is wired).
  if (level === 'error') reportError(`[${ns}] ${message}`, data);

  const nsColor  = NS_COLOR[ns];
  const lvlColor = LEVEL_COLOR[level];
  const prefix   = `${C.bold}${nsColor}[${ns.padEnd(8)}]${C.reset}`;
  const time     = `${C.dim}${ts()}${C.reset}`;
  const msg      = `${lvlColor}${message}${C.reset}`;

  if (data !== undefined) {
    if (level === 'error') {
      console.error(`${prefix} ${time}  ${msg}`, data);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${time}  ${msg}`, data);
    } else {
      console.log(`${prefix} ${time}  ${msg}`, data);
    }
  } else {
    if (level === 'error') {
      console.error(`${prefix} ${time}  ${msg}`);
    } else if (level === 'warn') {
      console.warn(`${prefix} ${time}  ${msg}`);
    } else {
      console.log(`${prefix} ${time}  ${msg}`);
    }
  }
}

// ── App lifecycle ──────────────────────────────────────────────────────────────
const app = {
  launched: () =>
    print('APP', 'event', 'App launched'),

  background: () =>
    print('APP', 'info', '⏸  App backgrounded'),

  foreground: () =>
    print('APP', 'info', '▶  App foregrounded'),

  stateChange: (state: string) =>
    print('APP', 'debug', `App state → ${state}`),

  error: (message: string, err?: unknown) => {
    print('APP', 'error', `[FATAL] ${message}`, err);
  },

  warn: (message: string, data?: unknown) =>
    print('APP', 'warn', message, data),

  info: (message: string, data?: unknown) =>
    print('APP', 'info', message, data),
};

// ── Auth ───────────────────────────────────────────────────────────────────────
const auth = {
  signUp: (email: string) =>
    print('AUTH', 'event', `Sign up: ${email}`),

  login: (email: string, method: string = 'email') =>
    print('AUTH', 'event', `Login: ${email} (${method})`),

  logout: (uid?: string) =>
    print('AUTH', 'event', `Logout${uid ? `: ${uid}` : ''}`),

  sessionRestored: (uid: string) =>
    print('AUTH', 'info', `Session restored: ${uid}`),

  tokenRefreshed: () =>
    print('AUTH', 'debug', 'Token refreshed'),

  error: (action: string, err: unknown) =>
    print('AUTH', 'error', `Auth error [${action}]`, err),

  denied: (reason: string) =>
    print('AUTH', 'warn', `Access denied: ${reason}`),
};

// ── Plant scan ─────────────────────────────────────────────────────────────────
const scan = {
  started: () =>
    print('SCAN', 'event', 'Scan started'),

  imageSelected: (source: 'camera' | 'gallery') =>
    print('SCAN', 'info', `Image selected from ${source}`),

  uploading: (sizeKb: number) =>
    print('SCAN', 'info', `Uploading image (${sizeKb}kb)...`),

  completed: (plantName: string, confidence: number) =>
    print('SCAN', 'event', `Scan complete: ${plantName} (${Math.round(confidence * 100)}% confidence)`),

  diseaseDetected: (plantName: string, disease: string) =>
    print('SCAN', 'warn', `⚠ Disease detected on ${plantName}: ${disease}`),

  nicknamed: (species: string, nickname: string) =>
    print('SCAN', 'event', `Plant nicknamed: "${nickname}" (${species})`),

  nicknameSkipped: (species: string) =>
    print('SCAN', 'info', `Nickname skipped for ${species}`),

  failed: (reason: string, err?: unknown) =>
    print('SCAN', 'error', `Scan failed: ${reason}`, err),

  quotaExceeded: () =>
    print('SCAN', 'warn', 'Scan quota exceeded — upgrade required'),
};

// ── AI chat ────────────────────────────────────────────────────────────────────
const ai = {
  chatStarted: (plantNickname?: string) =>
    print('AI', 'event', `Chat started${plantNickname ? ` with ${plantNickname}` : ''}`),

  messageSent: (charCount: number, plantNickname?: string) =>
    print('AI', 'debug', `→ User message (${charCount} chars)${plantNickname ? ` about ${plantNickname}` : ''}`),

  responseReceived: (tokensUsed: number, charsRemaining: number) =>
    print('AI', 'debug', `← AI response (${tokensUsed} tokens, ${charsRemaining} chats remaining)`),

  moderated: (reason: string) =>
    print('AI', 'warn', `Message moderated: ${reason}`),

  memoryUpdated: (plantNickname: string) =>
    print('AI', 'debug', `Memory updated for ${plantNickname}`),

  quotaExceeded: () =>
    print('AI', 'warn', 'Chat quota exceeded — upgrade required'),

  error: (err: unknown) =>
    print('AI', 'error', 'AI response failed', err),
};

// ── API / network ──────────────────────────────────────────────────────────────
const api = {
  request: (endpoint: string, method: string = 'POST') =>
    print('API', 'debug', `→ ${method} ${endpoint}`),

  success: (endpoint: string, durationMs?: number) =>
    print('API', 'debug', `← ${endpoint}${durationMs ? ` (${durationMs}ms)` : ''}`),

  error: (endpoint: string, err: unknown) => {
    print('API', 'error', `✗ ${endpoint}`, err);
  },

  timeout: (endpoint: string, timeoutMs: number) =>
    print('API', 'warn', `⏱ Timeout: ${endpoint} (${timeoutMs}ms)`),

  offline: () =>
    print('API', 'warn', 'Device appears to be offline'),

  online: () =>
    print('API', 'info', 'Network reconnected'),
};

// ── Firebase ───────────────────────────────────────────────────────────────────
const firebase = {
  initialized: () =>
    print('FIREBASE', 'info', 'Firebase initialized'),

  functionCalled: (name: string) =>
    print('FIREBASE', 'debug', `→ Function: ${name}`),

  functionSuccess: (name: string, durationMs?: number) =>
    print('FIREBASE', 'debug', `← Function: ${name}${durationMs ? ` (${durationMs}ms)` : ''}`),

  functionError: (name: string, code: string, message: string) =>
    print('FIREBASE', 'error', `✗ Function ${name} [${code}]: ${message}`),

  firestoreRead: (path: string) =>
    print('FIREBASE', 'debug', `↓ Firestore read: ${path}`),

  firestoreWrite: (path: string) =>
    print('FIREBASE', 'debug', `↑ Firestore write: ${path}`),

  storageUpload: (path: string, sizeKb: number) =>
    print('FIREBASE', 'info', `↑ Storage upload: ${path} (${sizeKb}kb)`),

  error: (context: string, err: unknown) =>
    print('FIREBASE', 'error', `Firebase error [${context}]`, err),
};

// ── Payment ────────────────────────────────────────────────────────────────────
const payment = {
  initiated: (plan: string, amount: number) =>
    print('PAYMENT', 'event', `Payment initiated: ${plan} (Rs.${amount})`),

  sessionCreated: (orderId: string) =>
    print('PAYMENT', 'info', `Order created: ${orderId}`),

  success: (orderId: string, plan: string) =>
    print('PAYMENT', 'event', `Payment success: ${orderId} -> ${plan}`),

  failed: (orderId: string, reason?: string) =>
    print('PAYMENT', 'error', `✗ Payment failed: ${orderId}${reason ? ` — ${reason}` : ''}`),

  cancelled: (orderId: string) =>
    print('PAYMENT', 'warn', `↩ Payment cancelled: ${orderId}`),

  verifying: (orderId: string) =>
    print('PAYMENT', 'info', `Verifying payment: ${orderId}`),

  webhookReceived: (event: string) =>
    print('PAYMENT', 'debug', `Webhook: ${event}`),
};

// ── Reminders ──────────────────────────────────────────────────────────────────
const reminder = {
  scheduled: (nickname: string, type: string, date: string) =>
    print('REMINDER', 'event', `Reminder set: ${nickname} — ${type} on ${date}`),

  triggered: (nickname: string, type: string) =>
    print('REMINDER', 'event', `Reminder triggered: ${nickname} — ${type}`),

  dismissed: (reminderId: string) =>
    print('REMINDER', 'info', `Reminder dismissed: ${reminderId}`),

  permissionDenied: () =>
    print('REMINDER', 'warn', 'Notification permission denied'),

  tokenRegistered: () =>
    print('REMINDER', 'info', 'FCM token registered'),

  error: (context: string, err: unknown) =>
    print('REMINDER', 'error', `Reminder error [${context}]`, err),
};

// ── Camera ─────────────────────────────────────────────────────────────────────
const camera = {
  opened:       ()                          => print('CAMERA', 'event', 'Camera opened'),
  closed:       ()                          => print('CAMERA', 'info',  'Camera closed'),
  captured:     (sizeKb: number)            => print('CAMERA', 'info',  `Photo captured (${sizeKb}kb)`),
  galleryOpen:  ()                          => print('CAMERA', 'info',  'Gallery picker opened'),
  permDenied:   ()                          => print('CAMERA', 'warn',  'Camera permission denied'),
  error:        (err: unknown)              => print('CAMERA', 'error', 'Camera error', err),
};

// ── Weather ────────────────────────────────────────────────────────────────────
const weather = {
  fetched:  (city: string, tempC: number)   => print('WEATHER', 'info',  `${city}: ${tempC}°C`),
  cached:   (city: string)                  => print('WEATHER', 'debug', `Cache hit: ${city}`),
  failed:   (city: string, err: unknown)    => print('WEATHER', 'warn',  `Failed for ${city}`, err),
  noKey:    ()                              => print('WEATHER', 'warn',  'EXPO_PUBLIC_OPENWEATHER_KEY not set'),
};

// ── My Garden ─────────────────────────────────────────────────────────────────
const garden = {
  loaded:   (count: number)                 => print('MY_GARDEN', 'info',  `${count} plant(s) loaded`),
  added:    (name: string)                  => print('MY_GARDEN', 'event', `Plant added: ${name}`),
  removed:  (name: string)                  => print('MY_GARDEN', 'event', `Plant removed: ${name}`),
  watered:  (name: string)                  => print('MY_GARDEN', 'event', `Watered: ${name}`),
  error:    (ctx: string, err: unknown)     => print('MY_GARDEN', 'error', ctx, err),
};

// ── Paywall ───────────────────────────────────────────────────────────────────
const paywall = {
  shown:    (ctx: string)                   => print('PAYWALL', 'event', `Paywall shown: ${ctx}`),
  dismissed:()                              => print('PAYWALL', 'info',  'Paywall dismissed'),
  upgraded: (plan: string)                  => print('PAYWALL', 'event', `Upgraded to: ${plan}`),
  error:    (err: unknown)                  => print('PAYWALL', 'error', 'Paywall error', err),
};

// ── Navigation ─────────────────────────────────────────────────────────────────
const nav = {
  to: (screen: string, params?: Record<string, unknown>) =>
    print('NAV', 'debug', `→ Navigate: ${screen}${params ? ` ${JSON.stringify(params)}` : ''}`),
  back: (from: string) =>
    print('NAV', 'debug', `← Back from: ${from}`),
  error: (screen: string, err: unknown) =>
    print('NAV', 'error', `[NAVIGATION_ERROR] screen=${screen}`, err),
};

// ── Crash logging (always fires, not gated on isDev) ─────────────────────────
const crash = {
  bundle: (err: Error | string, ctx?: Record<string, unknown>) => {
    const msg = err instanceof Error ? err.message : err;
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`[BUNDLE_CRASH] ${msg}`, ctx ?? '', stack ?? '');
  },
  render: (err: Error, componentStack?: string) => {
    console.error(`[RENDER_ERROR]`, {
      message:        err.message,
      stack:          err.stack,
      componentStack: componentStack?.split('\n').slice(0, 6).join('\n'),
    });
  },
  promise: (reason: unknown) => {
    const msg = reason instanceof Error ? reason.message : String(reason);
    const stack = reason instanceof Error ? reason.stack : undefined;
    console.error(`[UNHANDLED_PROMISE] ${msg}`, stack ?? '');
  },
  async: (ctx: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error(`[ASYNC_ERROR] ${ctx}: ${msg}`, stack ?? '');
  },
};

// ── Global error handlers ─────────────────────────────────────────────────────
function installGlobalHandlers(): void {
  // Always install — crashes matter in prod too
  if (typeof ErrorUtils !== 'undefined') {
    const originalHandler = ErrorUtils.getGlobalHandler();
    ErrorUtils.setGlobalHandler((err: Error, isFatal?: boolean) => {
      const label = isFatal ? '[BUNDLE_CRASH]' : '[RUNTIME_ERROR]';
      console.error(`${label} ${err?.message ?? 'unknown'}`, {
        isFatal,
        stack: err?.stack?.split('\n').slice(0, 8).join('\n'),
      });
      originalHandler?.(err, isFatal);
    });
  }

  // Hermes + RN's polyfill already surface unhandled promise rejections through
  // ErrorUtils, so the handler above covers them. No manual Promise patching needed.

  if (isDev) {
    print('APP', 'debug', 'Global crash handlers installed');
  }
}

// ── Public logger object ──────────────────────────────────────────────────────
export const logger = {
  app,
  auth,
  scan,
  camera,
  ai,
  api,
  firebase,
  payment,
  reminder,
  weather,
  garden,
  paywall,
  nav,
  crash,
  installGlobalHandlers,

  // Raw escape hatch for one-off logging
  debug: (ns: Namespace, msg: string, data?: unknown) => print(ns, 'debug', msg, data),
  info:  (ns: Namespace, msg: string, data?: unknown) => print(ns, 'info',  msg, data),
  warn:  (ns: Namespace, msg: string, data?: unknown) => print(ns, 'warn',  msg, data),
  error: (ns: Namespace, msg: string, data?: unknown) => print(ns, 'error', msg, data),
} as const;

export type { Namespace, LogLevel };
