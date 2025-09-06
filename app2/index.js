function goBack() {
    window.location.href = '../index.html';
}

function showTab(tabName) {
    console.log('Mostrando tab:', tabName);
    
    document.querySelectorAll('.auth-content').forEach(content => {
        content.style.display = 'none';
    });
    
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const contentElement = document.getElementById(tabName + 'Content');
    if (contentElement) {
        contentElement.style.display = 'block';
        console.log('Contenido mostrado:', tabName + 'Content');
    } else {
        console.error('Elemento no encontrado:', tabName + 'Content');
    }
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
}

let products = [
    { id: 1, name: "Chocolate de la Rana", price: 2.50, category: "Dulces" },
    { id: 2, name: "Caramelos de Menta", price: 1.75, category: "Dulces" },
    { id: 3, name: "Poción de Amor", price: 5.00, category: "Pociones" },
    { id: 4, name: "Galletas de Jengibre", price: 3.25, category: "Dulces" },
    { id: 5, name: "Pastel de Calabaza", price: 4.50, category: "Dulces" }
];

let pendingOrders = [
    {
        id: 1,
        customer: "Harry Potter",
        items: ["Chocolate de la Rana", "Caramelos de Menta"],
        total: 4.25,
        status: "Pendiente",
        date: "2024-01-15"
    },
    {
        id: 2,
        customer: "Hermione Granger",
        items: ["Poción de Amor", "Galletas de Jengibre"],
        total: 8.25,
        status: "Pendiente",
        date: "2024-01-15"
    }
];

let completedOrders = [];
let currentUser = null;

document.getElementById('loginForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        const response = await fetch('http://localhost:5050/stores/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: email, password })
        });
        
        const data = await response.json();
        
        if (data.store && data.token) {
            currentUser = data.store;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('storeToken', data.token);
            showMainContent();
            loadStoreData();
            alert('¡Bienvenido ' + currentUser.name + '!');
        } else {
            alert('Credenciales incorrectas o no tienes permisos de tienda');
        }
    } catch (error) {
        console.error('Error de login:', error);
        alert('Error de conexión. Asegúrate de que el servidor esté ejecutándose en el puerto 5050');
    }
});

document.getElementById('registerForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('storeName').value;
    const description = document.getElementById('storeDescription').value;
    const address = document.getElementById('storeAddress').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('http://localhost:5050/stores/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ 
                name, 
                description, 
                address, 
                username: email, 
                password 
            })
        });
        
        const data = await response.json();
        
        if (data.store && data.token) {
            currentUser = data.store;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('storeToken', data.token);
            showMainContent();
            loadStoreData();
            alert('¡Tienda registrada y logueada exitosamente! Bienvenido ' + currentUser.name);
            document.getElementById('registerForm').reset();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error de registro:', error);
        alert('Error de conexión. Asegúrate de que el servidor esté ejecutándose en el puerto 5050');
    }
});

