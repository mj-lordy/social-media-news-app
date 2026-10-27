
const mongoose = require("mongoose");

const commentSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      required: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

const articleSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    url: String,
    image: String,
    source: String,
    publishedAt: String,
  },
  { _id: false }
);

const postSchema = new mongoose.Schema(
  {
    authorName: {
      type: String,
      required: true,
    },
    username: {
      type: String,
      default: "",
    },
    text: {
      type: String,
      default: "",
      maxlength: 10000,
    },
    image: {
      type: String,
      default: "",
    },
    likes: {
      type: Number,
      default: 0,
      min: 0,
    },
    likedBy: {
      type: [String],
      default: [],
    },
    comments: {
      type: [commentSchema],
      default: [],
    },
    article: {
      type: articleSchema,
      default: undefined,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", postSchema);
