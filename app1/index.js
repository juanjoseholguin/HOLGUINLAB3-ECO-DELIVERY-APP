let currentUser = null;

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

document.getElementById('loginForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('http://localhost:5050/users/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: email, password })
        });
        
        const data = await response.json();
        
        if (data.user) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userToken', data.token || 'user-token');
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            alert('¡Bienvenido ' + currentUser.name + '!');
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    
    try {
        const response = await fetch('http://localhost:5050/users/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, username: email, password, address: '' })
        });
        
        const data = await response.json();
        
        if (data.user) {
            currentUser = data.user;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('userToken', data.token || 'user-token');
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('authSection').style.display = 'none';
            document.getElementById('mainContent').style.display = 'block';
            alert('¡Usuario registrado y logueado exitosamente! Bienvenido ' + currentUser.name);
            document.getElementById('registerForm').reset();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error de registro:', error);
        alert('Error de conexión. Asegúrate de que el servidor esté ejecutándose en el puerto 5050');
    }
});

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginForm').reset();
}

async function showStores() {
    try {
        const response = await fetch('http://localhost:5050/stores');
        const stores = await response.json();
        
        const storesList = document.getElementById('storesList');
        storesList.innerHTML = stores.map(store => `
            <div class="store-item">
                <h4>${store.name}</h4>
                <p>${store.description || ''}</p>
                <p><strong>Dirección:</strong> ${store.address || ''}</p>
                <button class="btn" onclick="viewStore('${store.id}', '${store.name}')">Ver tienda</button>
            </div>
        `).join('');
        
        hideAllSections();
        document.getElementById('storesSection').style.display = 'block';
    } catch (error) {
        alert('Error cargando tiendas');
    }
}

async function showProducts() {
    try {
        const storesResponse = await fetch('http://localhost:5050/stores');
        const stores = await storesResponse.json();
        
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = '';
        
        for (const store of stores) {
            const storeResp = await fetch(`http://localhost:5050/stores/${store.id}`);
            const storeData = await storeResp.json();
            const storeProducts = storeData.products || [];
            if (storeProducts.length === 0) continue;
            
            const section = document.createElement('div');
            section.className = 'store-item';
            section.innerHTML = `<h4>${store.name}</h4>` + storeProducts.map(p => `
                <div class="product-item">
                    ${p.imageUrl ? `<img src="http://localhost:5050${p.imageUrl}" alt="${p.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">` : ''}
                    <h4>${p.name}</h4>
                    <p><strong>Precio:</strong> ${p.price} Galeones</p>
                    <button class="btn" onclick="orderProduct('${store.id}', '${p.id}')">Comprar</button>
                </div>
            `).join('');
            productsList.appendChild(section);
        }
        
        hideAllSections();
        document.getElementById('productsSection').style.display = 'block';
    } catch (error) {
        alert('Error cargando productos');
    }
}

async function viewStore(storeId, storeName) {
    try {
        const storeResp = await fetch(`http://localhost:5050/stores/${storeId}`);
        const storeData = await storeResp.json();
        const products = storeData.products || [];
        const productsList = document.getElementById('productsList');
        productsList.innerHTML = `
            <div class="store-item">
                <h3>${storeName}</h3>
                ${products.length === 0 ? '<p>No hay productos disponibles</p>' : products.map(p => `
                    <div class="product-item">
                        ${p.imageUrl ? `<img src="http://localhost:5050${p.imageUrl}" alt="${p.name}" style="width: 100px; height: 100px; object-fit: cover; border-radius: 8px; margin-bottom: 8px;">` : ''}
                        <h4>${p.name}</h4>
                        <p><strong>Precio:</strong> ${p.price} Galeones</p>
                        <button class="btn" onclick="orderProduct('${storeId}', '${p.id}')">Comprar</button>
                    </div>
                `).join('')}
            </div>
        `;
        hideAllSections();
        document.getElementById('productsSection').style.display = 'block';
    } catch (error) {
        alert('No se pudo abrir la tienda');
    }
}

async function showOrders() {
    try {
        const response = await fetch('http://localhost:5050/orders');
        const orders = await response.json();
        
        const userOrders = orders.filter(order => order.consumerId === currentUser.id);
        
        const ordersList = document.getElementById('ordersList');
        if (userOrders.length === 0) {
            ordersList.innerHTML = '<p>No tienes pedidos aún</p>';
        } else {
            ordersList.innerHTML = userOrders.map(order => {
                const total = order.items.reduce((sum, item) => sum + (item.price * item.qty), 0);
                const canCancel = order.status === 'pending' || order.status === 'confirmed';
                return `
                    <div class="order-item">
                        <h4>Pedido #${order.id}</h4>
                        <p><strong>Total:</strong> ${total} Galeones</p>
                        <p><strong>Estado:</strong> ${order.status}</p>
                        <p><strong>Dirección:</strong> ${order.address}</p>
                        <div class="order-products">
                            <strong>Productos:</strong>
                            ${order.items.map(item => `
                                <div class="order-product-item" style="display: flex; align-items: center; margin: 5px 0;">
                                    ${item.imageUrl ? `<img src="http://localhost:5050${item.imageUrl}" alt="${item.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 5px; margin-right: 10px;">` : ''}
                                    <span>${item.qty}x ${item.name}</span>
                                </div>
                            `).join('')}
                        </div>
                        ${canCancel ? `<button class="btn" onclick="cancelOrder('${order.id}')" style="background: #ff4444; margin-top: 10px;">Cancelar Pedido</button>` : ''}
                    </div>
                `;
            }).join('');
        }
        
        hideAllSections();
        document.getElementById('ordersSection').style.display = 'block';
    } catch (error) {
        alert('Error cargando pedidos');
    }
}

async function orderProduct(storeId, productId) {
    if (!currentUser) {
        alert('Primero inicia sesión');
        return;
    }
    try {
        const resp = await fetch('http://localhost:5050/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                consumerId: currentUser.id,
                storeId: storeId,
                items: [{ productId: productId, qty: 1 }],
                address: 'Hogwarts',
                payment: 'cash'
            })
        });
        const data = await resp.json();
        if (resp.ok) {
            alert('¡Pedido creado! ID: ' + data.id);
        } else {
            alert('No se pudo crear el pedido: ' + (data.message || 'Error'));
        }
    } catch (e) {
        alert('Error de conexión al crear pedido');
    }
}

async function cancelOrder(orderId) {
    if (!confirm('¿Estás seguro de que quieres cancelar este pedido?')) {
        return;
    }
    
    try {
        const response = await fetch(`http://localhost:5050/orders/${orderId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('userToken') || ''
            }
        });
        
        if (response.ok) {
            alert('Pedido cancelado exitosamente');
            showOrders(); // Recargar la lista de pedidos
        } else {
            alert('Error cancelando pedido');
        }
    } catch (error) {
        console.error('Error cancelando pedido:', error);
        alert('Error de conexión al cancelar pedido');
    }
}

function createOrder() {
    showStores();
}

function hideAllSections() {
    document.querySelectorAll('.content-section').forEach(section => {
        section.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function() {
    console.log('Página cargada');
    
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('userToken');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('authSection').style.display = 'none';
        document.getElementById('mainContent').style.display = 'block';
        console.log('Usuario logueado automáticamente:', currentUser.name);
    } else {
        showTab('login');
    }
});

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    if (btn) btn.textContent = isPwd ? 'Ocultar' : 'Ver';
}
