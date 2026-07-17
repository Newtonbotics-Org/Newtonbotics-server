const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, param, query, validationResult } = require('express-validator');
const router = express.Router();

const { verifyToken, requireAdmin } = require('../middleware/auth');
const { asyncHandler, validationErrorHandler, authorizationErrorHandler, authenticationErrorHandler } = require('../middleware/errorHandler');
const { getRedisClient } = require('../config/redis');
const EnvVault = require('../models/EnvVault');
const { sendEnvVaultOtpEmail } = require('../services/emailService');
const logger = require('../utils/logger');
const { ENV_VAULT_SEED } = require('../data/envVaultSeed');

const SUPER_ADMIN_EMAIL = 'monu2feb2004@gmail.com';
const isRedisEnabled = () => process.env.REDIS_ENABLED === 'true';
const UNLOCK_HEADER = 'x-env-vault-unlock';

function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    return next(authenticationErrorHandler());
  }
  if (req.user.email !== SUPER_ADMIN_EMAIL) {
    return next(authorizationErrorHandler('Access denied. Super admin only.'));
  }
  next();
}

function getUnlockToken(req) {
  return (
    req.headers[UNLOCK_HEADER] ||
    req.headers[UNLOCK_HEADER.toUpperCase()] ||
    req.body?.unlockToken ||
    req.query?.unlockToken ||
    null
  );
}

function requireVaultUnlock(req, res, next) {
  const unlockToken = getUnlockToken(req);
  if (!unlockToken) {
    return next(authorizationErrorHandler('Env vault is locked. Verify OTP first.'));
  }

  try {
    const decoded = jwt.verify(unlockToken, process.env.JWT_SECRET);
    if (decoded.type !== 'env_vault_unlock' || String(decoded.sub) !== String(req.user.id)) {
      return next(authorizationErrorHandler('Invalid env vault unlock token.'));
    }
    if (decoded.email && decoded.email !== SUPER_ADMIN_EMAIL) {
      return next(authorizationErrorHandler('Invalid env vault unlock token.'));
    }
    req.envVaultUnlock = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(authorizationErrorHandler('Env vault unlock expired. Request a new OTP.'));
    }
    return next(authorizationErrorHandler('Invalid env vault unlock token.'));
  }
}

// POST /api/env-vault/request-otp
router.post(
  '/request-otp',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  asyncHandler(async (req, res) => {
    const email = req.user.email;

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      const key = `env_vault_otp_req:${email}`;
      const count = await redisClient.incr(key);
      if (count === 1) {
        await redisClient.expire(key, 3600);
      }
      if (count > 5) {
        return res.status(429).json({
          success: false,
          message: 'Too many OTP requests. Try again later.',
        });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = await bcrypt.hash(otp, 10);

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      await redisClient.setEx(`env_vault_otp:${req.user.id}`, 600, otpHash);
      await sendEnvVaultOtpEmail({ email, otp });
      logger.logAuth('env_vault_otp_sent', req.user.id, true, { email, ip: req.ip });
      return res.json({
        success: true,
        message: `OTP has been sent to ${email}`,
      });
    }

    const otpToken = jwt.sign(
      { sub: req.user.id, type: 'env_vault_otp_challenge', otpHash, email },
      process.env.JWT_SECRET,
      { expiresIn: '10m' }
    );
    await sendEnvVaultOtpEmail({ email, otp });
    logger.logAuth('env_vault_otp_sent', req.user.id, true, { email, ip: req.ip });
    return res.json({
      success: true,
      message: `OTP has been sent to ${email}`,
      data: { otpToken },
    });
  })
);

