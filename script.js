// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const loginModal = document.getElementById('loginModal');
    const app = document.getElementById('app');
    const loginForm = document.getElementById('loginForm');
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addForm');
    const addPoemBtn = document.getElementById('addPoemBtn');
    const closeAddModal = document.getElementById('closeAddModal');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const poemList = document.getElementById('poemList');
    const bgAudio = document.getElementById('bgAudio');

    let poems = JSON.parse(localStorage.getItem('poems')) || [];
    let likes = JSON.parse(localStorage.getItem('likes')) || {};

    // Login interaktif
    const usernameInput = document.getElementById('username');
    const passwordInput = document.getElementById('password');
    const togglePassword = document.getElementById('togglePassword');
    const loginBtn = document.getElementById('loginBtn');
    const errorMsg = document.getElementById('errorMsg');
    const btnText = document.querySelector('.btn-text');
    const spinner = document.querySelector('.spinner');

    // Floating labels
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => {
            if (input.value) {
                input.classList.add('valid');
            } else {
                input.classList.remove('valid');
            }
        });
    });

    // Toggle password
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        togglePassword.textContent = passwordInput.type === 'password' ? '👁️' : '🙈';
    });

    // Validasi real-time
    [usernameInput, passwordInput].forEach(input => {
        input.addEventListener('blur', () => {
            if (!input.value) {
                input.style.borderColor = '#ef4444';
            } else {
                input.style.borderColor = 'var(--border)';
            }
        });
        input.addEventListener('focus', () => {
            input.style.borderColor = 'var(--accent)';
        });
    });

    // Demo login
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = usernameInput.value;
        const password = passwordInput.value;

        // Reset error
        errorMsg.classList.add('hidden');

        // Simulate loading
        loginBtn.disabled = true;
        btnText.style.opacity = '0';
        spinner.classList.remove('hidden');

        setTimeout(() => {
            if (username === 'admin' && password === 'puisi123') {
                loginModal.classList.add('hidden');
                app.classList.remove('hidden');
                setTimeout(() => renderPoems(), 200);
                bgAudio.play().catch(() => console.log('Audio play blocked; user must interact'));
            } else {
                errorMsg.classList.remove('hidden');
                loginBtn.disabled = false;
                btnText.style.opacity = '1';
                spinner.classList.add('hidden');
            }
        }, 1500); // Loading 1.5s untuk demo
    });

    // Add poem
    addPoemBtn.addEventListener('click', () => {
        addModal.classList.remove('hidden');
    });

    closeAddModal.addEventListener('click', () => {
        addForm.reset();
        setTimeout(() => addModal.classList.add('hidden'), 100); // Smooth close
    });

    addForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('title').value;
        const content = document.getElementById('content').value;
        const newPoem = { id: Date.now(), title, content, date: new Date().toLocaleDateString('id-ID') };
        poems.unshift(newPoem);
        localStorage.setItem('poems', JSON.stringify(poems));
        renderPoems();
        addForm.reset();
        setTimeout(() => addModal.classList.add('hidden'), 100);
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        setTimeout(() => {
            app.classList.add('hidden');
            loginModal.classList.remove('hidden');
        }, 200);
        bgAudio.pause();
    });

    // Search
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();
        const filtered = poems.filter(poem => 
            poem.title.toLowerCase().includes(query) || poem.content.toLowerCase().includes(query)
        );
        renderPoems(filtered);
    });

    // Render poems with stagger animation
    function renderPoems(filteredPoems = poems) {
        poemList.innerHTML = '';
        filteredPoems.forEach((poem, index) => {
            const card = document.createElement('div');
            card.className = 'poem-card stagger';
            card.style.animationDelay = `${index * 0.1}s`; // Stagger delay
            card.innerHTML = `
                <h3 class="poem-title">${poem.title}</h3>
                <p class="poem-content">${poem.content}</p>
                <small style="color: var(--text-secondary);">${poem.date}</small>
                <br>
                <button class="like-btn ${likes[poem.id] ? 'liked' : ''}" onclick="toggleLike(${poem.id})">
                    ❤️ ${likes[poem.id] || 0} Like
                </button>
            `;
            poemList.appendChild(card);

            // Trigger animation with RAF for smoothness
            requestAnimationFrame(() => {
                card.classList.remove('stagger');
            });
        });
    }

    // Toggle like (global function for onclick)
    window.toggleLike = (id) => {
        if (!likes[id]) likes[id] = 0;
        likes[id]++;
        localStorage.setItem('likes', JSON.stringify(likes));
        renderPoems(); // Re-render to update count
    };

    // Initial render if logged in
    if (localStorage.getItem('loggedIn')) {
        app.classList.remove('hidden');
        renderPoems();
    }
});
