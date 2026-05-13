document.addEventListener('DOMContentLoaded', () => {
    const linksContainer = document.getElementById('links-container');
    const cardsContainer = document.getElementById('cards-container');
    const adminDashboard = document.getElementById('admin-dashboard');
    const adminLinksList = document.getElementById('admin-links-list');
    const adminLayout = document.querySelector('.admin-layout');
    const logo = document.querySelector('.logo');
    
    const addBtn = document.getElementById('add-link-btn');
    const closeAdmin = document.getElementById('close-admin');
    const closeForm = document.getElementById('close-form');
    const addForm = document.getElementById('add-link-form');
    const formTitle = document.getElementById('form-title');
    const editIdInput = document.getElementById('edit-id');
    const island = document.getElementById('dynamic-island');
    const islandText = document.getElementById('island-text');
    const islandIcon = document.getElementById('island-icon');

    let allLinks = [];
    let clickCount = 0;

    function renderIcon(iconName, className = '') {
        if (!iconName) return '';
        const isUrl = iconName.startsWith('http') || iconName.startsWith('/') || iconName.includes('.');
        if (isUrl) {
            return `<img src="${iconName}" class="custom-icon ${className}" alt="icon" onerror="this.src='https://api.iconify.design/lucide:link.svg'">`;
        }
        return `<i data-lucide="${iconName}" class="${className}"></i>`;
    }

    function showNotification(text, type = 'success', icon = 'check') {
        islandText.innerText = text;
        islandIcon.setAttribute('data-lucide', icon);
        island.className = `active expanded ${type}`;
        lucide.createIcons();
        setTimeout(() => {
            island.classList.remove('active', 'expanded');
        }, 3000);
    }

    logo.addEventListener('click', () => {
        clickCount++;
        if (clickCount === 3) {
            adminDashboard.classList.add('active');
            clickCount = 0;
            showNotification('Admin Mode Enabled', 'success', 'shield-check');
            renderAdminList();
        }
        setTimeout(() => clickCount = 0, 1000);
    });

    closeAdmin.addEventListener('click', () => adminDashboard.classList.remove('active'));
    closeForm.addEventListener('click', () => adminLayout.classList.remove('editing'));

    async function fetchLinks() {
        try {
            const response = await fetch('/api/links');
            const data = await response.json();
            allLinks = data;
            renderPublicView(data);
            if (adminDashboard.classList.contains('active')) renderAdminList();
        } catch (error) {
            console.error('Error fetching links:', error);
        }
    }

    function renderPublicView(data) {
        linksContainer.innerHTML = '';
        cardsContainer.innerHTML = '';

        data.forEach(item => {
            if (item.type === 'link') {
                const linkEl = document.createElement('a');
                linkEl.href = item.url;
                linkEl.className = 'link-item';
                linkEl.target = '_blank';
                linkEl.innerHTML = `
                    <span>${item.title}</span>
                    ${renderIcon(item.icon || 'arrow-right')}
                `;
                linksContainer.appendChild(linkEl);
            } else if (item.type === 'card') {
                const cardEl = document.createElement('a');
                cardEl.href = item.url || '#';
                cardEl.className = 'card-item';
                
                const desc = 'Premium Project';
                cardEl.innerHTML = `
                    <div class="card-icon">${renderIcon(item.icon || 'layout')}</div>
                    <div class="card-info">
                        <h3>${item.title}</h3>
                        <p class="card-desc">${desc}</p>
                    </div>
                `;
                if (item.image_url) {
                    cardEl.style.backgroundImage = `linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.8)), url('${item.image_url}')`;
                    cardEl.classList.add('has-bg');
                }
                cardsContainer.appendChild(cardEl);
            }
        });
        lucide.createIcons();
    }

    function renderAdminList() {
        adminLinksList.innerHTML = '';
        allLinks.forEach(item => {
            const adminItem = document.createElement('div');
            adminItem.className = 'admin-item';
            adminItem.innerHTML = `
                <div class="admin-item-info">
                    <div class="admin-item-icon">
                        ${renderIcon(item.icon || 'link')}
                    </div>
                    <div class="admin-item-text">
                        <h4>${item.title}</h4>
                        <p>${item.url}</p>
                    </div>
                </div>
                <div class="admin-item-actions">
                    <button class="edit-btn" onclick="window.editLink('${item.id}')"><i data-lucide="edit-3"></i></button>
                    <button class="delete-btn" onclick="window.deleteLink('${item.id}')"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            adminLinksList.appendChild(adminItem);
        });
        lucide.createIcons();
    }

    // Helper to convert file to Base64
    const toBase64 = file => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });

    addForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        let url = document.getElementById('url').value;
        if (url && !url.startsWith('http') && !url.startsWith('mailto:')) {
            url = 'https://' + url;
        }

        const editId = editIdInput.value.trim();
        const payload = {
            title: document.getElementById('title').value,
            url: url,
            type: document.getElementById('type').value,
            icon: document.getElementById('icon').value
        };
        
        const imageFile = document.getElementById('image-file').files[0];
        if (imageFile) {
            payload.image_base64 = await toBase64(imageFile);
        }

        const endpoint = editId ? `/api/links/${editId}` : '/api/links';

        try {
            const response = await fetch(endpoint, { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (response.ok) {
                adminLayout.classList.remove('editing');
                addForm.reset();
                document.getElementById('image-preview').style.display = 'none';
                showNotification(editId ? 'Link Updated' : 'Link Created', 'success', 'check-circle');
                fetchLinks();
            } else {
                const err = await response.json();
                showNotification(err.error || 'Failed to save', 'error', 'alert-circle');
            }
        } catch (error) {
            showNotification('Server Error', 'error', 'wifi-off');
        }
    });

    document.getElementById('image-file').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('image-preview');
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                preview.src = e.target.result;
                preview.style.display = 'block';
            };
            reader.readAsDataURL(file);
        }
    });

    window.editLink = (id) => {
        const item = allLinks.find(l => l.id.toString() === id.toString());
        if (!item) return;

        formTitle.innerText = 'Edit Link';
        editIdInput.value = item.id;
        document.getElementById('title').value = item.title;
        document.getElementById('url').value = item.url;
        document.getElementById('type').value = item.type;
        document.getElementById('icon').value = item.icon || '';
        
        const preview = document.getElementById('image-preview');
        if (item.image_url) {
            preview.src = item.image_url;
            preview.style.display = 'block';
        } else {
            preview.style.display = 'none';
        }
        adminLayout.classList.add('editing');
    };

    window.deleteLink = async (id) => {
        if (!confirm('Are you sure?')) return;
        try {
            const response = await fetch(`/api/links/${id}`, { method: 'DELETE' });
            if (response.ok) fetchLinks();
        } catch (error) {}
    };

    addBtn.addEventListener('click', () => {
        formTitle.innerText = 'Add New Link';
        editIdInput.value = '';
        addForm.reset();
        document.getElementById('image-preview').style.display = 'none';
        adminLayout.classList.add('editing');
    });

    fetchLinks();
});
