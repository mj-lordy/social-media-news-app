
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

function createToken(user) {
  return jwt.sign(
    { sub: user._id.toString() },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

function publicUser(user) {
  return {
    id: user._id.toString(),
    name: user.name,
    username: user.username,
    email: user.email,
  };
}

// REGISTER
router.post("/register", async (req, res) => {
  try {
    const { name, username, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof username !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        message: "Please provide all required fields.",
      });
    }

    const cleanName = name.trim();
    const cleanUsername = username.trim().toLowerCase();
    const cleanEmail = email.trim().toLowerCase();

    if (cleanName.length < 2 || cleanName.length > 60) {
      return res.status(400).json({
        message: "Name must contain 2–60 characters.",
      });
    }

    if (!/^[a-z0-9_]{3,24}$/.test(cleanUsername)) {
      return res.status(400).json({
        message:
          "Username must be 3–24 characters and contain only letters, numbers, and underscores.",
      });
    }

    if (
      cleanEmail.length > 254 ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)
    ) {
      return res.status(400).json({
        message: "Please enter a valid email address.",
      });
    }

    if (password.length < 8 || password.length > 72) {
      return res.status(400).json({
        message: "Password must contain 8–72 characters.",
      });
    }

    const existingUser = await User.findOne({
      $or: [
        { username: cleanUsername },
        { email: cleanEmail },
      ],
    });

    if (existingUser) {
      return res.status(409).json({
        message: "Username or email is already registered.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name: cleanName,
      username: cleanUsername,
      email: cleanEmail,
      passwordHash,
    });

    const token = createToken(user);

    return res.status(201).json({
      message: "Account created successfully.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        message: "Username or email is already registered.",
      });
    }

    console.error("Registration error:", error.message);

    return res.status(500).json({
      message: "Unable to create your account right now.",
    });
  }
});

// LOGIN
router.post("/login", async (req, res) => {
  try {
    const { login, password } = req.body;

    if (
      typeof login !== "string" ||
      typeof password !== "string" ||
      !login.trim() ||
      !password
    ) {
      return res.status(400).json({
        message: "Enter your username or email and password.",
      });
    }

    const identifier = login.trim().toLowerCase();

    const user = await User.findOne({
      $or: [
        { username: identifier },
        { email: identifier },
      ],
    }).select("+passwordHash");

    if (!user) {
      return res.status(401).json({
        message: "Invalid username/email or password.",
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: "Invalid username/email or password.",
      });
    }

    const token = createToken(user);

    return res.json({
      message: "Login successful.",
      token,
      user: publicUser(user),
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).json({
      message: "Unable to log in right now.",
    });
  }
});

// RESTORE CURRENT SESSION
router.get("/me", requireAuth, (req, res) => {
  return res.json({
    user: req.user,
  });
});

module.exports = router;
