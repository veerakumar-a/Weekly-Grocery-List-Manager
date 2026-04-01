// Get DOM elements
const itemInput = document.getElementById('itemInput');
const priceInput = document.getElementById('priceInput');
const categorySelect = document.getElementById('categorySelect');
const prioritySelect = document.getElementById('prioritySelect');
const addBtn = document.getElementById('addBtn');
const pendingList = document.getElementById('pendingList');
const boughtList = document.getElementById('boughtList');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const searchInput = document.getElementById('searchInput');
const editModal = document.getElementById('editModal');
const editItemInput = document.getElementById('editItemInput');
const editPriceInput = document.getElementById('editPriceInput');
const editCategorySelect = document.getElementById('editCategorySelect');
const editPrioritySelect = document.getElementById('editPrioritySelect');
const cancelEditBtn = document.getElementById('cancelEditBtn');
const confirmEditBtn = document.getElementById('confirmEditBtn');

// Tab Navigation
const tabs = document.querySelectorAll('.tab');
const tabContents = document.querySelectorAll('.tab-content');

// State
let items = JSON.parse(localStorage.getItem('groceryItems')) || [];
let itemCounter = parseInt(localStorage.getItem('itemCounter')) || 0;
let editingId = null;
let currentFilter = 'all';

// ===== EVENT LISTENERS =====

// Tab switching
tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const tabName = tab.dataset.tab;
        tabs.forEach(t => t.classList.remove('active'));
        tabContents.forEach(content => content.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(tabName).classList.add('active');
    });
});

// Filter buttons
document.querySelectorAll('.filter-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFilter = btn.dataset.filter;
        renderItems();
    });
});
document.querySelector('.filter-btn[data-filter="all"]').classList.add('active');

// Add item events
addBtn.addEventListener('click', addItem);
itemInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addItem();
});

// Other events
clearBtn.addEventListener('click', clearAllItems);
exportBtn.addEventListener('click', exportList);
searchInput.addEventListener('input', renderItems);

// Edit modal events
cancelEditBtn.addEventListener('click', closeEditModal);
confirmEditBtn.addEventListener('click', saveEdit);

// Close modal when clicking outside
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

// ===== MAIN FUNCTIONS =====

function addItem() {
    const text = itemInput.value.trim();
    const price = parseFloat(priceInput.value) || 0;
    const category = categorySelect.value;
    const priority = prioritySelect.value;

    if (text === '') {
        alert('Please enter an item!');
        return;
    }

    itemCounter++;
    const item = {
        id: itemCounter,
        text: text,
        price: price,
        category: category,
        priority: priority,
        bought: false,
        dateAdded: new Date().toLocaleDateString()
    };

    items.push(item);
    saveItems();
    renderItems();
    
    // Clear form
    itemInput.value = '';
    priceInput.value = '';
    categorySelect.value = 'Vegetables';
    prioritySelect.value = 'medium';
    itemInput.focus();
}

function deleteItem(id) {
    items = items.filter(item => item.id !== id);
    saveItems();
    renderItems();
}

function toggleBought(id) {
    const item = items.find(item => item.id === id);
    if (item) {
        item.bought = !item.bought;
        saveItems();
        renderItems();
    }
}

function openEditModal(id) {
    editingId = id;
    const item = items.find(i => i.id === id);
    if (item) {
        editItemInput.value = item.text;
        editPriceInput.value = item.price;
        editCategorySelect.value = item.category;
        editPrioritySelect.value = item.priority;
        editModal.classList.add('active');
    }
}

function closeEditModal() {
    editModal.classList.remove('active');
    editingId = null;
}

function saveEdit() {
    const item = items.find(i => i.id === editingId);
    if (item) {
        item.text = editItemInput.value.trim();
        item.price = parseFloat(editPriceInput.value) || 0;
        item.category = editCategorySelect.value;
        item.priority = editPrioritySelect.value;
        saveItems();
        renderItems();
        closeEditModal();
    }
}

function clearAllItems() {
    if (items.length === 0) {
        alert('No items to clear!');
        return;
    }
    if (confirm('Delete all items?')) {
        items = [];
        itemCounter = 0;
        saveItems();
        renderItems();
    }
}

