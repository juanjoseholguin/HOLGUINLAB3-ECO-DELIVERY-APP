
document.addEventListener("DOMContentLoaded", () => {
  const role = localStorage.getItem("role"); 
  if (!role) return;

  if (role === "user") initUser();
  if (role === "store") initStore();
  if (role === "driver") initDriver();
});


function initUser() {
  fetch("/orders?consumerId=" + localStorage.getItem("userId"))
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById("userOrders");
      container.innerHTML = "";
      orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-card";
        div.innerHTML = `
          <p><b>Pedido #${order.id}</b> - Estado: ${order.status}</p>
          ${order.items.map(i => `
            <div class="item">
              <span>${i.name} x${i.quantity}</span>
              ${i.imageUrl ? `<img src="${i.imageUrl}" class="food-photo"/>` : ""}
            </div>
          `).join("")}
        `;
        container.appendChild(div);
      });
    });
}


function initStore() {
  fetch("/orders?storeId=" + localStorage.getItem("storeId"))
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById("storeOrders");
      container.innerHTML = "";
      orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-card";
        div.innerHTML = `
          <p><b>Pedido #${order.id}</b> - Estado: ${order.status}</p>
        `;
        container.appendChild(div);
      });
    });
}


function initDriver() {
  const driverId = localStorage.getItem("driverId");


  fetch("/orders?driverId=" + driverId)
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById("driverOrders");
      container.innerHTML = "<h3>Mis pedidos</h3>";
      orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-card";
        div.innerHTML = `
          <p><b>Pedido #${order.id}</b> - Estado: ${order.status}</p>
        `;
        container.appendChild(div);
      });
    });


  fetch("/orders/available")
    .then(res => res.json())
    .then(orders => {
      const container = document.getElementById("availableOrders");
      container.innerHTML = "<h3>Pedidos pendientes</h3>";
      orders.forEach(order => {
        const div = document.createElement("div");
        div.className = "order-card";
        div.innerHTML = `
          <p><b>Pedido #${order.id}</b></p>
          <button onclick="acceptOrder(${order.id})">Aceptar pedido</button>
        `;
        container.appendChild(div);
      });
    });
}

function acceptOrder(orderId) {
  const driverId = localStorage.getItem("driverId");
  fetch(`/orders/${orderId}/accept`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ driverId })
  })
    .then(() => location.reload());
}
