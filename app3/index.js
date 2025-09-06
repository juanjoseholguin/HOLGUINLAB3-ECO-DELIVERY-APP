function goBack() {
    window.location.href = '../index.html';
}

let users = [
    { name: "Juan Pérez", email: "juan@email.com", password: "123456" },
    { name: "María García", email: "maria@email.com", password: "123456" }
];

let availableOrders = [
    {
        id: 1,
        customer: "Carlos López",
        address: "Calle 123, Ciudad",
        items: ["Pizza Margarita", "Bebida"],
        total: 15.50,
        store: "Pizzería Central"
    },
    {
        id: 2,
        customer: "Ana Martínez",
        address: "Avenida 456, Pueblo",
        items: ["Hamburguesa", "Papas fritas"],
        total: 12.75,
        store: "Restaurante Rápido"
    },
    {
        id: 3,
        customer: "Luis Rodríguez",
        address: "Plaza 789, Villa",
        items: ["Sushi", "Té verde"],
        total: 25.00,
        store: "Sushi Bar"
    }
];

let assignedOrders = [];
let currentUser = null;

function showLogin() {
    document.getElementById('loginForm').style.display = 'block';
    document.getElementById('registerForm').style.display = 'none';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
}

document.getElementById('loginFormElement').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
    
    try {
        const response = await fetch('http://localhost:5050/drivers/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username: email, password })
        });
        
        const data = await response.json();
        
        if (data.driver && data.token) {
            currentUser = data.driver;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('driverToken', data.token);
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('profileName').textContent = currentUser.name;
            document.getElementById('profileEmail').textContent = currentUser.username;
            document.getElementById('completedOrders').textContent = 0;
            document.getElementById('averageRating').textContent = 5.0;
            
            showMainContent();
            showHome();
            alert('¡Bienvenido ' + currentUser.name + '!');
        } else {
            alert('Email o contraseña incorrectos');
        }
    } catch (error) {
        alert('Error de conexión');
    }
});

document.getElementById('registerFormElement').addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = document.getElementById('registerName').value;
    const email = document.getElementById('registerEmail').value;
    const password = document.getElementById('registerPassword').value;
    const confirmPassword = document.getElementById('registerConfirmPassword').value;
    
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }
    
    try {
        const response = await fetch('http://localhost:5050/drivers/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, username: email, password, phone: '', vehicle: '' })
        });
        
        const data = await response.json();
        
        if (data.driver && data.token) {
            currentUser = data.driver;
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            localStorage.setItem('driverToken', data.token);
            document.getElementById('userName').textContent = currentUser.name;
            document.getElementById('profileName').textContent = currentUser.name;
            document.getElementById('profileEmail').textContent = currentUser.username;
            document.getElementById('completedOrders').textContent = 0;
            document.getElementById('averageRating').textContent = 5.0;
            
            showMainContent();
            showHome();
            alert('¡Repartidor registrado y logueado exitosamente! Bienvenido ' + currentUser.name);
            document.getElementById('registerFormElement').reset();
        } else {
            alert('Error: ' + data.message);
        }
    } catch (error) {
        console.error('Error de registro:', error);
        alert('Error de conexión. Asegúrate de que el servidor esté ejecutándose en el puerto 5050');
    }
});

function showMainContent() {
    document.getElementById('authSection').style.display = 'none';
    document.getElementById('mainContent').style.display = 'block';
}

function logout() {
    currentUser = null;
    localStorage.removeItem('currentUser');
    localStorage.removeItem('driverToken');
    document.getElementById('authSection').style.display = 'block';
    document.getElementById('mainContent').style.display = 'none';
    document.getElementById('loginFormElement').reset();
    document.getElementById('registerFormElement').reset();
    hideAllPages();
}

function hideAllPages() {
    document.getElementById('homePage').style.display = 'none';
    document.getElementById('availableOrdersPage').style.display = 'none';
    document.getElementById('assignedOrdersPage').style.display = 'none';
    document.getElementById('profilePage').style.display = 'none';
}

function showHome() {
    hideAllPages();
    document.getElementById('homePage').style.display = 'block';
    
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('availableCount').textContent = availableOrders.length;
    document.getElementById('assignedCount').textContent = assignedOrders.length;
}

function showAvailableOrders() {
    hideAllPages();
    document.getElementById('availableOrdersPage').style.display = 'block';
    loadAvailableOrders();
}

