
const express = require("express");
const Post = require("../models/Post");
const requireAuth = require("../middleware/requireAuth");

const router = express.Router();

// PUBLIC FEED
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .limit(100);

    res.json(posts);
  } catch (error) {
    console.error("Fetch posts error:", error.message);
    res.status(500).json({ message: "Unable to load posts." });
  }
});

// CREATE POST
router.post("/", requireAuth, async (req, res) => {
  try {
    const { text, image } = req.body;

    if (
      typeof text !== "string" ||
      (!text.trim() && !(typeof image === "string" && image.trim()))
    ) {
      return res.status(400).json({
        message: "Write something or provide an image.",
      });
    }

    const post = await Post.create({
      authorName: req.user.name,
      username: req.user.username,
      text: text.trim(),
      image: typeof image === "string" ? image.trim() : "",
      likes: 0,
      likedBy: [],
      comments: [],
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Create post error:", error.message);
    res.status(500).json({ message: "Unable to create post." });
  }
});

// LIKE / UNLIKE POST
router.post("/:id/like", requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    if (!Array.isArray(post.likedBy)) {
      post.likedBy = [];
    }

    const username = req.user.username;
    const alreadyLiked = post.likedBy.includes(username);

    if (alreadyLiked) {
      post.likedBy = post.likedBy.filter(
        (item) => item !== username
      );
    } else {
      post.likedBy.push(username);
    }

    post.likes = post.likedBy.length;
    await post.save();

    res.json({
      message: alreadyLiked ? "Like removed." : "Post liked.",
      post,
      liked: !alreadyLiked,
    });
  } catch (error) {
    console.error("Like post error:", error.message);
    res.status(500).json({ message: "Unable to update like." });
  }
});

// ADD COMMENT
router.post("/:id/comments", requireAuth, async (req, res) => {
  try {
    const { text } = req.body;

    if (typeof text !== "string" || !text.trim()) {
      return res.status(400).json({
        message: "Comment cannot be empty.",
      });
    }

    if (text.trim().length > 2000) {
      return res.status(400).json({
        message: "Comment must be at most 2000 characters.",
      });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found." });
    }

    post.comments.push({
      authorName: req.user.name,
      username: req.user.username,
      text: text.trim(),
    });

    await post.save();

    res.status(201).json(post);
  } catch (error) {
    console.error("Add comment error:", error.message);
    res.status(500).json({ message: "Unable to add comment." });
  }
});

// SHARE NEWS ARTICLE
router.post("/share-news", requireAuth, async (req, res) => {
  try {
    const { article, text } = req.body;

    if (
      !article ||
      typeof article !== "object" ||
      Array.isArray(article) ||
      typeof article.title !== "string" ||
      typeof article.url !== "string"
    ) {
      return res.status(400).json({
        message: "A valid news article is required.",
      });
    }

    let parsedUrl;

    try {
      parsedUrl = new URL(article.url);
    } catch {
      return res.status(400).json({
        message: "The article URL is invalid.",
      });
    }

    if (!["http:", "https:"].includes(parsedUrl.protocol)) {
      return res.status(400).json({
        message: "Only HTTP or HTTPS article links are allowed.",
      });
    }

    const post = await Post.create({
      authorName: req.user.name,
      username: req.user.username,
      text: typeof text === "string" ? text.trim() : "",
      likes: 0,
      likedBy: [],
      comments: [],
      article: {
        title: article.title,
        description:
          typeof article.description === "string"
            ? article.description
            : "",
        url: parsedUrl.toString(),
        image:
          typeof article.image === "string" ? article.image : "",
        source:
          typeof article.source === "string" ? article.source : "",
        publishedAt:
          typeof article.publishedAt === "string"
            ? article.publishedAt
            : "",
      },
    });

    res.status(201).json(post);
  } catch (error) {
    console.error("Share news error:", error.message);
    res.status(500).json({ message: "Unable to share news." });
  }
});

module.exports = router;
