
import { useEffect, useState } from "react";
import axios from "axios";
import {
  Sparkles, Heart, MessageCircle, Newspaper, Search,
  Send, LogOut, RefreshCw, UserRound, Home, LockKeyhole
} from "lucide-react";
import "./index.css";

const BASE_URL = "http://localhost:5000/api";
const POSTS_URL = `${BASE_URL}/posts`;
const AUTH_URL = `${BASE_URL}/auth`;
const NEWS_URL = `${BASE_URL}/news`;

const categories = [
  { label: "Top stories", value: "general" },
  { label: "India", value: "nation" },
  { label: "World", value: "world" },
  { label: "Technology", value: "technology" },
  { label: "Business", value: "business" },
  { label: "Science", value: "science" },
  { label: "Sports", value: "sports" },
  { label: "Entertainment", value: "entertainment" },
  { label: "Health", value: "health" },
];

function getSavedToken() {
  try {
    return localStorage.getItem("info_token") || "";
  } catch {
    return "";
  }
}

function saveSession(token, user) {
  localStorage.setItem("info_token", token);
  localStorage.setItem("info_user", JSON.stringify(user));
}

function clearSession() {
  localStorage.removeItem("info_token");
  localStorage.removeItem("info_user");
}

function getSavedUser() {
  try {
    const value = localStorage.getItem("info_user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
}

function authRequest(token) {
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
}

function Avatar({ name = "?", small = false }) {
  return (
    <div className={`avatar ${small ? "avatar-small" : ""}`}>
      {(name || "?").charAt(0).toUpperCase()}
    </div>
  );
}

function formatPost(post, user) {
  const likedBy = Array.isArray(post.likedBy) ? post.likedBy : [];

  return {
    ...post,
    id: post._id,
    name: post.authorName,
    username: post.username,
    likes: Number(post.likes) || 0,
    likedBy,
    comments: Array.isArray(post.comments) ? post.comments : [],
    liked: likedBy.includes((user?.username || "").toLowerCase()),
    article: post.article || null,
  };
}

function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [login, setLogin] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const response =
        mode === "register"
          ? await axios.post(`${AUTH_URL}/register`, {
              name,
              username,
              email,
              password,
            })
          : await axios.post(`${AUTH_URL}/login`, {
              login,
              password,
            });

      onLogin(response.data.token, response.data.user);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not connect. Check that the backend is running."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-card">
        <div className="brand-mark"><Sparkles size={24} /></div>
        <h1>Info<span>.</span></h1>
        <p className="auth-subtitle">News, stories, and community.</p>

        <div className="auth-tabs">
          <button
            className={mode === "login" ? "selected" : ""}
            onClick={() => { setMode("login"); setError(""); }}
            type="button"
          >
            Log in
          </button>
          <button
            className={mode === "register" ? "selected" : ""}
            onClick={() => { setMode("register"); setError(""); }}
            type="button"
          >
            Create account
          </button>
        </div>

        <form onSubmit={submit} className="auth-form">
          {mode === "register" ? (
            <>
              <label>
                Full name
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  autoComplete="name"
                  required
                  maxLength={60}
                  placeholder="Your name"
                />
              </label>
              <label>
                Username
                <input
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  autoComplete="username"
                  required
                  minLength={3}
                  maxLength={24}
                  pattern="[a-zA-Z0-9_]+"
                  placeholder="your_username"
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                  placeholder="you@example.com"
                />
              </label>
            </>
          ) : (
            <label>
              Username or email
              <input
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                autoComplete="username"
                required
                placeholder="Enter username or email"
              />
            </label>
          )}

          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete={mode === "register" ? "new-password" : "current-password"}
              required
              minLength={mode === "register" ? 8 : undefined}
              maxLength={72}
              placeholder={mode === "register" ? "At least 8 characters" : "Your password"}
            />
          </label>

          {error && <p className="error-message" role="alert">{error}</p>}

          <button className="primary-button auth-submit" disabled={busy}>
            {busy
              ? "Please wait..."
              : mode === "register"
                ? "Create account"
                : "Log in"}
          </button>
        </form>

        <p className="auth-footnote">
          <LockKeyhole size={14} /> Your account is protected by password hashing.
        </p>
      </section>
    </main>
  );
}

