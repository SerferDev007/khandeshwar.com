import { User } from "../models/User.js";
import { asyncHandler } from "../middleware/error.js";
import pino from "pino";

const logger = pino({ name: "UserController" });

// Get all users (Admin/Treasurer)
export const getAllUsers = asyncHandler(async (req, res) => {
  try {
    // ✅ Don’t assume validator ran; fall back to query and sane defaults
    const v = req.validatedData ?? {};
    const q = req.query ?? {};

    const rawPage = v.page ?? q.page ?? 1;
    const rawLimit = v.limit ?? q.limit ?? 10;
    const rawSort = v.sort ?? q.sort ?? "created_at";
    const rawOrder = v.order ?? q.order ?? "desc";
    const rawRole = v.role ?? q.role;
    const rawStatus = v.status ?? q.status;

    logger.info("getAllUsers request (raw):", {
      page: rawPage,
      limit: rawLimit,
      sort: rawSort,
      order: rawOrder,
      role: rawRole,
      status: rawStatus,
      user: req.user?.id,
    });

    // ✅ Safety sanitize
    const safeOptions = {
      page: Math.max(1, parseInt(rawPage, 10) || 1),
      limit: Math.min(100, Math.max(1, parseInt(rawLimit, 10) || 10)),
      sort: [
        "created_at",
        "username",
        "email",
        "role",
        "status",
        "last_login",
      ].includes(String(rawSort))
        ? String(rawSort)
        : "created_at",
      order:
        String(rawOrder).toLowerCase() === "asc" ||
        String(rawOrder).toLowerCase() === "desc"
          ? String(rawOrder).toLowerCase()
          : "desc",
    };

    if (rawRole && ["Admin", "Treasurer", "Viewer"].includes(rawRole)) {
      safeOptions.role = rawRole;
    }
    if (rawStatus && ["Active", "Inactive"].includes(rawStatus)) {
      safeOptions.status = rawStatus;
    }

    logger.info("getAllUsers sanitized options:", safeOptions);

    // ✅ Call model safely
    const result = await User.findAll(safeOptions);

    if (!result || typeof result !== "object") {
      logger.error("User.findAll returned unexpected value", {
        resultType: typeof result,
      });
      return res.status(500).json({
        success: false,
        error: "Failed to load users. Please try again.",
      });
    }

    const users = Array.isArray(result.users) ? result.users : [];
    const pagination = result.pagination ?? {
      page: safeOptions.page,
      limit: safeOptions.limit,
      total: users.length,
      pages: Math.ceil((users.length || 1) / safeOptions.limit),
    };

    logger.info("getAllUsers success:", {
      usersCount: users.length,
      totalPages: pagination.pages,
      currentPage: pagination.page,
    });

    return res.json({
      success: true,
      data: {
        users: users.map((u) =>
          typeof u?.toSafeObject === "function" ? u.toSafeObject() : u
        ),
        pagination,
      },
    });
  } catch (error) {
    logger.error("getAllUsers failed:", {
      error: error.message,
      stack: error.stack,
      params: req.validatedData,
    });
    return res.status(500).json({
      success: false,
      error: "Failed to load users. Please try again.",
      details:
        process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// Get user by ID
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;
  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }
  res.json({ success: true, data: { user: user.toSafeObject() } });
});

// Create user (Admin only)
export const createUser = asyncHandler(async (req, res) => {
  const { username, email, password, role } = req.validatedData;

  const existingUserByEmail = await User.findByEmail(email);
  if (existingUserByEmail) {
    return res
      .status(409)
      .json({ success: false, error: "Email already registered" });
  }
  const existingUserByUsername = await User.findByUsername(username);
  if (existingUserByUsername) {
    return res
      .status(409)
      .json({ success: false, error: "Username already taken" });
  }

  const user = await User.create({
    username,
    email,
    password,
    role: role || "Viewer",
  });

  logger.info("User created by admin:", {
    createdUserId: user.id,
    createdBy: req.user.id,
    username: user.username,
    role: user.role,
  });

  res.status(201).json({ success: true, data: { user: user.toSafeObject() } });
});

// Update user
export const updateUser = asyncHandler(async (req, res) => {
  const { id, username, email, role, status } = req.validatedData;

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  if (req.user.role !== "Admin" && req.user.id !== id) {
    return res
      .status(403)
      .json({ success: false, error: "You can only update your own profile" });
  }

  const updateData = {};
  if (username) updateData.username = username;
  if (email) updateData.email = email;

  if (req.user.role === "Admin") {
    if (role) updateData.role = role;
    if (status) updateData.status = status;
  }

  if (username && username !== user.username) {
    const existingUser = await User.findByUsername(username);
    if (existingUser && existingUser.id !== user.id) {
      return res
        .status(409)
        .json({ success: false, error: "Username already taken" });
    }
  }
  if (email && email !== user.email) {
    const existingUser = await User.findByEmail(email);
    if (existingUser && existingUser.id !== user.id) {
      return res
        .status(409)
        .json({ success: false, error: "Email already registered" });
    }
  }

  await user.update(updateData);

  logger.info("User updated:", {
    updatedUserId: user.id,
    updatedBy: req.user.id,
    updates: updateData,
  });

  res.json({ success: true, data: { user: user.toSafeObject() } });
});

// Delete user (Admin only) - soft delete
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.validatedData;

  if (req.user.id === id) {
    return res
      .status(400)
      .json({ success: false, error: "You cannot delete your own account" });
  }

  const user = await User.findById(id);
  if (!user) {
    return res.status(404).json({ success: false, error: "User not found" });
  }

  await user.delete();

  logger.info("User deleted (soft):", {
    deletedUserId: user.id,
    deletedBy: req.user.id,
    username: user.username,
  });

  res.json({ success: true, data: { message: "User deleted successfully" } });
});

// Get user statistics (Admin only)
export const getUserStats = asyncHandler(async (req, res) => {
  const totalResult = await User.findAll({ limit: 1 });
  const activeResult = await User.findAll({ status: "Active", limit: 1 });
  const adminResult = await User.findAll({ role: "Admin", limit: 1 });
  const treasurerResult = await User.findAll({ role: "Treasurer", limit: 1 });
  const viewerResult = await User.findAll({ role: "Viewer", limit: 1 });

  res.json({
    success: true,
    data: {
      stats: {
        total: totalResult.pagination.total,
        active: activeResult.pagination.total,
        inactive: totalResult.pagination.total - activeResult.pagination.total,
        byRole: {
          Admin: adminResult.pagination.total,
          Treasurer: treasurerResult.pagination.total,
          Viewer: viewerResult.pagination.total,
        },
      },
    },
  });
});
