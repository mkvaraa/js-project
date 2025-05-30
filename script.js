document.addEventListener('DOMContentLoaded', function() {
    
    const ADMIN_CREDENTIALS = {
        login: 'gvc_admin_access',
        password: 'password_for_gvc_228'
    };

    const elements = {
        form: document.getElementById('user-form'),
        usersList: document.getElementById('users-list'),
        loginModal: document.getElementById('login-modal'),
        loginSubmit: document.getElementById('login-submit'),
        loginUsername: document.getElementById('login-username'),
        loginPassword: document.getElementById('login-password'),
        loginError: document.getElementById('login-error'),
        loginButton: document.querySelector('.login-button'),
        addButton: document.querySelector('.add-button'),
        categoryFilter: document.getElementById('category-filter'),
        resetFiltersBtn: document.getElementById('reset-filters'),
        searchInput: document.getElementById('search-input'),
        nameInput: document.getElementById('name'),
        telegramInput: document.getElementById('telegram')
    };

    const state = {
        users: [],
        editIndex: null,
        currentFilter: 'all',
        searchQuery: '',
        isAuthenticated: false
    };

    init();

    function init() {
        checkAuth();
        setupEventListeners();
        loadUsers();
    }

    function checkAuth() {
        state.isAuthenticated = localStorage.getItem('isAuthenticated') === 'true';
        updateUI();
    }

    function updateUI() {
        if (state.isAuthenticated) {
            document.body.classList.add('authenticated');
            document.body.classList.remove('locked');
            elements.loginModal.style.display = 'none';
            elements.loginButton.textContent = 'Выйти';
            renderUsers();
        } else {
            document.body.classList.remove('authenticated');
            document.body.classList.add('locked');
            elements.loginButton.textContent = 'Вход';
            renderUsersReadonly();
        }
    }

    function setupEventListeners() {
    // Обработчик для кнопки входа/выхода
    elements.loginButton.addEventListener('click', function(e) {
        e.stopPropagation();
        if (state.isAuthenticated) {
            logout();
        } else {
            elements.loginModal.style.display = 'block';
        }
    });

    
    elements.loginSubmit.addEventListener('click', handleLogin);
    elements.loginPassword.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') handleLogin();
    });

    elements.form.addEventListener('submit', handleFormSubmit);
    elements.categoryFilter.addEventListener('change', handleFilterChange);
    elements.resetFiltersBtn.addEventListener('click', resetFilters);
    elements.searchInput.addEventListener('input', handleSearch);

    document.addEventListener('mousedown', function (e) {
    const modal = elements.loginModal;
    const isInside = modal.querySelector('.modal-content').contains(e.target);
    const isLoginBtn = elements.loginButton.contains(e.target);

    if (!isInside && !isLoginBtn) {
        modal.style.display = 'none';
    }
});



    
    elements.loginModal.addEventListener('click', function(e) {
        e.stopPropagation();
    });
}

    function handleLogin() {
        const username = elements.loginUsername.value.trim();
        const password = elements.loginPassword.value.trim();

        if (username === ADMIN_CREDENTIALS.login && password === ADMIN_CREDENTIALS.password) {
            state.isAuthenticated = true;
            localStorage.setItem('isAuthenticated', 'true');
            elements.loginError.textContent = '';
            elements.loginModal.style.display = 'none';
            elements.loginUsername.value = '';
            elements.loginPassword.value = '';
            updateUI();
        } else {
            elements.loginError.textContent = 'Неверный логин или пароль';
        }
    }

    function logout() {
        state.isAuthenticated = false;
        localStorage.removeItem('isAuthenticated');
        updateUI();
    }

    function loadUsers() {
        if (localStorage.getItem('volleyballUsers')) {
            state.users = JSON.parse(localStorage.getItem('volleyballUsers'));
        }
        renderUsers();
    }

  function isUserUnique(telegram, excludeIndex = null) {
    return !state.users.some((user, index) => {
        if (excludeIndex !== null && index === excludeIndex) return false;

        const sameTelegram = (user.telegram || '').trim().toLowerCase() === (telegram || '').trim().toLowerCase();

        return sameTelegram;
    });
}




    function handleFormSubmit(e) {
        e.preventDefault();
        
        if (!state.isAuthenticated) return;
        
        const name = elements.nameInput.value.trim();
        const telegram = elements.telegramInput.value.trim();
        

        if (!isUserUnique(telegram, state.editIndex)) {
            alert('Пользователь с таким Телеграм-ником уже существует!\nТелеграм должны быть уникальными.');
            return;
        }
        
        const userData = {
            name: name,
            telegram: telegram,
            lessons: parseInt(document.getElementById('lessons').value),
            purchaseDate: document.getElementById('purchase-date').value,
            category: document.getElementById('category').value,
            expirationDate: calculateExpirationDate(document.getElementById('purchase-date').value)
        };

        if (state.editIndex !== null) {
            state.users[state.editIndex] = userData;
            state.editIndex = null;
            elements.addButton.textContent = 'Добавить';
        } else {
            state.users.push(userData);
        }

        saveUsers();
        renderUsers();
        elements.form.reset();
    }

    function handleFilterChange() {
        state.currentFilter = this.value;
        renderUsers();
    }

    function handleSearch() {
        state.searchQuery = this.value.toLowerCase();
        renderUsers();
    }

    function resetFilters() {
        elements.categoryFilter.value = 'all';
        elements.searchInput.value = '';
        state.currentFilter = 'all';
        state.searchQuery = '';
        renderUsers();
    }

    function calculateExpirationDate(purchaseDate) {
        if (!purchaseDate) return '';
        const date = new Date(purchaseDate);
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    }

    function saveUsers() {
        localStorage.setItem('volleyballUsers', JSON.stringify(state.users));
    }

    function renderUsers() {
        elements.usersList.innerHTML = '';
        
        const filteredUsers = state.users.filter(user => {
            const matchesCategory = state.currentFilter === 'all' || user.category === state.currentFilter;
            const matchesSearch = state.searchQuery === '' || 
                               user.name.toLowerCase().includes(state.searchQuery) || 
                               (state.isAuthenticated && user.telegram && user.telegram.toLowerCase().includes(state.searchQuery));
            return matchesCategory && matchesSearch;
        });
        
        if (filteredUsers.length === 0) {
            elements.usersList.innerHTML = '<li class="no-results">Нет пользователей по выбранным критериям</li>';
            return;
        }
        
        filteredUsers.forEach((user, index) => {
            const li = document.createElement('li');
            li.className = 'user-item';
            
            li.innerHTML = `
                <div class="user-field">
                    <strong>Имя Фамилия</strong>
                    ${user.name}
                </div>
                <div class="user-field">
                    <strong>Телеграм</strong>
                    ${state.isAuthenticated ? user.telegram : 'Скрыто'}
                </div>
                <div class="user-field">
                    <strong>Занятий</strong>
                    ${user.lessons}
                </div>
                <div class="user-field">
                    <strong>Дата покупки</strong>
                    ${formatDate(user.purchaseDate)}
                </div>
                <div class="user-field">
                    <strong>Категория</strong>
                    ${getCategoryName(user.category)}
                </div>
                <div class="user-field">
                    <strong>Истекает</strong>
                    ${formatDate(user.expirationDate)}
                </div>
                ${state.isAuthenticated ? `
                <div class="user-actions">
                    <button class="edit-btn" data-index="${getOriginalIndex(index)}">✏️</button>
                    <button class="delete-btn" data-index="${getOriginalIndex(index)}">🗑️</button>
                </div>
                ` : ''}
            `;
            
            elements.usersList.appendChild(li);
        });

        if (state.isAuthenticated) {
            setupActionButtons();
        }
    }

    function renderUsersReadonly() {
        elements.usersList.innerHTML = '';
        
        const filteredUsers = state.users.filter(user => {
            const matchesCategory = state.currentFilter === 'all' || user.category === state.currentFilter;
            const matchesSearch = state.searchQuery === '' || 
                               user.name.toLowerCase().includes(state.searchQuery);
            return matchesCategory && matchesSearch;
        });
        
        if (filteredUsers.length === 0) {
            elements.usersList.innerHTML = '<li class="no-results">Нет пользователей по выбранным критериям</li>';
            return;
        }
        
        filteredUsers.forEach((user) => {
            const li = document.createElement('li');
            li.className = 'user-item';
            
            li.innerHTML = `
                <div class="user-field">
                    <strong>Имя Фамилия</strong>
                    ${user.name}
                </div>
                <div class="user-field">
                    <strong>Телеграм</strong>
                    Скрыто
                </div>
                <div class="user-field">
                    <strong>Занятий</strong>
                    ${user.lessons}
                </div>
                <div class="user-field">
                    <strong>Дата покупки</strong>
                    ${formatDate(user.purchaseDate)}
                </div>
                <div class="user-field">
                    <strong>Категория</strong>
                    ${getCategoryName(user.category)}
                </div>
                <div class="user-field">
                    <strong>Истекает</strong>
                    ${formatDate(user.expirationDate)}
                </div>
            `;
            
            elements.usersList.appendChild(li);
        });
    }

    function setupActionButtons() {
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                editUser(parseInt(this.dataset.index));
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                deleteUser(parseInt(this.dataset.index));
            });
        });
    }

    function getOriginalIndex(filteredIndex) {
        if (state.currentFilter === 'all' && state.searchQuery === '') return filteredIndex;
        
        const filteredUser = state.users.filter(user => {
            const matchesCategory = state.currentFilter === 'all' || user.category === state.currentFilter;
            const matchesSearch = state.searchQuery === '' || 
                               user.name.toLowerCase().includes(state.searchQuery) || 
                               (state.isAuthenticated && user.telegram && user.telegram.toLowerCase().includes(state.searchQuery));
            return matchesCategory && matchesSearch;
        })[filteredIndex];
        
        return state.users.findIndex(u => u === filteredUser);
    }

    function editUser(index) {
        const user = state.users[index];
        document.getElementById('name').value = user.name;
        document.getElementById('telegram').value = user.telegram;
        document.getElementById('lessons').value = user.lessons;
        document.getElementById('purchase-date').value = user.purchaseDate;
        document.getElementById('category').value = user.category;
        
        state.editIndex = index;
        elements.addButton.textContent = 'Сохранить';
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    function deleteUser(index) {
        if (confirm('Удалить этого пользователя?')) {
            state.users.splice(index, 1);
            saveUsers();
            renderUsers();
        }
    }

    function formatDate(dateString) {
        if (!dateString) return '—';
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('ru-RU', options);
    }

    function getCategoryName(category) {
        const categories = {
            'child_male': 'Дет.Мал',
            'child_female': 'Дет.Дев',
            'general': 'Общая гр.',
            'amateurs': 'Любители',
            'advanced': 'Продвинутые'
        };
        return categories[category] || '—';
    }
});
