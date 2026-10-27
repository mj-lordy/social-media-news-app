
const express = require("express");

const router = express.Router();

const GNEWS_BASE_URL = "https://gnews.io/api/v4";
const ALLOWED_CATEGORIES = new Set([
  "general",
  "world",
  "nation",
  "business",
  "technology",
  "entertainment",
  "sports",
  "science",
  "health",
]);

// Small in-memory cache to avoid repeatedly using API quota.
const cache = new Map();
const CACHE_DURATION_MS = 60 * 1000;

router.get("/", async (req, res) => {
  try {
    const apiKey = process.env.GNEWS_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        message:
          "GNews API key is missing. Add GNEWS_API_KEY to server/.env.",
      });
    }

    const category = String(req.query.category || "general").toLowerCase();
    const query = String(req.query.q || "").trim();

    if (!ALLOWED_CATEGORIES.has(category)) {
      return res.status(400).json({
        message: "Invalid news category.",
        allowedCategories: [...ALLOWED_CATEGORIES],
      });
    }

    if (query.length > 200) {
      return res.status(400).json({
        message: "Search query must be 200 characters or fewer.",
      });
    }

    const cacheKey = `${category}:${query.toLowerCase()}`;
    const cached = cache.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < CACHE_DURATION_MS) {
      return res.json(cached.data);
    }

    const endpoint = query
      ? `${GNEWS_BASE_URL}/search`
      : `${GNEWS_BASE_URL}/top-headlines`;

    const params = new URLSearchParams({
      lang: "en",
      country: "in",
      max: "10",
      ...(query
        ? { q: query, sortby: "publishedAt" }
        : { category }),
    });

    const response = await fetch(`${endpoint}?${params.toString()}`, {
      headers: {
        "X-Api-Key": apiKey,
        Accept: "application/json",
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      const status = response.status;

      console.error("GNews API returned HTTP", status);

      if (status === 401) {
        return res.status(502).json({
          message: "GNews rejected the API key. Check GNEWS_API_KEY.",
        });
      }

      if (status === 403 || status === 429) {
        return res.status(503).json({
          message:
            "GNews quota or request limit reached. Please try again later.",
        });
      }

      return res.status(502).json({
        message: "The news provider could not complete the request.",
      });
    }

    const data = await response.json();

    const result = {
      totalArticles: data.totalArticles || 0,
      articles: (data.articles || []).map((article) => ({
        id: article.id || article.url,
        title: article.title || "Untitled article",
        description: article.description || "",
        image: article.image || "",
        url: article.url || "",
        publishedAt: article.publishedAt || null,
        source: {
          name: article.source?.name || "News source",
          url: article.source?.url || "",
        },
      })),
    };

    cache.set(cacheKey, {
      timestamp: Date.now(),
      data: result,
    });

    return res.json(result);
  } catch (error) {
    console.error("News route error:", error.message);

    if (error.name === "TimeoutError" || error.name === "AbortError") {
      return res.status(504).json({
        message: "The news service took too long to respond.",
      });
    }

    return res.status(500).json({
      message: "Unable to load news at this time.",
    });
  }
});

module.exports = router;
