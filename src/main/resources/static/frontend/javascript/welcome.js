
const params = new URLSearchParams(window.location.search);

const currentEmail = (
    params.get("user") ||
    sessionStorage.getItem("climentosUser") ||
    ""
).trim().toLowerCase();

const feedElement = document.getElementById("feed");
const postInput = document.getElementById("postContent");
const postButton = document.getElementById("postButton");

let currentUserName = "Climentos User";

// CREATE USER INITIALS
function initials(name) {
    if (!name || !name.trim()) return "CL";

    const parts = name.trim().split(/\s+/);

    if (parts.length >= 2) {
        return (
            parts[0][0] +
            parts[parts.length - 1][0]
        ).toUpperCase();
    }

    return parts[0].substring(0, 2).toUpperCase();
}

// PREVENT HTML INJECTION
function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const replacements = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return replacements[character];
    });
}

// FORMAT DATE
function formatDate(value) {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) return "";

    return date.toLocaleString([], {
        dateStyle: "medium",
        timeStyle: "short"
    });
}

// SHOW NOTIFICATION
function showToast(message) {
    const toast = document.getElementById("toast");

    toast.textContent = message;
    toast.classList.add("show");

    setTimeout(() => {
        toast.classList.remove("show");
    }, 2600);
}

// API CONNECTION
async function api(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            ...(options.headers || {})
        }
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
        throw new Error(
            data.message ||
            data.error ||
            "Something went wrong."
        );
    }

    return data;
}

// TO DISPLAY THE REGISTERED USER INFORMATION
function setUserDisplay(name) {
    currentUserName = name || "Climentos User";

    const topName = document.getElementById("topName");
    const sideName = document.getElementById("sideName");
    const helloName = document.getElementById("helloName");

    if (topName) {
        topName.textContent = currentUserName;
    }

    if (sideName) {
        sideName.textContent = currentUserName;
    }

    if (helloName) {
        helloName.textContent = currentUserName.split(" ")[0];
    }

    const userInitials = initials(currentUserName);

    const topAvatar = document.getElementById("topAvatar");
    const sideAvatar = document.getElementById("sideAvatar");
    const composerAvatar = document.getElementById("composerAvatar");

    if (topAvatar) topAvatar.textContent = userInitials;
    if (sideAvatar) sideAvatar.textContent = userInitials;
    if (composerAvatar) composerAvatar.textContent = userInitials;
}

// LOAD REGISTERED USER PROFILE FROM MYSQL
async function loadProfile() {
    if (!currentEmail) {
        showToast("Please sign in again.");
        return;
    }

    try {
        const profile = await api(
            `/api/profile?email=${encodeURIComponent(currentEmail)}`
        );

        setUserDisplay(profile.fullName);

    } catch (error) {
        console.error("Profile loading error:", error);
        showToast("Could not load your profile.");
    }
}

// LOAD POSTS FROM BACKEND
async function loadFeed() {
    if (!currentEmail) {
        feedElement.innerHTML = `
            <div class="card empty-card">
                Please sign in to view your feed.
            </div>
        `;
        return;
    }

    feedElement.innerHTML = `
        <div class="card loading-card">
            Loading your feed…
        </div>
    `;

    try {
        const posts = await api(
            `/api/posts/feed?email=${encodeURIComponent(currentEmail)}`
        );

        renderFeed(posts);

    } catch (error) {
        feedElement.innerHTML = `
            <div class="card empty-card">
                ${escapeHtml(error.message)}
            </div>
        `;
    }
}