export default function App() {
  const [token, setToken] = useState(getSavedToken);
  const [user, setUser] = useState(getSavedUser);
  const [checkingSession, setCheckingSession] = useState(Boolean(getSavedToken));

  const [posts, setPosts] = useState([]);
  const [postText, setPostText] = useState("");
  const [search, setSearch] = useState("");
  const [activePage, setActivePage] = useState("Home");
  const [notice, setNotice] = useState("");
  const [loadingPosts, setLoadingPosts] = useState(false);
  const [posting, setPosting] = useState(false);
  const [commentDrafts, setCommentDrafts] = useState({});
  const [openComments, setOpenComments] = useState({});
  const [newsArticles, setNewsArticles] = useState([]);
  const [newsCategory, setNewsCategory] = useState("general");
  const [newsSearch, setNewsSearch] = useState("");
  const [loadingNews, setLoadingNews] = useState(false);
  const [newsError, setNewsError] = useState("");
  const [sharingArticle, setSharingArticle] = useState("");

  function handleLogin(newToken, newUser) {
    saveSession(newToken, newUser);
    setToken(newToken);
    setUser(newUser);
    setNotice("Welcome to Info!");
  }

  function logout(message = "You have logged out.") {
    clearSession();
    setToken("");
    setUser(null);
    setPosts([]);
    setNotice(message);
  }

  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      if (!token) {
        setCheckingSession(false);
        return;
      }

      try {
        const response = await axios.get(
          `${AUTH_URL}/me`,
          authRequest(token)
        );

        if (!cancelled) {
          setUser(response.data.user);
          localStorage.setItem(
            "info_user",
            JSON.stringify(response.data.user)
          );
        }
      } catch {
        if (!cancelled) logout("Your session expired. Please log in again.");
      } finally {
        if (!cancelled) setCheckingSession(false);
      }
    }

    restoreSession();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!token || !user) return;

    let cancelled = false;

    async function fetchPosts() {
      setLoadingPosts(true);

      try {
        const response = await axios.get(POSTS_URL);
        if (!cancelled) {
          setPosts(response.data.map((post) => formatPost(post, user)));
        }
      } catch (error) {
        if (!cancelled) {
          setNotice(error.response?.data?.message || "Could not load posts.");
        }
      } finally {
        if (!cancelled) setLoadingPosts(false);
      }
    }

    fetchPosts();
    return () => { cancelled = true; };
  }, [token, user?.username]);

  async function loadNews(query = newsSearch, category = newsCategory) {
    setLoadingNews(true);
    setNewsError("");

    try {
      const response = await axios.get(NEWS_URL, {
        params: {
          category,
          ...(query.trim() ? { q: query.trim() } : {}),
        },
      });
      setNewsArticles(response.data.articles || []);
      if (!(response.data.articles || []).length) {
        setNewsError("No articles found. Try another search.");
      }
    } catch (error) {
      setNewsError(
        error.response?.data?.message || "Could not load news. Check your backend and GNews API key."
      );
    } finally {
      setLoadingNews(false);
    }
  }

  useEffect(() => {
    if (token && activePage === "News") {
      loadNews("", newsCategory);
    }
    // Category/page selection controls when headlines refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePage, newsCategory, token]);

  async function createPost(event) {
    event?.preventDefault();
    const text = postText.trim();
    if (!text || posting) return;

    setPosting(true);
    setNotice("");

    try {
      const response = await axios.post(
        POSTS_URL,
        { text },
        authRequest(token)
      );
      setPosts((current) => [
        formatPost(response.data, user),
        ...current,
      ]);
      setPostText("");
      setNotice("Your post was saved!");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not create post.");
      if (error.response?.status === 401) logout("Please log in again.");
    } finally {
      setPosting(false);
    }
  }

  async function toggleLike(postId) {
    try {
      const response = await axios.post(
        `${POSTS_URL}/${postId}/like`,
        {},
        authRequest(token)
      );

      const updated = response.data.post;
      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? formatPost(updated, user)
            : post
        )
      );
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not update like.");
      if (error.response?.status === 401) logout("Please log in again.");
    }
  }

  async function submitComment(postId, event) {
    event?.preventDefault();
    const text = (commentDrafts[postId] || "").trim();
    if (!text) return;

    try {
      const response = await axios.post(
        `${POSTS_URL}/${postId}/comments`,
        { text },
        authRequest(token)
      );

      setPosts((current) =>
        current.map((post) =>
          post.id === postId
            ? formatPost(response.data, user)
            : post
        )
      );
      setCommentDrafts((current) => ({ ...current, [postId]: "" }));
      setNotice("Comment added!");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not add comment.");
      if (error.response?.status === 401) logout("Please log in again.");
    }
  }

  async function shareNewsArticle(article) {
    if (!article?.url || sharingArticle) return;
    setSharingArticle(article.url);

    try {
      const response = await axios.post(
        `${POSTS_URL}/share-news`,
        {
          article: {
            title: article.title,
            description: article.description || "",
            url: article.url,
            image: article.image || "",
            source: article.source?.name || "",
            publishedAt: article.publishedAt || "",
          },
          text: "",
        },
        authRequest(token)
      );

      setPosts((current) => [
        formatPost(response.data, user),
        ...current,
      ]);
      setActivePage("Home");
      setNotice("News article shared to your Info feed!");
    } catch (error) {
      setNotice(error.response?.data?.message || "Could not share the article.");
      if (error.response?.status === 401) logout("Please log in again.");
    } finally {
      setSharingArticle("");
    }
  }

  if (checkingSession) {
    return <main className="auth-page"><p>Checking your session...</p></main>;
  }

  if (!token || !user) {
    return <AuthScreen onLogin={handleLogin} />;
  }

  const visiblePosts = posts.filter((post) =>
    `${post.name || ""} ${post.username || ""} ${post.text || ""}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  return (
    <div className="app-shell">
      <aside className="left-sidebar">
        <a className="brand" href="#home" onClick={() => setActivePage("Home")}>
          <span className="brand-icon"><Sparkles size={22} /></span>
          <span className="brand-text">
            <strong>Info<span>.</span></strong>
            <small>News Social Media App</small>
          </span>
        </a>

        <div className="profile-mini">
          <Avatar name={user.name} />
          <div>
            <strong>{user.name}</strong>
            <small>@{user.username}</small>
          </div>
        </div>

        <p className="nav-heading">MENU</p>
        <nav className="main-nav">
          <button className={activePage === "Home" ? "nav-item active" : "nav-item"} onClick={() => setActivePage("Home")}>
            <Home size={19} /> Home
          </button>
          <button className={activePage === "News" ? "nav-item active" : "nav-item"} onClick={() => setActivePage("News")}>
            <Newspaper size={19} /> News
          </button>
        </nav>

        <div className="sidebar-bottom">
          <div className="community-card">
            <Sparkles size={22} />
            <strong>Find your people</strong>
            <p>Connect, share stories, and discover what's happening.</p>
          </div>
          <button className="nav-item logout-button" onClick={() => logout()}>
            <LogOut size={19} /> Log out
          </button>
          <p className="copyright">© 2026 Info Social</p>
        </div>
      </aside>

      <main className="feed-column" id="home">
        <header className="topbar">
          <div>
            <p className="eyebrow">NEWS • STORIES • COMMUNITY</p>
            <h1>{activePage === "News" ? <>Explore <span>News</span></> : <>Welcome back, <span>{user.name}</span></>}</h1>
            <p className="topbar-subtitle">News, stories, and conversations—all in one place.</p>
          </div>
          {activePage === "Home" && (
            <label className="search-box">
              <Search size={18} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search posts..." />
            </label>
          )}
        </header>

        {notice && (
          <div className="notice" role="status">
            {notice}
            <button onClick={() => setNotice("")} aria-label="Dismiss notice">×</button>
          </div>
        )}

        {activePage === "News" ? (
          <section className="news-page">
            <div className="news-heading">
              <div><h2>Today's headlines</h2><p>News powered by GNews</p></div>
              <button className="secondary-button" onClick={() => loadNews()} disabled={loadingNews}>
                <RefreshCw size={16} /> Refresh
              </button>
            </div>

            <form className="news-search-form" onSubmit={(e) => { e.preventDefault(); loadNews(newsSearch, newsCategory); }}>
              <input value={newsSearch} onChange={(e) => setNewsSearch(e.target.value)} placeholder="Search news..." maxLength={200} />
              <button className="primary-button">Search</button>
            </form>

            <div className="news-categories">
              {categories.map((category) => (
                <button
                  key={category.value}
                  className={newsCategory === category.value ? "selected" : ""}
                  onClick={() => setNewsCategory(category.value)}
                >
                  {category.label}
                </button>
              ))}
            </div>

            {loadingNews && <p className="status-text">Loading headlines...</p>}
            {newsError && <p className="error-message">{newsError}</p>}

            <div className="news-grid">
              {newsArticles.map((article, index) => (
                <article className="news-card card" key={article.url || index}>
                  {article.image && <img className="news-image" src={article.image} alt="" loading="lazy" />}
                  <div className="news-card-content">
                    <small>{article.source?.name || "News source"}</small>
                    <h3>{article.title}</h3>
                    <p>{article.description}</p>
                    <div className="news-card-actions">
                      <a href={article.url} target="_blank" rel="noreferrer">Read article ↗</a>
                      <button className="secondary-button" disabled={sharingArticle === article.url} onClick={() => shareNewsArticle(article)}>
                        <Send size={15} /> Share to Info
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ) : (
          <>
            <section className="welcome-banner">
              <span className="banner-label"><Sparkles size={14} /> WELCOME TO INFO</span>
              <h2>Your stories.<br />Your <span>community.</span></h2>
              <p>A simple space to share what's happening.</p>
            </section>

            <form className="composer card" onSubmit={createPost}>
              <div className="composer-top">
                <Avatar name={user.name} />
                <textarea value={postText} onChange={(e) => setPostText(e.target.value)} placeholder={`What's on your mind, ${user.name}?`} maxLength={10000} rows={3} />
              </div>
              <div className="composer-bottom">
                <span className="muted-text">Share something with your community</span>
                <button className="primary-button" disabled={!postText.trim() || posting}>
                  {posting ? "Saving..." : "＋ Post"}
                </button>
              </div>
            </form>

            <div className="feed-heading">
              <div><h2>Latest posts</h2><p>See what's happening in your community.</p></div>
            </div>

            <section className="posts-list">
              {loadingPosts && <p className="status-text">Loading posts...</p>}
              {!loadingPosts && visiblePosts.length === 0 && (
                <div className="empty-state card">
                  <MessageCircle size={28} />
                  <h3>{search ? "No posts found" : "No posts yet"}</h3>
                  <p>Be the first to share something!</p>
                </div>
              )}

              {visiblePosts.map((post) => (
                <article className="post-card card" key={post.id}>
                  <div className="post-header">
                    <Avatar name={post.name} />
                    <div className="post-author">
                      <strong>{post.name}</strong>
                      <span>@{post.username} · {post.createdAt ? new Date(post.createdAt).toLocaleString() : "Just now"}</span>
                    </div>
                  </div>

                  {post.text && <p className="post-text">{post.text}</p>}

                  {post.article && (
                    <div className="shared-article">
                      {post.article.image && <img className="news-image" src={post.article.image} alt="" />}
                      <div className="news-card-content">
                        <small>{post.article.source || "Shared news article"}</small>
                        <h3>{post.article.title}</h3>
                        <p>{post.article.description}</p>
                        {post.article.url && <a href={post.article.url} target="_blank" rel="noreferrer">Read original article ↗</a>}
                      </div>
                    </div>
                  )}

                  {post.image && <img className="post-image" src={post.image} alt="Post" />}

                  <div className="post-stats">
                    <span><Heart size={15} /> {post.likes} likes</span>
                    <span>{post.comments.length} comments</span>
                  </div>

                  <div className="post-actions">
                    <button className={post.liked ? "liked" : ""} onClick={() => toggleLike(post.id)}>
                      <Heart size={18} fill={post.liked ? "currentColor" : "none"} /> {post.liked ? "Liked" : "Like"}
                    </button>
                    <button onClick={() => setOpenComments((current) => ({ ...current, [post.id]: !current[post.id] }))}>
                      <MessageCircle size={18} /> Comment
                    </button>
                  </div>

                  {openComments[post.id] && (
                    <section className="comments-panel">
                      <div className="comment-list">
                        {post.comments.map((comment, index) => (
                          <div className="comment-item" key={comment._id || index}>
                            <Avatar name={comment.authorName || comment.username} small />
                            <div>
                              <strong>{comment.authorName || comment.username}</strong>
                              <p>{comment.text}</p>
                            </div>
                          </div>
                        ))}
                        {post.comments.length === 0 && <p className="muted-text">No comments yet.</p>}
                      </div>
                      <form className="comment-form" onSubmit={(e) => submitComment(post.id, e)}>
                        <input
                          value={commentDrafts[post.id] || ""}
                          onChange={(e) => setCommentDrafts((current) => ({ ...current, [post.id]: e.target.value }))}
                          placeholder="Write a comment..."
                          maxLength={2000}
                          required
                        />
                        <button className="primary-button">Send</button>
                      </form>
                    </section>
                  )}
                </article>
              ))}
            </section>
          </>
        )}
        <footer className="mobile-footer">Info · News Social Media App</footer>
      </main>
    </div>
  );
}