function exportList() {
    let csv = 'Item,Price (₹),Category,Priority,Status,Date Added\n';
    items.forEach(item => {
        csv += `"${item.text}",${item.price},"${item.category}","${item.priority}","${item.bought ? 'Bought' : 'Pending'}","${item.dateAdded}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grocery-list-${new Date().toLocaleDateString()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
}

// ===== HELPER FUNCTIONS =====

function getPriorityEmoji(priority) {
    const emojis = {
        'high': '🔴',
        'medium': '🟠',
        'low': '🟢'
    };
    return emojis[priority] || '';
}

function getCategoryEmoji(category) {
    const emojis = {
        'Vegetables': '🥬',
        'Fruits': '🍎',
        'Dairy': '🥛',
        'Meat': '🍗',
        'Grains': '🌾',
        'Spices': '🌶️',
        'Beverages': '☕',
        'Others': '📦'
    };
    return emojis[category] || '';
}

function renderItems() {
    const searchTerm = searchInput.value.toLowerCase();
    
    let filteredItems = items.filter(item => {
        const matchesSearch = item.text.toLowerCase().includes(searchTerm);
        const matchesFilter = currentFilter === 'all' || 
            (currentFilter === 'pending' && !item.bought) ||
            (currentFilter === 'bought' && item.bought);
        return matchesSearch && matchesFilter;
    });

    const pendingItems = filteredItems.filter(item => !item.bought).sort((a, b) => {
        const priorityOrder = { 'high': 0, 'medium': 1, 'low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
    });

    const boughtItems = filteredItems.filter(item => item.bought);

    // Render pending items
    pendingList.innerHTML = '';
    if (pendingItems.length === 0) {
        pendingList.innerHTML = '<div class="empty-message">No pending items 🎉</div>';
    } else {
        pendingItems.forEach((item, index) => {
            pendingList.innerHTML += createItemHTML(item, index + 1);
        });
    }

    // Render bought items
    boughtList.innerHTML = '';
    if (boughtItems.length === 0) {
        boughtList.innerHTML = '<div class="empty-message">No items bought yet.</div>';
    } else {
        boughtItems.forEach(item => {
            boughtList.innerHTML += createItemHTML(item, items.indexOf(item) + 1, true);
        });
    }

    updateStats();
    addEventListeners();
}

function createItemHTML(item, displayNumber, isBought = false) {
    return `
        <div class="item priority-${item.priority} ${isBought ? 'bought' : ''}">
            <span class="item-number">${displayNumber}</span>
            <div class="item-content">
                <div class="item-text">${item.text}</div>
                <div class="item-details">
                    <span class="item-badge badge-category">${getCategoryEmoji(item.category)} ${item.category}</span>
                    <span class="item-badge badge-priority-${item.priority}">${getPriorityEmoji(item.priority)} ${item.priority}</span>
                    ${item.price > 0 ? `<span style="color: #667eea; font-weight: bold;">₹${item.price.toFixed(2)}</span>` : ''}
                </div>
            </div>
            <input 
                type="checkbox" 
                class="item-checkbox"
                data-id="${item.id}"
                ${item.bought ? 'checked' : ''}
            >
            <div class="item-buttons">
                <button class="edit-btn" data-id="${item.id}">Edit</button>
                <button class="delete-btn" data-id="${item.id}">Delete</button>
            </div>
        </div>
    `;
}

function updateStats() {
    const total = items.length;
    const pending = items.filter(i => !i.bought).length;
    const bought = items.filter(i => i.bought).length;
    const totalCost = items.reduce((sum, i) => sum + i.price, 0);
    const spentCost = items.filter(i => i.bought).reduce((sum, i) => sum + i.price, 0);
    const remainingCost = totalCost - spentCost;
    const budgetPercentage = totalCost > 0 ? (spentCost / totalCost) * 100 : 0;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('pendingCount').textContent = pending;
    document.getElementById('boughtCount').textContent = bought;
    document.getElementById('totalCost').textContent = `₹${totalCost.toFixed(2)}`;
    document.getElementById('spentCost').textContent = `₹${spentCost.toFixed(2)}`;
    document.getElementById('remainingCost').textContent = `₹${remainingCost.toFixed(2)}`;
    document.getElementById('budgetFill').style.width = budgetPercentage + '%';
    document.getElementById('budgetPercentage').textContent = budgetPercentage.toFixed(0);

    // Category breakdown
    const categories = {};
    items.forEach(item => {
        if (!categories[item.category]) {
            categories[item.category] = { count: 0, cost: 0, bought: 0 };
        }
        categories[item.category].count++;
        categories[item.category].cost += item.price;
        if (item.bought) categories[item.category].bought++;
    });

    let categoryHTML = '';
    Object.entries(categories).forEach(([category, data]) => {
        categoryHTML += `
            <div style="padding: 8px; background: #f9f9f9; border-radius: 6px; margin-bottom: 8px;">
                <strong>${getCategoryEmoji(category)} ${category}</strong>
                <div style="font-size: 12px; color: #999;">
                    Items: ${data.count} | Bought: ${data.bought} | Cost: ₹${data.cost.toFixed(2)}
                </div>
            </div>
        `;
    });
    document.getElementById('categoryBreakdown').innerHTML = categoryHTML || '<p style="color: #ccc;">No categories yet</p>';
}

function addEventListeners() {
    document.querySelectorAll('.item-checkbox').forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            toggleBought(parseInt(e.target.dataset.id));
        });
    });

    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            deleteItem(parseInt(e.target.dataset.id));
        });
    });

    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            openEditModal(parseInt(e.target.dataset.id));
        });
    });
}

function saveItems() {
    localStorage.setItem('groceryItems', JSON.stringify(items));
    localStorage.setItem('itemCounter', itemCounter.toString());
}

// Initial render
renderItems();
