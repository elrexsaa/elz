// Cek login
if (!localStorage.getItem('loggedIn')) {
    window.location.href = 'index.html';
}

// Logout
document.getElementById('logout').addEventListener('click', () => {
    localStorage.removeItem('loggedIn');
    window.location.href = 'index.html';
});

// Tema gelap/terang
document.getElementById('themeToggle').addEventListener('click', () => {
    document.body.classList.toggle('dark');
    const btn = document.getElementById('themeToggle');
    btn.textContent = document.body.classList.contains('dark') ? 'Tema Terang' : 'Tema Gelap';
});

// Data puisi (simulasi dengan localStorage)
let poems = JSON.parse(localStorage.getItem('poems')) || [
    { id: 1, title: 'Puisi Pertama', content: 'Ini adalah contoh puisi pertama.', category: 'Romantis' },
    { id: 2, title: 'Puisi Kedua', content: 'Ini adalah contoh puisi kedua.', category: 'Inspirasi' }
];

// Render puisi
function renderPoems(filter = '') {
    const container = document.getElementById('poemsContainer');
    container.innerHTML = '';
    poems.filter(p => p.title.toLowerCase().includes(filter.toLowerCase()) || p.content.toLowerCase().includes(filter.toLowerCase())).forEach(poem => {
        const div = document.createElement('div');
        div.className = 'bg-white p-4 rounded-lg shadow-md';
        div.innerHTML = `
            <h4 class="text-lg font-bold">${poem.title}</h4>
            <p class="text-sm text-gray-600">${poem.category}</p>
            <p class="mt-2">${poem.content}</p>
            <div class="mt-4 flex space-x-2">
                <button onclick="editPoem(${poem.id})" class="px-3 py-1 bg-yellow-500 text-white rounded">Edit</button>
                <button onclick="deletePoem(${poem.id})" class="px-3 py-1 bg-red-500 text-white rounded">Hapus</button>
                <button onclick="saveAsImage(${poem.id})" class="px-3 py-1 bg-purple-500 text-white rounded">Simpan Gambar</button>
                <button onclick="sharePoem('${poem.title}', '${poem.content}')" class="px-3 py-1 bg-blue-500 text-white rounded">Share</button>
            </div>
        `;
        container.appendChild(div);
    });
}

// Pencarian
document.getElementById('search').addEventListener('input', (e) => renderPoems(e.target.value));

// Tambah puisi
document.getElementById('addPoem').addEventListener('click', () => {
    document.getElementById('modalTitle').textContent = 'Tambah Puisi';
    document.getElementById('poemForm').reset();
    document.getElementById('poemModal').classList.remove('hidden');
});

// Edit puisi
function editPoem(id) {
    const poem = poems.find(p => p.id === id);
    document.getElementById('poemTitle').value = poem.title;
    document.getElementById('poemContent').value = poem.content;
    document.getElementById('poemCategory').value = poem.category;
    document.getElementById('modalTitle').textContent = 'Edit Puisi';
    document.getElementById('poemModal').classList.remove('hidden');
    document.getElementById('poemForm').dataset.editId = id;
}

// Simpan puisi
document.getElementById('poemForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const title = document.getElementById('poemTitle').value;
    const content = document.getElementById('poemContent').value;
    const category = document.getElementById('poemCategory').value;
    const editId = document.getElementById('poemForm').dataset.editId;
    if (editId) {
        const index = poems.findIndex(p => p.id == editId);
        poems[index] = { ...poems[index], title, content, category };
    } else {
        poems.push({ id: Date.now(), title, content, category });
    }
    localStorage.setItem('poems', JSON.stringify(poems));
    renderPoems();
    document.getElementById('poemModal').classList.add('hidden');
});

// Hapus puisi
function deletePoem(id) {
    poems = poems.filter(p => p.id !== id);
    localStorage.setItem('poems', JSON.stringify(poems));
    renderPoems();
}

// Simpan sebagai gambar
function saveAsImage(id) {
    const poemDiv = document.querySelector(`[onclick="editPoem(${id})"]`).parentElement;
    html2canvas(poemDiv).then(canvas => {
        const link = document.createElement('a');
        link.download = `puisi-${id}.png`;
        link.href = canvas.toDataURL();
        link.click();
    });
}

// Share puisi
function sharePoem(title, content) {
    const text = `${title}\n\n${content}`;
    if (navigator.share) {
        navigator.share({ title, text });
    } else {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`);
    }
}

// Tutup modal
document.getElementById('closeModal').addEventListener('click', () => {
    document.getElementById('poemModal').classList.add('hidden');
});

// Render awal
renderPoems();
