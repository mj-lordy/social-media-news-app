
const express = require("express");
const Post = require("../models/Post");

const router = express.Router();

// GET: Retrieve posts from MongoDB
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error.message);
    res.status(500).json({ message: "Failed to fetch posts." });
  }
});

// POST: Save a new post in MongoDB
router.post("/", async (req, res) => {
  try {
    const { authorName, username, text, image } = req.body;

    if (!authorName || !username || !text?.trim()) {
      return res.status(400).json({
        message: "Author name, username, and post text are required.",
      });
    }

    const post = await Post.create({
      authorName,
      username,
      text: text.trim(),
      image: image || "",
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error.message);
    res.status(500).json({ message: "Failed to create post." });
  }
});

module.exports = router;