function showAssignedOrders() {
    hideAllPages();
    document.getElementById('assignedOrdersPage').style.display = 'block';
    loadAssignedOrders();
}

function showProfile() {
    hideAllPages();
    document.getElementById('profilePage').style.display = 'block';
    
    if (currentUser) {
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.username;
        document.getElementById('completedOrders').textContent = currentUser.completedOrders || 0;
        document.getElementById('averageRating').textContent = currentUser.rating || 5.0;
        
        updateProfileOrderStatus();
    }
}

async function loadAvailableOrders() {
    try {
        console.log('Cargando pedidos disponibles...');
        const response = await fetch('http://localhost:5050/orders/available');
        console.log('Respuesta del servidor:', response.status);
        
        const availableOrders = await response.json();
        console.log('Pedidos disponibles:', availableOrders);
        
        const ordersList = document.getElementById('availableOrdersList');
        if (availableOrders.length === 0) {
            ordersList.innerHTML = '<p>No hay pedidos disponibles en este momento</p>';
        } else {
            ordersList.innerHTML = availableOrders.map(order => `
                <div class="order-item">
                    <h4>Pedido #${order.id}</h4>
                    <p><strong>Total:</strong> ${order.items.reduce((sum, item) => sum + (item.price * item.qty), 0)} Galeones</p>
                    <p><strong>Dirección:</strong> ${order.address}</p>
                    <p><strong>Estado:</strong> ${order.status}</p>
                    <button class="btn" onclick="acceptOrder('${order.id}')">Aceptar Pedido</button>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando pedidos:', error);
        const ordersList = document.getElementById('availableOrdersList');
        ordersList.innerHTML = '<p>Error cargando pedidos disponibles: ' + error.message + '</p>';
    }
}

function loadAssignedOrders() {
    const assignedOrdersList = document.getElementById('assignedOrdersList');
    assignedOrdersList.innerHTML = '';
    
    if (assignedOrders.length === 0) {
        assignedOrdersList.innerHTML = '<p style="text-align: center; color: #7f8c8d;">No tienes pedidos asignados</p>';
        return;
    }
    
    assignedOrders.forEach(order => {
        const orderItem = document.createElement('div');
        orderItem.className = 'accepted-order';
        orderItem.innerHTML = `
            <h4>Pedido #${order.id} - En Progreso</h4>
            <div class="order-details">
                <p><span class="label">Cliente:</span> Usuario #${order.consumerId}</p>
                <p><span class="label">Dirección:</span> ${order.address}</p>
                <p><span class="label">Productos:</span> ${order.items.map(item => `${item.qty}x ${item.name || 'Producto'}`).join(', ')}</p>
                <p><span class="label">Total:</span> ${order.items.reduce((sum, item) => sum + (item.price * item.qty), 0)} Galeones</p>
            </div>
            <div class="order-actions" style="margin-top: 15px;">
                <button class="btn" onclick="completeOrder(${order.id})" style="margin-right: 10px;">Completar Entrega</button>
                <button class="btn" onclick="autoCompleteOrder(${order.id})" style="background: #4CAF50;">Autocompletar</button>
            </div>
        `;
        assignedOrdersList.appendChild(orderItem);
    });
}

async function acceptOrder(orderId) {
    console.log('Intentando aceptar pedido:', orderId);
    
    try {
        const response = await fetch(`http://localhost:5050/orders/${orderId}/accept`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        console.log('Response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Pedido aceptado:', data);
            
            assignedOrders.push(data);
            
            document.getElementById('assignedCount').textContent = assignedOrders.length;
            loadAvailableOrders();
            
            updateProfileOrderStatus();
            
            alert('Pedido aceptado exitosamente');
            
            loadAvailableOrders();
        } else {
            const errorData = await response.text();
            console.error('Error response:', errorData);
            alert('Error al aceptar el pedido: ' + errorData);
        }
    } catch (error) {
        console.error('Error aceptando pedido:', error);
        alert('Error de conexión al aceptar pedido: ' + error.message);
    }
}

function viewOrderDetails(orderId) {
    const order = availableOrders.find(o => o.id === orderId);
    if (order) {
        alert(`Detalles del Pedido #${orderId}:\n\n` +
              `Cliente: ${order.customer}\n` +
              `Dirección: ${order.address}\n` +
              `Tienda: ${order.store}\n` +
              `Productos: ${order.items.join(', ')}\n` +
              `Total: $${order.total}`);
    }
}

function completeOrder(orderId) {
    console.log('Intentando completar pedido:', orderId);
    const order = assignedOrders.find(o => o.id === orderId);
    if (order) {
        console.log('Pedido encontrado:', order);
        fetch(`http://localhost:5050/orders/${orderId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'x-auth-token': localStorage.getItem('driverToken') || ''
            },
            body: JSON.stringify({ status: 'delivered' })
        }).then(response => {
            console.log('Response status:', response.status);
            if (response.ok) {
                return response.json();
            } else {
                return response.text().then(text => {
                    throw new Error(text);
                });
            }
        }).then(data => {
            console.log('Pedido completado:', data);
            assignedOrders = assignedOrders.filter(o => o.id !== orderId);
            
            if (currentUser) {
                currentUser.completedOrders = (currentUser.completedOrders || 0) + 1;
                localStorage.setItem('currentUser', JSON.stringify(currentUser));
                
                document.getElementById('assignedCount').textContent = assignedOrders.length;
                
                document.getElementById('completedOrders').textContent = currentUser.completedOrders;
            }
            
            loadAssignedOrders();
            updateProfileOrderStatus();
            alert('¡Entrega completada exitosamente!');
        }).catch(error => {
            console.error('Error completando pedido:', error);
            alert('Error al completar la entrega: ' + error.message);
        });
    } else {
        console.log('Pedido no encontrado en assignedOrders');
        alert('Pedido no encontrado');
    }
}

function autoCompleteOrder(orderId) {
    if (confirm('🚀 ¿Autocompletar este pedido? Esto simulará una entrega instantánea.')) {
        const order = assignedOrders.find(o => o.id === orderId);
        if (order) {
            fetch(`http://localhost:5050/orders/${orderId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'x-auth-token': localStorage.getItem('driverToken') || ''
                },
                body: JSON.stringify({ status: 'delivered' })
            }).then(response => {
                if (response.ok) {
                    assignedOrders = assignedOrders.filter(o => o.id !== orderId);
                    
                    if (currentUser) {
                        currentUser.completedOrders = (currentUser.completedOrders || 0) + 1;
                        localStorage.setItem('currentUser', JSON.stringify(currentUser));
                        
                        document.getElementById('assignedCount').textContent = assignedOrders.length;
                        
                        document.getElementById('completedOrders').textContent = currentUser.completedOrders;
                    }
                    
                    loadAssignedOrders();
                    updateProfileOrderStatus();
                    alert('🚀 ¡Pedido autocompletado exitosamente!');
                } else {
                    alert('Error al autocompletar el pedido');
                }
            }).catch(error => {
                console.error('Error autocompletando pedido:', error);
                alert('Error de conexión al autocompletar pedido');
            });
        }
    }
}