function showMainContent() {
    document.getElementById('loginSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('storeToken');
    document.getElementById('loginSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('email').value = '';
    document.getElementById('password').value = '';
    hideAllSections();
}

function hideAllSections() {
    document.getElementById('productManagement').style.display = 'none';
    document.getElementById('orderReception').style.display = 'none';
    document.getElementById('salesHistory').style.display = 'none';
}

function loadStoreData() {
    loadProducts();
    loadPendingOrders();
    loadSalesHistory();
}

function showProductManagement() {
    hideAllSections();
    document.getElementById('productManagement').style.display = 'block';
}

async function addProduct() {
    const name = document.getElementById('productName').value;
    const price = parseFloat(document.getElementById('productPrice').value);
    const category = document.getElementById('productCategory').value;
    
    if (name && price > 0 && category) {
        try {
            const token = localStorage.getItem('storeToken');
            const imageInput = document.getElementById('productImage');
            const form = new FormData();
            form.append('name', name);
            form.append('price', String(price));
            form.append('stock', String(10));
            if (imageInput && imageInput.files && imageInput.files[0]) {
                form.append('image', imageInput.files[0]);
            }
            const response = await fetch(`http://localhost:5050/stores/${currentUser.id}/products`, {
                method: 'POST',
                headers: {
                    'x-auth-token': token || ''
                },
                body: form
            });
            
            const data = await response.json();
            
            if (response.ok && data.id) {
                document.getElementById('productName').value = '';
                document.getElementById('productPrice').value = '';
                document.getElementById('productCategory').value = '';
                if (imageInput) imageInput.value = '';
                
                alert(`Producto "${name}" agregado exitosamente a la tienda!`);
                loadProducts();
            } else {
                alert('Error al agregar el producto: ' + data.message);
            }
        } catch (error) {
            console.error('Error agregando producto:', error);
            alert('Error de conexión al agregar producto');
        }
    } else {
        alert('Por favor completa todos los campos correctamente');
    }
}

async function loadProducts() {
    const productsList = document.getElementById('productsList');
    productsList.innerHTML = '';
    
    try {
        const response = await fetch(`http://localhost:5050/stores/${currentUser.id}`);
        const storeData = await response.json();
        
        const storeProducts = storeData.products || [];
        
        if (storeProducts.length === 0) {
            productsList.innerHTML = '<p style="color: #ccc; text-align: center;">🪄 No hay productos mágicos en la tienda aún</p>';
            return;
        }
        
        storeProducts.forEach(product => {
            const productItem = document.createElement('div');
            productItem.className = 'product-item';
            productItem.innerHTML = `
                <div class="product-info">
                    ${product.imageUrl ? `<img src="http://localhost:5050${product.imageUrl}" alt="${product.name}" class="product-image" style="width: 150px; height: 150px; object-fit: cover; border-radius: 10px; margin-bottom: 10px;">` : ''}
                    <div class="product-name">${product.name}</div>
                    <div class="product-details">
                        <span class="product-category">${product.category || 'Sin categoría'}</span>
                        <span class="product-price">${product.price} Galeones</span>
                        <span class="product-stock">Stock: ${product.stock || 0}</span>
                    </div>
                </div>
                <button class="delete-btn" onclick="deleteProduct('${product.id}')" style="margin-top: 15px;">🗑️ Eliminar</button>
            `;
            productsList.appendChild(productItem);
        });
    } catch (error) {
        console.error('Error cargando productos:', error);
        productsList.innerHTML = '<p style="color: #ccc; text-align: center;">Error cargando productos</p>';
    }
}

async function deleteProduct(productId) {
    if (confirm('🪄 ¿Estás seguro de que quieres eliminar este producto mágico de la tienda?')) {
        try {
            const token = localStorage.getItem('storeToken');
            const response = await fetch(`http://localhost:5050/stores/${currentUser.id}/products/${productId}`, {
                method: 'DELETE',
                headers: {
                    'x-auth-token': token || ''
                }
            });
            
            if (response.ok) {
                alert('✨ ¡Producto mágico eliminado exitosamente de la tienda!');
                loadProducts();
            } else {
                const data = await response.json();
                alert('Error al eliminar producto: ' + (data.message || 'Error desconocido'));
            }
        } catch (error) {
            console.error('Error eliminando producto:', error);
            alert('Error de conexión al eliminar producto');
        }
    }
}

function showOrderReception() {
    hideAllSections();
    document.getElementById('orderReception').style.display = 'block';
    loadPendingOrders();
}

async function loadPendingOrders() {
    const pendingOrdersDiv = document.getElementById('pendingOrders');
    if (!pendingOrdersDiv) return;
    
    try {
        const response = await fetch('http://localhost:5050/orders');
        const allOrders = await response.json();
        
        const storeOrders = allOrders.filter(order => order.storeId === currentUser.id && (order.status === 'pending' || order.status === 'created'));
        
        pendingOrdersDiv.innerHTML = '';
        
        if (storeOrders.length === 0) {
            pendingOrdersDiv.innerHTML = '<p style="color: #ccc; text-align: center;">🪄 No hay pedidos mágicos pendientes</p>';
            return;
        }
        
        storeOrders.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card';
            
            
            const customerNames = {
                'u1757116157572_hhs9r9xoio': '🧙‍♂️ Harry Potter',
                'u1757120220880_b51vm8ygpf9': '🧙‍♀️ Hermione Granger',
                'u1757130116341_3n6g2pjy23u': '🧙‍♂️ Ron Weasley',
                'd1757083116631_6d4c76l1ypt': '🧙‍♂️ Neville Longbottom',
                'test_user_new': '🧙‍♂️ Draco Malfoy',
                'test_user_new2': '🧙‍♀️ Luna Lovegood',
                'test_user_new3': '🧙‍♂️ Cedric Diggory'
            };
            
            const customerName = customerNames[order.consumerId] || `🧙‍♂️ Usuario #${order.consumerId}`;
            

            orderCard.innerHTML = `
                <h4>🪄 Pedido Mágico #${order.id}</h4>
                <div class="order-details">
                    <p><strong>🧙‍♂️ Cliente:</strong> ${customerName}</p>
                    <p><strong>🪄 Productos:</strong> ${order.items.map(item => `${item.qty}x ${item.name || 'Producto'}`).join(', ')}</p>
                    <p><strong>💰 Total:</strong> ${order.items.reduce((sum, item) => sum + (item.price * item.qty), 0)} Galeones</p>
                    <p><strong>📅 Fecha:</strong> ${new Date().toLocaleDateString()}</p>
                    <p><strong>🔮 Estado:</strong> <span class="status-pending">${order.status}</span></p>
                </div>
                <div class="order-actions" style="margin-top: 15px;">
                    <button class="btn btn-success" onclick="acceptOrder('${order.id}')" style="margin-right: 10px;">✅ Aceptar Pedido Mágico</button>
                    <button class="btn btn-danger" onclick="rejectOrder('${order.id}')">❌ Rechazar Pedido Mágico</button>
                </div>
            `;
            pendingOrdersDiv.appendChild(orderCard);
        });
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        pendingOrdersDiv.innerHTML = '<p style="color: #ccc; text-align: center;">Error cargando pedidos</p>';
    }
}

