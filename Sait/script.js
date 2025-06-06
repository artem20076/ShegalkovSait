const API_BASE_URL = 'http://localhost:8082/component';

document.addEventListener('DOMContentLoaded', () => {
    // Инициализация элементов
    const homePage = document.getElementById('homePage');
    const equipmentPage = document.getElementById('equipmentPage');
    const adminPage = document.getElementById('adminPage');
    const homeLink = document.getElementById('homeLink');
    const adminLink = document.getElementById('adminLink');
    const backButton = document.getElementById('backButton');
    const equipmentGrid = document.getElementById('equipmentGrid');
    const equipmentDetail = document.getElementById('equipmentDetail');
    const addEquipmentForm = document.getElementById('addEquipmentForm');
    const refreshEquipmentBtn = document.getElementById('refreshEquipment');
    const adminEquipmentList = document.getElementById('adminEquipmentList');
    const equipmentSearch = document.getElementById('equipmentSearch');

    // Навигация
    homeLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('homePage');
        loadEquipment();
    });
    
    adminLink.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('adminPage');
        loadAdminEquipment();
    });
    
    backButton.addEventListener('click', () => showPage('homePage'));

    // Загрузка данных
    refreshEquipmentBtn?.addEventListener('click', loadAdminEquipment);
    addEquipmentForm?.addEventListener('submit', handleAddEquipment);
    equipmentSearch?.addEventListener('input', (e) => searchEquipment(e.target.value));

    // Инициализация
    showPage('homePage');
    loadEquipment();
});

// Функции
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(page => {
        page.classList.remove('active');
    });
    document.getElementById(pageId).classList.add('active');
}

async function loadEquipment() {
    try {
        const response = await fetch(API_BASE_URL);
        const equipment = await response.json();
        displayEquipment(equipment);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        alert('Не удалось загрузить каталог инвентаря');
    }
}

async function searchEquipment(query) {
    if (!query || query.length < 2) {
        loadEquipment();
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/search?query=${encodeURIComponent(query)}`);
        const equipment = await response.json();
        displayEquipment(equipment);
    } catch (error) {
        console.error('Ошибка поиска:', error);
    }
}

function displayEquipment(equipment) {
    const grid = document.getElementById('equipmentGrid');
    grid.innerHTML = '';
    
    if (!equipment?.length) {
        grid.innerHTML = '<p>Инвентарь не найден</p>';
        return;
    }
    
    equipment.forEach(item => {
        const card = document.createElement('div');
        card.className = 'equipment-card';
        card.innerHTML = `
            <div class="equipment-image" style="background-image: url('${item.imageUrl || 'default-equipment.jpg'}')"></div>
            <div class="equipment-info">
                <h3>${item.name}</h3>
                <span class="equipment-type">${getTypeName(item.type)}</span>
                <p class="equipment-desc">${item.description || 'Нет описания'}</p>
            </div>
        `;
        card.addEventListener('click', () => showEquipmentDetail(item.id));
        grid.appendChild(card);
    });
}

function getTypeName(type) {
    const types = {
        'TRAINER': 'Тренажер',
        'BALL': 'Мяч',
        'CLOTHES': 'Одежда',
        'OTHER': 'Другое'
    };
    return types[type] || type;
}

async function showEquipmentDetail(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const equipment = await response.json();
        
        if (!equipment) throw new Error('Инвентарь не найден');
        renderEquipmentDetail(equipment);
        showPage('equipmentPage');
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить информацию об инвентаре');
    }
}

function renderEquipmentDetail(equipment) {
    const detail = document.getElementById('equipmentDetail');
    
    detail.innerHTML = `
        <div class="detail-header">
            <div class="detail-image" style="background-image: url('${equipment.imageUrl || 'default-equipment.jpg'}')"></div>
            <div class="detail-title">
                <h2>${equipment.name}</h2>
                <div class="detail-meta">
                    <span class="equipment-type">${getTypeName(equipment.type)}</span>
                </div>
                
                <h3>Описание:</h3>
                <p>${equipment.description || 'Нет описания'}</p>
                
                <h3>Характеристики:</h3>
                <ul class="equipment-specs">
                    ${equipment.specs?.split('\n').map(spec => spec.trim() ? `<li>${spec}</li>` : '').join('') || '<li>Нет характеристик</li>'}
                </ul>
            </div>
        </div>
    `;
}

async function loadAdminEquipment() {
    try {
        const response = await fetch(API_BASE_URL);
        const equipment = await response.json();
        displayAdminEquipment(equipment);
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Не удалось загрузить каталог');
    }
}

function displayAdminEquipment(equipment) {
    const list = document.getElementById('adminEquipmentList');
    list.innerHTML = '';
    
    if (!equipment?.length) {
        list.innerHTML = '<p>Нет инвентаря в каталоге</p>';
        return;
    }
    
    equipment.forEach(item => {
        const listItem = document.createElement('div');
        listItem.className = 'admin-equipment-item';
        listItem.innerHTML = `
            <div>
                <h4>${item.name}</h4>
                <small>${getTypeName(item.type)}</small>
            </div>
            <div class="admin-equipment-actions">
                <button class="edit-btn" data-id="${item.id}">Изменить</button>
                <button class="delete-btn" data-id="${item.id}">Удалить</button>
            </div>
        `;
        list.appendChild(listItem);
    });
    
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteEquipment(e.target.getAttribute('data-id'));
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            editEquipment(e.target.getAttribute('data-id'));
        });
    });
}

async function handleAddEquipment(e) {
    e.preventDefault();
    
    const form = e.target;
    const formData = {
        name: form.equipmentName.value,
        type: form.equipmentType.value,
        description: form.equipmentDesc.value,
        specs: form.equipmentSpecs.value,
        imageUrl: form.equipmentImage.value || "default-equipment.jpg"
    };
    
    try {
        const response = await fetch(API_BASE_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Ошибка сервера');
        }
        
        const result = await response.json();
        alert(`Инвентарь "${form.equipmentName.value}" добавлен в каталог!`);
        form.reset();
        loadAdminEquipment();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при добавлении: ' + error.message);
    }
}

async function deleteEquipment(id) {
    if (!confirm('Вы уверены, что хотите удалить этот инвентарь?')) return;
    
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка при удалении');
        
        alert('Инвентарь успешно удален');
        loadAdminEquipment();
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при удалении: ' + error.message);
    }
}

async function editEquipment(id) {
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`);
        const equipment = await response.json();
        
        if (!equipment) throw new Error('Инвентарь не найден');
        
        const form = document.getElementById('addEquipmentForm');
        
        // Заполняем форму редактирования
        form.equipmentName.value = equipment.name;
        form.equipmentType.value = equipment.type;
        form.equipmentDesc.value = equipment.description;
        form.equipmentSpecs.value = equipment.specs;
        form.equipmentImage.value = equipment.imageUrl;
        
        // Прокручиваем к форме
        form.scrollIntoView();
        
    } catch (error) {
        console.error('Ошибка:', error);
        alert('Ошибка при загрузке данных инвентаря: ' + error.message);
    }
}