function updateProfile() {
    const newName = document.getElementById('profileName').value;
    if (newName.trim() !== '') {
        currentUser.name = newName;
        alert('Perfil actualizado exitosamente');
    } else {
        alert('Por favor ingresa un nombre válido');
    }
}

function updateProfileOrderStatus() {
    if (currentUser) {
        document.getElementById('completedOrders').textContent = currentUser.completedOrders || 0;
        
        const pendingOrderDiv = document.getElementById('pendingOrderStatus');
        if (assignedOrders.length > 0) {
            if (pendingOrderDiv) {
                pendingOrderDiv.innerHTML = `
                    <div style="background: #ffeb3b; color: #000; padding: 10px; border-radius: 5px; margin: 10px 0;">
                        <strong>📦 Pedido Pendiente:</strong> ${assignedOrders.length} pedido(s) en progreso
                    </div>
                `;
            }
        } else {
            if (pendingOrderDiv) {
                pendingOrderDiv.innerHTML = '';
            }
        }
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
    console.log('Página de repartidor cargada');
    
    const savedUser = localStorage.getItem('currentUser');
    const savedToken = localStorage.getItem('driverToken');
    
    if (savedUser && savedToken) {
        currentUser = JSON.parse(savedUser);
        document.getElementById('userName').textContent = currentUser.name;
        document.getElementById('profileName').textContent = currentUser.name;
        document.getElementById('profileEmail').textContent = currentUser.username;
        document.getElementById('completedOrders').textContent = 0;
        document.getElementById('averageRating').textContent = 5.0;
        showMainContent();
        showHome();
        console.log('Repartidor logueado automáticamente:', currentUser.name);
    } else {

        showLogin();
    }
});