// POST /api/env-vault/verify-otp
router.post(
  '/verify-otp',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  [
    body('otp').isString().isLength({ min: 6, max: 6 }).matches(/^\d{6}$/),
    body('otpToken').optional().isString(),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const { otp, otpToken } = req.body;

    if (isRedisEnabled()) {
      const redisClient = getRedisClient();
      const storedHash = await redisClient.get(`env_vault_otp:${req.user.id}`);
      if (!storedHash) {
        throw new Error('OTP expired or not found');
      }
      const ok = await bcrypt.compare(otp, storedHash);
      if (!ok) {
        throw new Error('Invalid OTP');
      }
      await redisClient.del(`env_vault_otp:${req.user.id}`);
    } else {
      if (!otpToken) {
        throw new Error('OTP token is required');
      }
      try {
        const decoded = jwt.verify(otpToken, process.env.JWT_SECRET);
        if (
          decoded.type !== 'env_vault_otp_challenge' ||
          String(decoded.sub) !== String(req.user.id)
        ) {
          throw new Error('Invalid OTP token');
        }
        const ok = await bcrypt.compare(otp, decoded.otpHash);
        if (!ok) {
          throw new Error('Invalid OTP');
        }
      } catch (e) {
        if (e.name === 'TokenExpiredError') {
          throw new Error('OTP token expired');
        }
        throw e;
      }
    }

    const unlockToken = jwt.sign(
      {
        sub: req.user.id,
        type: 'env_vault_unlock',
        email: SUPER_ADMIN_EMAIL,
      },
      process.env.JWT_SECRET,
      { expiresIn: '15m' }
    );

    logger.logAuth('env_vault_otp_verified', req.user.id, true, {
      email: req.user.email,
      ip: req.ip,
    });

    res.json({
      success: true,
      message: 'OTP verified. Env vault unlocked for 15 minutes.',
      data: { unlockToken, expiresInSeconds: 900 },
    });
  })
);

// GET /api/env-vault — list entries (requires unlock)
router.get(
  '/',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireVaultUnlock,
  [query('scope').optional().isIn(EnvVault.SCOPES)],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const filter = {};
    if (req.query.scope) filter.scope = req.query.scope;

    const items = await EnvVault.find(filter)
      .sort({ scope: 1, key: 1 })
      .select('-__v')
      .lean();

    res.json({
      success: true,
      data: { items },
    });
  })
);

function coerceStoredValue(raw) {
  if (raw == null) return '';
  if (typeof raw === 'string') return raw;
  if (typeof raw === 'number' || typeof raw === 'boolean') return String(raw);
  return JSON.stringify(raw);
}

/**
 * Parse dotenv-style text into key/value pairs.
 * Splits on the first "=" only so values may contain "=".
 * Skips blank lines and # comments.
 */
function parseEnvText(raw) {
  if (typeof raw !== 'string') {
    throw new Error('envText must be a string');
  }

  const pairs = {};
  const lines = raw.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    const eq = trimmed.indexOf('=');
    if (eq <= 0) continue;

    let key = trimmed.slice(0, eq).trim();
    // Support optional "export KEY=value"
    if (key.startsWith('export ')) {
      key = key.slice(7).trim();
    }
    if (!key) continue;

    let value = trimmed.slice(eq + 1).trim();
    // Strip matching single/double quotes around the value
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    pairs[key] = value;
  }

  return pairs;
}

