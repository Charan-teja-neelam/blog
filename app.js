// Local Storage Keys
const USERS_KEY = 'inkwell_users';
const POSTS_KEY = 'inkwell_posts';
const SESSION_KEY = 'inkwell_session';

// State Application
let currentUser = JSON.parse(localStorage.getItem(SESSION_KEY)) || null;
let isLoginMode = true;

// App Init
document.addEventListener("DOMContentLoaded", () => {
    updateAuthUI();
    renderPosts();
    
    // Auth form submit
    document.getElementById('authForm').addEventListener('submit', handleAuth);
    // Post form submit
    document.getElementById('postForm').addEventListener('submit', handlePostSubmit);
});

// UI View Updates
function updateAuthUI() {
    const navAuth = document.getElementById('navAuth');
    const newPostBtn = document.getElementById('newPostBtn');
    
    if (currentUser) {
        navAuth.innerHTML = `<span>Welcome, <b>${currentUser}</b></span> <button class="btn btn-secondary" onclick="logout()">Logout</button>`;
        newPostBtn.classList.remove('hidden');
        document.getElementById('authSection').classList.add('hidden');
    } else {
        navAuth.innerHTML = `<button class="btn" onclick="showAuthForm()">Login / Register</button>`;
        newPostBtn.classList.add('hidden');
    }
}

// Authentication Controller
function showAuthForm() {
    document.getElementById('authSection').classList.remove('hidden');
}

function toggleAuthMode() {
    isLoginMode = !isLoginMode;
    document.getElementById('authTitle').innerText = isLoginMode ? 'Login' : 'Register';
    document.getElementById('authBtn').innerText = isLoginMode ? 'Login' : 'Register';
    document.getElementById('authToggle').innerHTML = isLoginMode ? 
        `Don't have an account? <span onclick="toggleAuthMode()">Register here</span>` :
        `Already have an account? <span onclick="toggleAuthMode()">Login here</span>`;
}

function handleAuth(e) {
    e.preventDefault();
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value;
    let users = JSON.parse(localStorage.getItem(USERS_KEY)) || [];

    if (isLoginMode) {
        const found = users.find(u => u.username === user && u.password === pass);
        if (found) {
            currentUser = user;
            localStorage.setItem(SESSION_KEY, JSON.stringify(currentUser));
            updateAuthUI();
        } else {
            alert('Invalid credentials!');
        }
    } else {
        if (users.find(u => u.username === user)) return alert('Username already exists!');
        users.push({ username: user, password: pass });
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        alert('Registration successful! Please log in.');
        toggleAuthMode();
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem(SESSION_KEY);
    updateAuthUI();
    renderPosts();
}

// Post Engine (CRUD)
function showEditor(postId = null) {
    if (!currentUser) return alert("Please log in first!");
    document.getElementById('editorSection').classList.remove('hidden');
    
    if (postId) {
        const posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
        const post = posts.find(p => p.id === postId);
        document.getElementById('postId').value = post.id;
        document.getElementById('postTitle').value = post.title;
        document.getElementById('postContent').value = post.content;
        document.getElementById('editorTitle').innerText = "Edit Post";
    } else {
        document.getElementById('postForm').reset();
        document.getElementById('postId').value = '';
        document.getElementById('editorTitle').innerText = "Create New Post";
    }
}

function hideEditor() {
    document.getElementById('editorSection').classList.add('hidden');
}

function handlePostSubmit(e) {
    e.preventDefault();
    const id = document.getElementById('postId').value;
    const title = document.getElementById('postTitle').value;
    const content = document.getElementById('postContent').value;
    let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];

    if (id) {
        // Edit Mode
        posts = posts.map(p => p.id === parseInt(id) ? { ...p, title, content } : p);
    } else {
        // Create Mode
        posts.unshift({
            id: Date.now(),
            title,
            content,
            author: currentUser,
            likes: [],
            comments: []
        });
    }
    
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    hideEditor();
    renderPosts();
}

function deletePost(id) {
    let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
    posts = posts.filter(p => p.id !== id);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    renderPosts();
}

// Likes and Comments
function toggleLike(id) {
    if (!currentUser) return alert("Please log in to like posts!");
    let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
    const post = posts.find(p => p.id === id);
    
    const index = post.likes.indexOf(currentUser);
    if (index > -1) post.likes.splice(index, 1);
    else post.likes.push(currentUser);

    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    renderPosts();
}

function addComment(e, postId) {
    e.preventDefault();
    if (!currentUser) return alert("Please log in to comment!");
    const input = document.getElementById(`commentInput-${postId}`);
    const text = input.value.trim();
    if (!text) return;

    let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
    const post = posts.find(p => p.id === postId);
    
    post.comments.push({
        id: Date.now(),
        author: currentUser,
        text: text
    });

    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    renderPosts();
}

function deleteComment(postId, commentId) {
    let posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
    const post = posts.find(p => p.id === postId);
    post.comments = post.comments.filter(c => c.id !== commentId);
    localStorage.setItem(POSTS_KEY, JSON.stringify(posts));
    renderPosts();
}

// Rendering Core Template
function renderPosts() {
    const container = document.getElementById('postsContainer');
    const posts = JSON.parse(localStorage.getItem(POSTS_KEY)) || [];
    
    if (posts.length === 0) {
        container.innerHTML = `<p style="color: var(--text-muted)">No stories shared yet. Be the first!</p>`;
        return;
    }

    container.innerHTML = posts.map(post => {
        const isAuthor = currentUser === post.author;
        const hasLiked = post.likes.includes(currentUser);
        
        const commentsHTML = post.comments.map(c => `
            <div class="comment">
                <strong>${c.author}:</strong> ${c.text}
                ${currentUser === c.author || isAuthor ? 
                    `<span style="color:red; cursor:pointer; float:right; font-size:0.8rem" onclick="deleteComment(${post.id}, ${c.id})">Delete</span>` : ''}
            </div>
        `).join('');

        return `
            <article class="post-card">
                <h3>${post.title}</h3>
                <div class="post-meta">By ${post.author}</div>
                <p>${post.content}</p>
                
                <div class="post-actions">
                    <button class="btn btn-secondary" onclick="toggleLike(${post.id})">
                        ${hasLiked ? '❤️' : '🤍'} (${post.likes.length})
                    </button>
                    ${isAuthor ? `
                        <button class="btn btn-secondary" onclick="showEditor(${post.id})">Edit</button>
                        <button class="btn btn-danger" onclick="deletePost(${post.id})">Delete</button>
                    ` : ''}
                </div>

                <div class="comments-section">
                    <h4>Comments (${post.comments.length})</h4>
                    <div class="comments-list">${commentsHTML}</div>
                    ${currentUser ? `
                        <form onsubmit="addComment(event, ${post.id})" style="display:flex; gap:0.5rem; margin-top:0.5rem">
                            <input type="text" id="commentInput-${post.id}" placeholder="Write a comment..." required style="margin:0">
                            <button type="submit" class="btn">Send</button>
                        </form>
                    ` : ''}
                </div>
            </article>
        `;
    }).join('');
}