async function acceptOrder(orderId) {
    try {
        const response = await fetch(`http://localhost:5050/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('storeToken') || ''
            },
            body: JSON.stringify({ status: 'confirmed' })
        });
        
        
        if (response.ok) {
            const data = await response.json();
            alert(`✨ ¡Pedido mágico #${orderId} aceptado exitosamente!`);
            loadPendingOrders();
        } else {
            const errorData = await response.text();
            alert('Error al aceptar el pedido: ' + errorData);
        }
    } catch (error) {
        console.error('Error aceptando pedido:', error);
        alert('Error de conexión al aceptar pedido: ' + error.message);
    }
}

async function rejectOrder(orderId) {
    if (confirm('🪄 ¿Estás seguro de que quieres rechazar este pedido mágico?')) {
        try {
            const response = await fetch(`http://localhost:5050/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('storeToken') || ''
                },
                body: JSON.stringify({ status: 'cancelled' })
            });
            
            console.log('Response status:', response.status);
            console.log('Response ok:', response.ok);
            
            if (response.ok) {
                const data = await response.json();
                alert('🪄 Pedido mágico rechazado');
                loadPendingOrders();
            } else {
                const errorData = await response.text();
                alert('Error al rechazar el pedido: ' + errorData);
            }
        } catch (error) {
            console.error('Error rechazando pedido:', error);
            alert('Error de conexión al rechazar pedido: ' + error.message);
        }
    }
}

function showSalesHistory() {
    hideAllSections();
    document.getElementById('salesHistory').style.display = 'block';
}

function loadSalesHistory() {
    updateSalesStats();
    loadSalesList();
}

async function updateSalesStats() {
    try {
        const response = await fetch('http://localhost:5050/orders');
        const allOrders = await response.json();
        
        const storeCompletedOrders = allOrders.filter(order => 
            order.storeId === currentUser.id && 
            (order.status === 'delivered' || order.status === 'completed')
        );
        
        const totalSales = storeCompletedOrders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + (item.price * item.qty), 0), 0
        );
        const completedCount = storeCompletedOrders.length;
        const productsSold = storeCompletedOrders.reduce((sum, order) => 
            sum + order.items.reduce((itemSum, item) => itemSum + item.qty, 0), 0
        );
        
        document.getElementById('totalSales').textContent = `${totalSales} Galeones`;
        document.getElementById('completedOrders').textContent = completedCount;
        document.getElementById('productsSold').textContent = productsSold;
    } catch (error) {
        console.error('Error actualizando estadísticas:', error);
        document.getElementById('totalSales').textContent = '0 Galeones';
        document.getElementById('completedOrders').textContent = '0';
        document.getElementById('productsSold').textContent = '0';
    }
}

async function loadSalesList() {
    const salesList = document.getElementById('salesList');
    if (!salesList) return;
    
    salesList.innerHTML = '';
    
    try {
        const response = await fetch('http://localhost:5050/orders');
        const allOrders = await response.json();
        
        const storeCompletedOrders = allOrders.filter(order => 
            order.storeId === currentUser.id && 
            (order.status === 'delivered' || order.status === 'completed')
        );
        
        if (storeCompletedOrders.length === 0) {
            salesList.innerHTML = '<p style="color: #ccc; text-align: center;">🪄 No hay ventas mágicas registradas</p>';
            return;
        }
        
        const customerNames = {
            'u1757116157572_hhs9r9xoio': '🧙‍♂️ Harry Potter',
            'u1757120220880_b51vm8ygpf9': '🧙‍♀️ Hermione Granger',
            'u1757130116341_3n6g2pjy23u': '🧙‍♂️ Ron Weasley',
            'd1757083116631_6d4c76l1ypt': '🧙‍♂️ Neville Longbottom',
            'test_user_new': '🧙‍♂️ Draco Malfoy',
            'test_user_new2': '🧙‍♀️ Luna Lovegood',
            'test_user_new3': '🧙‍♂️ Cedric Diggory'
        };
        
        storeCompletedOrders.forEach(order => {
            const customerName = customerNames[order.consumerId] || `🧙‍♂️ Usuario #${order.consumerId}`;
            const total = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
            const products = order.items.map(item => `${item.qty}x ${item.name || 'Producto'}`).join(', ');
            
            const saleItem = document.createElement('div');
            saleItem.className = 'sale-item';
            saleItem.innerHTML = `
                <h4>✨ Venta Mágica #${order.id}</h4>
                <div class="sale-details">
                    <p><strong>🧙‍♂️ Cliente:</strong> ${customerName}</p>
                    <p><strong>🪄 Productos:</strong> ${products}</p>
                    <p><strong>💰 Total:</strong> ${total} Galeones</p>
                    <p><strong>📅 Fecha de Completado:</strong> ${new Date().toLocaleDateString()}</p>
                </div>
            `;
            salesList.appendChild(saleItem);
        });
    } catch (error) {
        console.error('Error cargando ventas:', error);
        salesList.innerHTML = '<p style="color: #ccc; text-align: center;">Error cargando ventas</p>';
    }
}

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    if (btn) btn.textContent = isPwd ? 'Ocultar' : 'Ver';
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página de tienda cargada');
    
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('storeToken');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('loginSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        loadStoreData();
        console.log('Tienda logueada automáticamente:', currentUser.name);
    } else {
        showTab('login');
    }
});
