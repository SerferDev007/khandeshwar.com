// middleware/auth.js
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { query } from "../config/db.js";
import pino from "pino";

const logger = pino({ name: "auth" });

/** Normalize DB results to a plain array of rows across drivers/helpers */
function rowsOf(result) {
  if (!result) return [];
  if (Array.isArray(result)) return result; // your query() already returns rows array
  if (Array.isArray(result?.rows)) return result.rows; // pg style
  if (Array.isArray(result?.[0])) return result[0]; // mysql2/promise [rows, fields]
  return [];
}

/**
 * Authenticate:
 * - Expects Authorization: Bearer <token>
 * - Verifies JWT with env.JWT_SECRET
 * - Accepts both "id" and "userId" in token payload
 * - Loads Active user from DB and attaches to req.user
 * - Never throws; returns 401/503 JSON on failure
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      logger.warn("No/invalid Authorization header", {
        path: req.path,
        method: req.method,
      });
      return res.status(401).json({
        success: false,
        error: 'Missing token. Use "Authorization: Bearer <token>"',
      });
    }

    // Verify token
    let decoded;
    try {
      decoded = jwt.verify(token, env.JWT_SECRET);
    } catch (e) {
      logger.warn("JWT verify failed", { name: e?.name, message: e?.message });
      return res.status(401).json({
        success: false,
        error:
          e?.name === "TokenExpiredError" ? "Token expired" : "Invalid token",
      });
    }

    // Support tokens that used "id" or "userId"
    const userId = decoded?.userId ?? decoded?.id;
    if (!userId) {
      logger.warn("Token missing user id claim", {
        decodedKeys: Object.keys(decoded || {}),
      });
      return res
        .status(401)
        .json({ success: false, error: "Invalid token payload" });
    }

    // DB lookup: must be Active
    let userRows;
    try {
      const rs = await query(
        "SELECT id, username, email, role, status FROM users WHERE id = ? AND status = ?",
        [userId, "Active"]
      );
      userRows = rowsOf(rs);
    } catch (dbErr) {
      logger.error({ msg: "Auth DB lookup failed", error: dbErr?.message });
      return res
        .status(503)
        .json({ success: false, error: "Auth store unavailable" });
    }

    if (userRows.length === 0) {
      logger.warn("User not found or inactive for token", { userId });
      return res
        .status(401)
        .json({ success: false, error: "Invalid or expired token" });
    }

    req.user = userRows[0]; // { id, username, email, role, status }
    logger.info("Auth OK", {
      userId: req.user.id,
      role: req.user.role,
      path: req.path,
    });
    return next();
  } catch (err) {
    logger.error("authenticate() crashed", {
      name: err?.name,
      message: err?.message,
    });
    return res
      .status(401)
      .json({ success: false, error: "Authentication error" });
  }
};

/**
 * Authorize:
 * - If roles provided, user role must be one of them
 * - Returns 401 if not authenticated, 403 if role not allowed
 */
export const authorize = (roles = []) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res
          .status(401)
          .json({ success: false, error: "Authentication required" });
      }
      if (roles.length && !roles.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          error: `Access denied. Required roles: ${roles.join(", ")}`,
        });
      }
      return next();
    } catch (e) {
      return res
        .status(403)
        .json({ success: false, error: "Role check error" });
    }
  };
};

/** Compose helper: require auth + specific roles */
export const requireRoles = (roles = []) => [authenticate, authorize(roles)];

/**
 * Optional authentication:
 * - If token present & valid, attaches req.user (Active only)
 * - If missing/invalid, continues without user
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || "";
    const [scheme, token] = authHeader.split(" ");
    if (scheme !== "Bearer" || !token) return next();

    const decoded = jwt.verify(token, env.JWT_SECRET);
    const userId = decoded?.userId ?? decoded?.id;
    if (!userId) return next();

    const rs = await query(
      "SELECT id, username, email, role, status FROM users WHERE id = ? AND status = ?",
      [userId, "Active"]
    );
    const userRows = rowsOf(rs);
    if (userRows.length) req.user = userRows[0];
    return next();
  } catch {
    return next();
  }
};