// DISPLAY POSTS
function renderFeed(posts) {
    if (!posts.length) {
        feedElement.innerHTML = `
            <div class="card empty-card">
                No posts yet. Be the first to share something ✨
            </div>
        `;
        return;
    }

    feedElement.innerHTML = posts.map(post => {
        const comments = post.comments || [];

        return `
            <article
                class="post-card card"
                data-post-id="${post.id}">

                <div class="post-head">

                    <div class="avatar">
                        ${escapeHtml(initials(post.authorName))}
                    </div>

                    <div class="post-meta">
                        <strong>
                            ${escapeHtml(post.authorName)}
                        </strong>

                        <small>
                            ${escapeHtml(formatDate(post.createdAt))}
                        </small>
                    </div>

                    ${
                        post.authorEmail === currentEmail
                        ? `
                            <button
                                class="delete-post"
                                data-action="delete"
                                title="Delete post">
                                ⋯
                            </button>
                        `
                        : ""
                    }

                </div>

                <div class="post-content">
                    ${escapeHtml(post.content)}
                </div>

                <div class="post-stats">

                    <span>
                        ${post.likeCount}
                        ${post.likeCount === 1 ? "like" : "likes"}
                    </span>

                    <span>
                        ${comments.length}
                        ${comments.length === 1 ? "comment" : "comments"}
                    </span>

                </div>

                <div class="post-actions">

                    <button
                        class="action-button ${post.likedByMe ? "liked" : ""}"
                        data-action="like">

                        ${post.likedByMe ? "♥ Liked" : "♡ Like"}

                    </button>

                    <button
                        class="action-button"
                        data-action="focus-comment">

                        ♡ Comment

                    </button>

                </div>

                <div class="comments">

                    ${
                        comments.map(comment => `
                            <div class="comment">

                                <span class="comment-avatar">
                                    ${escapeHtml(initials(comment.authorName))}
                                </span>

                                <div class="comment-text">
                                    <strong>
                                        ${escapeHtml(comment.authorName)}
                                    </strong>

                                    <span>
                                        ${escapeHtml(comment.content)}
                                    </span>
                                </div>

                            </div>
                        `).join("")
                    }

                    <form class="comment-form">

                        <input
                            name="comment"
                            maxlength="1000"
                            placeholder="Write a comment…"
                            required>

                        <button type="submit">
                            Send
                        </button>

                    </form>

                </div>

            </article>
        `;
    }).join("");
}

// CREATE NEW POST
postButton.addEventListener("click", async () => {
    const content = postInput.value.trim();

    if (!currentEmail) {
        showToast("Please sign in again.");
        return;
    }

    if (!content) {
        showToast("Write something before posting.");
        return;
    }

    postButton.disabled = true;

    try {
        await api("/api/posts", {
            method: "POST",
            body: JSON.stringify({
                authorEmail: currentEmail,
                content: content
            })
        });

        postInput.value = "";

        showToast("Your post is live ✨");

        await loadFeed();

    } catch (error) {
        showToast(error.message);

    } finally {
        postButton.disabled = false;
    }
});

// LIKE, UNLIKE, DELETE AND COMMENT FOCUS
feedElement.addEventListener("click", async event => {
    const button = event.target.closest("[data-action]");

    if (!button) return;

    const card = button.closest("[data-post-id]");

    if (!card) return;

    const postId = card.dataset.postId;

    try {
        if (button.dataset.action === "like") {
            await api(
                `/api/posts/${postId}/like?email=${encodeURIComponent(currentEmail)}`,
                {
                    method: "POST"
                }
            );

            await loadFeed();
        }

        else if (button.dataset.action === "delete") {
            if (!confirm("Are you sure you want to delete this post?")) {
                return;
            }

            await api(
                `/api/posts/${postId}?email=${encodeURIComponent(currentEmail)}`,
                {
                    method: "DELETE"
                }
            );

            showToast("Post deleted.");

            await loadFeed();
        }

        else if (button.dataset.action === "focus-comment") {
            card.querySelector(
                'input[name="comment"]'
            ).focus();
        }

    } catch (error) {
        showToast(error.message);
    }
});

// ADD COMMENT
feedElement.addEventListener("submit", async event => {
    if (!event.target.matches(".comment-form")) return;

    event.preventDefault();

    const card = event.target.closest("[data-post-id]");
    const input = event.target.elements.comment;
    const content = input.value.trim();

    if (!content) return;

    try {
        await api(
            `/api/posts/${card.dataset.postId}/comments`,
            {
                method: "POST",
                body: JSON.stringify({
                    authorEmail: currentEmail,
                    content: content
                })
            }
        );

        await loadFeed();

    } catch (error) {
        showToast(error.message);
    }
});

// FOR REFRESHING FEED
document.getElementById("refreshButton")
    .addEventListener("click", loadFeed);


//CONFIRMATION POPUP
// ADDING POPUP STYLES
const logoutStyles = document.createElement("style");