async function upsertFromObject(scope, obj, { userId, replace, defaultSecret }) {
  const results = [];
  const incomingKeys = Object.keys(obj);

  for (const key of incomingKeys) {
    const trimmed = String(key).trim();
    if (!trimmed) continue;
    if (trimmed.length > 200) {
      throw new Error(`Key too long: ${trimmed}`);
    }
    const value = coerceStoredValue(obj[key]);
    if (value.length > 10000) {
      throw new Error(`Value too long for key: ${trimmed}`);
    }

    const existing = await EnvVault.findOne({ scope, key: trimmed });
    const isSecret = existing ? existing.isSecret : defaultSecret;

    const doc = await EnvVault.findOneAndUpdate(
      { scope, key: trimmed },
      {
        $set: {
          value,
          isSecret,
          updatedBy: userId,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).select('-__v');

    results.push(doc);
  }

  let deleted = 0;
  if (replace) {
    const removal = await EnvVault.deleteMany({
      scope,
      key: { $nin: incomingKeys.map((k) => String(k).trim()).filter(Boolean) },
    });
    deleted = removal.deletedCount || 0;
  }

  return { results, deleted };
}

// GET /api/env-vault/export — .env text (default) or JSON
router.get(
  '/export',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireVaultUnlock,
  [
    query('scope').optional().isIn(EnvVault.SCOPES),
    query('format').optional().isIn(['env', 'json']),
  ],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const format = req.query.format === 'json' ? 'json' : 'env';
    const filter = {};
    if (req.query.scope) filter.scope = req.query.scope;

    const items = await EnvVault.find(filter).sort({ scope: 1, key: 1 }).lean();

    const byScope = {};
    for (const item of items) {
      if (!byScope[item.scope]) byScope[item.scope] = [];
      byScope[item.scope].push(item);
    }

    const scopes = req.query.scope ? [req.query.scope] : EnvVault.SCOPES;

    let content = '';
    let json = null;

    if (format === 'json') {
      if (req.query.scope) {
        json = {};
        for (const entry of byScope[req.query.scope] || []) {
          json[entry.key] = entry.value ?? '';
        }
      } else {
        json = {};
        for (const scope of scopes) {
          json[scope] = {};
          for (const entry of byScope[scope] || []) {
            json[scope][entry.key] = entry.value ?? '';
          }
        }
      }
      content = JSON.stringify(json, null, 2);
    } else {
      const lines = [];
      for (const scope of scopes) {
        const entries = byScope[scope] || [];
        if (entries.length === 0) continue;
        if (!req.query.scope) {
          lines.push(`# ===== ${scope.toUpperCase()} =====`);
        }
        for (const entry of entries) {
          lines.push(`${entry.key}=${entry.value ?? ''}`);
        }
        lines.push('');
      }
      content = lines.join('\n').trim() + (lines.length ? '\n' : '');
    }

    logger.info('env_vault_exported', {
      userId: req.user.id,
      scope: req.query.scope || 'all',
      format,
      count: items.length,
    });

    res.json({
      success: true,
      data: {
        format,
        content,
        json,
        count: items.length,
      },
    });
  })
);

// POST /api/env-vault/seed — one-time seed from docs content (requires unlock)
router.post(
  '/seed',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireVaultUnlock,
  asyncHandler(async (req, res) => {
    let created = 0;
    let skipped = 0;

    for (const entry of ENV_VAULT_SEED) {
      const existing = await EnvVault.findOne({ scope: entry.scope, key: entry.key });
      if (existing) {
        skipped += 1;
        continue;
      }
      await EnvVault.create({
        scope: entry.scope,
        key: entry.key,
        value: entry.value ?? '',
        isSecret: entry.isSecret !== false,
        updatedBy: req.user.id,
      });
      created += 1;
    }

    logger.info('env_vault_seeded', {
      userId: req.user.id,
      created,
      skipped,
    });

    res.json({
      success: true,
      message: `Seeded ${created} entries (${skipped} already existed)`,
      data: { created, skipped },
    });
  })
);

