// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    const app = document.getElementById('app');
    const addModal = document.getElementById('addModal');
    const addForm = document.getElementById('addForm');
    const addPoemBtn = document.getElementById('addPoemBtn');
    const closeAddModal = document.getElementById('closeAddModal');
    const logoutBtn = document.getElementById('logoutBtn');
    const searchInput = document.getElementById('searchInput');
    const poemList = document.getElementById('poemList');
    const bgAudio = document.getElementById('bgAudio');
    const confettiCanvas = document.getElementById('confetti');
    const exportBtn = document.getElementById('exportBtn');
    const importBtn = document.getElementById('importBtn');
    const importModal = document.getElementById('importModal');
    const importFile = document.getElementById('importFile');
    const confirmImport = document.getElementById('confirmImport');
    const closeImportModal = document.getElementById('closeImportModal');
    const loading = document.getElementById('loading');

    let poems = JSON.parse(localStorage.getItem('poems')) || [];
    let likes = JSON.parse(localStorage.getItem('likes')) || {};
    let searchTimeout;
    let hasGestured = false;

    // Check login
    if (!localStorage.getItem('loggedIn')) {
        window.location.href = 'login.html';
        return;
    }

    // Auto-play audio on first gesture
    document.addEventListener('click', () => {
        if (!hasGestured) {
            hasGestured = true;
            bgAudio.play().catch(() => console.log('Audio requires interaction'));
        }
    }, { once: true });

    // Confetti (sama seperti sebelumnya)
    function createConfetti(x, y) {
        const canvas = confettiCanvas;
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
        canvas.classList.remove('hidden');
        const particles = [];
        for (let i = 0; i < 25; i++) {
            particles.push({
                x, y,
                vx: (Math.random() - 0.5) * 12,
                vy: Math.random() * -8 - 8,
                color: `hsl(${Math.random() * 60 + 240}, 70%, 60%)`,
                life: 120
            });
        }
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25;
                p.life--;
                if (p.life > 0) {
                    ctx.fillStyle = p.color;
                    ctx.fillRect(p.x, p.y, 5, 5);
                }
            });
            particles = particles.filter(p => p.life > 0);
            if (particles.length > 0) requestAnimationFrame(animate);
            else canvas.classList.add('hidden');
        }
        animate();
    }

    // Render with loading
    function renderPoems(filteredPoems = poems) {
        loading.classList.remove('hidden');
        poemList.innerHTML = '';
        setTimeout(() => {
            filteredPoems.forEach((poem, index) => {
                const card = document.createElement('div');
                card.className = 'poem-card stagger flip-card';
                card.style.animationDelay = `${index * 0.15}s`;
                card.dataset.id = poem.id;
                card.innerHTML = `
                    <div class="swipe-delete" onclick="deletePoem(${poem.id})">Hapus</div>
                    <div class="flip-card-inner">
                        <div class="flip-card-front">
                            <h3 class="poem-title">${poem.title}</h3>
                            <p class="poem-content">${poem.content}</p>
                        </div>
                        <div class="flip-card-back">
                            <small>${poem.date}</small>
                            <button class="like-btn ${likes[poem.id] ? 'liked' : ''}" onclick="toggleLike(${poem.id}, event)">
                                ❤️ ${likes[poem.id] || 0} Like
                            </button>
                        </div>
                    </div>
                `;
                poemList.appendChild(card);
                requestAnimationFrame(() => card.classList.remove('stagger'));
            });
            loading.classList.add('hidden');
        }, 500);
    }

    // Swipe delete (mobile)
    let startX = 0;
    poemList.addEventListener('touchstart', (e) => startX = e.touches[0].clientX);
    poemList.addEventListener('touchend', (e) => {
        const endX = e.changedTouches[0].clientX;
        const diff = startX - endX;
        if (Math.abs(diff) > 50) { // Threshold swipe left
            const card = e.target.closest('.poem-card');
            if (card && diff > 0) {
                card.classList.add('swiped');
                setTimeout(() => deletePoem(card.dataset.id), 2000); // Auto delete after show
            }
        }
    });

    window.deletePoem = (id) => {
        if (confirm('Hapus puisi ini?')) {
            poems = poems.filter(p => p.id != id);
            delete likes[id];
            localStorage.setItem('poems', JSON.stringify(poems));
            localStorage.setItem('likes', JSON.stringify(likes));
            renderPoems();
        }
    };

    // Export/Import
    exportBtn.addEventListener('click', () => {
        const data = { poems, likes };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'puisi-backup.json';
        a.click();
        URL.revokeObjectURL(url);
    });

    importBtn.addEventListener('click', () => importModal.classList.remove('hidden'));

    closeImportModal.addEventListener('click', () => {
        importModal.classList.add('hidden');
        importFile.value = '';
    });

    confirmImport.addEventListener('click', () => {
        const file = importFile.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    poems = data.poems || [];
                    likes = data.likes || {};
                    localStorage.setItem('poems', JSON.stringify(poems));
                    localStorage.setItem('likes', JSON.stringify(likes));
                    renderPoems();
                    importModal.classList.add('hidden');
                    alert('Import berhasil!');
                } catch (err) {
                    alert('File JSON tidak valid!');
                }
            };
            reader.readAsText(file);
        }
    });

    // Search debounce (sama)
    searchInput.addEventListener('input', (e) => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            const query = e.target.value.toLowerCase();
            const filtered = poems.filter(poem => 
                poem.title.toLowerCase().includes(query) || poem.content.toLowerCase().includes(query)
            );
            renderPoems(filtered);
        }, 300);
    });

    // Add poem (sama)
    addPoemBtn.addEventListener('click', () => addModal.classList.remove('hidden'));
    closeAddModal.addEventListener('click', () => {
        addForm.reset();
        setTimeout(() => addModal.classList.add('hidden'), 150);
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
        setTimeout(() => addModal.classList.add('hidden'), 150);
    });

    // Logout
    logoutBtn.addEventListener('click', () => {
        localStorage.removeItem('loggedIn');
        bgAudio.pause();
        window.location.href = 'login.html';
    });

    // Toggle like (sama)
    window.toggleLike = (id, event) => {
        if (!likes[id]) likes[id] = 0;
        likes[id]++;
        localStorage.setItem('likes', JSON.stringify(likes));
        const rect = event.target.getBoundingClientRect();
        createConfetti(rect.left + rect.width / 2, rect.top + rect.height / 2);
        renderPoems();
    };

    // Initial render
    renderPoems();
});