logoutStyles.textContent = `
    .logout-overlay {
        position: fixed;
        inset: 0;
        background: rgba(45, 30, 55, 0.40);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 9999;
        padding: 20px;
    }

    .logout-modal {
        background: #ffffff;
        width: 100%;
        max-width: 380px;
        padding: 30px 25px;
        border-radius: 20px;
        text-align: center;
        box-shadow: 0 15px 45px rgba(60, 30, 70, 0.18);
        animation: logoutPopup 0.2s ease-out;
    }

    @keyframes logoutPopup {
        from {
            opacity: 0;
            transform: translateY(12px) scale(0.96);
        }
        to {
            opacity: 1;
            transform: translateY(0) scale(1);
        }
    }

    .logout-icon {
        width: 58px;
        height: 58px;
        margin: 0 auto 16px;
        border-radius: 50%;
        background: #f5eaff;
        color: #9333a8;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 26px;
    }

    .logout-modal h2 {
        color: #392747;
        margin: 0 0 10px;
        font-size: 22px;
    }

    .logout-modal p {
        color: #777080;
        margin: 0 0 25px;
        line-height: 1.6;
        font-size: 14px;
    }

    .logout-buttons {
        display: flex;
        gap: 12px;
    }

    .logout-buttons button {
        flex: 1;
        padding: 12px;
        border-radius: 10px;
        font-size: 14px;
        font-weight: 600;
        cursor: pointer;
        border: none;
    }

    .logout-cancel {
        background: #f3edf7;
        color: #574563;
    }

    .logout-confirm {
        background: #d85b91;
        color: white;
    }

    .logout-buttons button:hover {
        opacity: 0.88;
    }
`;

document.head.appendChild(logoutStyles);


// SHOW LOGOUT POPUP
function showLogoutConfirmation() {

    // TO PREVENT MULTIPLE POPUPS
    if (document.querySelector(".logout-overlay")) return;

    const overlay = document.createElement("div");

    overlay.className = "logout-overlay";

    overlay.innerHTML = `
        <div class="logout-modal"
             role="dialog"
             aria-modal="true"
             aria-labelledby="logoutTitle">

            <div class="logout-icon">↪</div>

            <h2 id="logoutTitle">Confirm Logout</h2>

            <p>
                Are you sure you want to log out of Climentos?
                You can sign in again anytime.
            </p>

            <div class="logout-buttons">

                <button type="button" class="logout-cancel">
                    Cancel
                </button>

                <button type="button" class="logout-confirm">
                    Yes, Logout
                </button>

            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    const cancelButton = overlay.querySelector(".logout-cancel");
    const confirmButton = overlay.querySelector(".logout-confirm");

    // CLOSE POPUP
    function closePopup() {
        overlay.remove();
        document.removeEventListener("keydown", handleEscape);
    }

    // CANCEL LOGOUT
    cancelButton.addEventListener("click", closePopup);

    // CLOSE WHEN CLICKING OUTSIDE POPUP
    overlay.addEventListener("click", event => {
        if (event.target === overlay) {
            closePopup();
        }
    });

    // CLOSE USING ESCAPE KEY
    function handleEscape(event) {
        if (event.key === "Escape") {
            closePopup();
        }
    }

    document.addEventListener("keydown", handleEscape);

    // CONFIRM LOGOUT
    confirmButton.addEventListener("click", () => {
        sessionStorage.removeItem("climentosUser");
        window.location.href = "index.html";
    });

    cancelButton.focus();
}


// LOGOUT BUTTON CLICK
document.getElementById("logoutButton")
    .addEventListener("click", showLogoutConfirmation);



// PLACEHOLDER LINKS

["friendsLink", "messagesLink", "savedLink"]
    .forEach(id => {
        document.getElementById(id)
            .addEventListener("click", event => {
                event.preventDefault();
                showToast("This feature is coming next.");
            });
    });


// SAVE CURRENT USER FOR PAGE REFRESH
if (currentEmail) {
    sessionStorage.setItem("climentosUser", currentEmail);
}


// INITIALIZE PAGE
async function initializePage() {
    await loadProfile();
    await loadFeed();
}

initializePage();
