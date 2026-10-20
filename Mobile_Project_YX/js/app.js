let pageHistory = [];
let currentPage = 'index';
let currentProduct = null;
let currentOrderId = null;

function switchPage(pageName) {
    if (currentPage !== pageName) {
        pageHistory.push(currentPage);
    }
    
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    
    document.getElementById(`page-${pageName}`).classList.add('active');
    
    document.querySelectorAll('.nav-item').forEach(item => {
        item.classList.remove('active');
    });
    
    const navItem = document.querySelector(`.nav-item[data-page="${pageName}"]`);
    if (navItem) {
        navItem.classList.add('active');
    }
    
    currentPage = pageName;
    
    if (pageName === 'favorites' && typeof renderFavorites === 'function') {
        renderFavorites();
    }
}

function goBack() {
    if (pageHistory.length > 0) {
        const prevPage = pageHistory.pop();
        switchPage(prevPage);
        if (pageHistory.length > 0) {
            pageHistory.pop();
        }
    } else {
        switchPage('index');
    }
}

function logout() {
    if (confirm('确定要退出登录吗？')) {
        window.location.href = 'login.html';
    }
}

function showToast(message) {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.classList.remove('hidden');
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 2000);
}

function toggleFaq(el) {
    const answer = el.nextElementSibling;
    answer.classList.toggle('show');
    const icon = el.querySelector('i');
    icon.classList.toggle('ri-arrow-down-s-line');
    icon.classList.toggle('ri-arrow-up-s-line');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function showEditModal() {
    document.getElementById('edit-modal').classList.add('show');
}

function showLogoutModal() {
    document.getElementById('logout-modal').classList.add('show');
}

function saveEdit() {
    closeModal('edit-modal');
    showToast('保存成功');
}

function confirmLogout() {
    closeModal('logout-modal');
    showToast('已退出登录');
    setTimeout(() => {
        switchPage('index');
    }, 1000);
}