// PUT /api/env-vault — upsert one/many entries, env text paste, or JSON object
router.put(
  '/',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireVaultUnlock,
  asyncHandler(async (req, res) => {
    const scope = req.body?.scope;
    const replace = req.body.replace === true;
    const defaultSecret = req.body.isSecret !== false;

    // Paste .env text: { scope, envText: "KEY=value\n..." }
    if (typeof req.body?.envText === 'string' && scope) {
      if (!EnvVault.SCOPES.includes(scope)) {
        throw new Error('Invalid scope');
      }

      const pairs = parseEnvText(req.body.envText);
      const { results, deleted } = await upsertFromObject(scope, pairs, {
        userId: req.user.id,
        replace,
        defaultSecret,
      });

      logger.info('env_vault_envtext_upserted', {
        userId: req.user.id,
        scope,
        count: results.length,
        deleted,
        replace,
      });

      return res.json({
        success: true,
        message: `Saved ${results.length} keys from .env text${deleted ? ` (removed ${deleted})` : ''}`,
        data: { items: results, deleted },
      });
    }

    // JSON bulk upsert: { scope, json: { KEY: value } }
    if (req.body?.json != null && scope) {
      if (!EnvVault.SCOPES.includes(scope)) {
        throw new Error('Invalid scope');
      }

      let jsonObj = req.body.json;
      if (typeof jsonObj === 'string') {
        jsonObj = JSON.parse(jsonObj);
      }
      if (!jsonObj || typeof jsonObj !== 'object' || Array.isArray(jsonObj)) {
        throw new Error('JSON must be an object of key/value pairs');
      }

      const { results, deleted } = await upsertFromObject(scope, jsonObj, {
        userId: req.user.id,
        replace,
        defaultSecret,
      });

      logger.info('env_vault_json_upserted', {
        userId: req.user.id,
        scope,
        count: results.length,
        deleted,
        replace,
      });

      return res.json({
        success: true,
        message: `Saved ${results.length} keys from JSON${deleted ? ` (removed ${deleted})` : ''}`,
        data: { items: results, deleted },
      });
    }

    const payload = Array.isArray(req.body?.entries)
      ? req.body.entries
      : [req.body];

    const results = [];
    for (const entry of payload) {
      const entryScope = entry?.scope;
      const key = typeof entry?.key === 'string' ? entry.key.trim() : '';
      if (!EnvVault.SCOPES.includes(entryScope) || !key) {
        throw new Error('Each entry requires valid scope and key');
      }
      if (key.length > 200) {
        throw new Error('Key too long');
      }
      const value = coerceStoredValue(entry.value);
      if (value.length > 10000) {
        throw new Error('Value too long');
      }
      const isSecret = entry.isSecret !== false;

      const doc = await EnvVault.findOneAndUpdate(
        { scope: entryScope, key },
        {
          $set: {
            value,
            isSecret,
            updatedBy: req.user.id,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).select('-__v');

      results.push(doc);
    }

    logger.info('env_vault_upserted', {
      userId: req.user.id,
      count: results.length,
      keys: results.map((r) => `${r.scope}:${r.key}`),
    });

    res.json({
      success: true,
      message: results.length === 1 ? 'Env entry saved' : `${results.length} env entries saved`,
      data: { items: results },
    });
  })
);

// POST /api/env-vault/bulk-delete — delete multiple by ids
router.post(
  '/bulk-delete',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireVaultUnlock,
  [body('ids').isArray({ min: 1 }).withMessage('ids must be a non-empty array')],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const ids = (req.body.ids || [])
      .map((id) => String(id))
      .filter((id) => /^[a-fA-F0-9]{24}$/.test(id));

    if (ids.length === 0) {
      throw new Error('No valid ids provided');
    }

    const toDelete = await EnvVault.find({ _id: { $in: ids } }).select('scope key');
    const result = await EnvVault.deleteMany({ _id: { $in: ids } });

    logger.info('env_vault_bulk_deleted', {
      userId: req.user.id,
      count: result.deletedCount,
      keys: toDelete.map((d) => `${d.scope}:${d.key}`),
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} env entries`,
      data: {
        deletedCount: result.deletedCount,
        ids,
      },
    });
  })
);

// DELETE /api/env-vault/:id
router.delete(
  '/:id',
  verifyToken,
  requireAdmin,
  requireSuperAdmin,
  requireVaultUnlock,
  [param('id').isMongoId()],
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) throw validationErrorHandler(errors);

    const deleted = await EnvVault.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Env entry not found' });
    }

    logger.info('env_vault_deleted', {
      userId: req.user.id,
      scope: deleted.scope,
      key: deleted.key,
    });

    res.json({
      success: true,
      message: 'Env entry deleted',
      data: { id: deleted._id, scope: deleted.scope, key: deleted.key },
    });
  })
);

module.exports = router;
