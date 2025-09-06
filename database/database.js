const fs = require('fs').promises;
const path = require('path');

class FileSystemDatabase {
  constructor(dbPath = './database') {
    this.dbPath = dbPath;
    this.ensureDbDirectory();
  }

  async ensureDbDirectory() {
    try {
      await fs.access(this.dbPath);
    } catch (error) {
      await fs.mkdir(this.dbPath, { recursive: true });
    }
  }

  async readFile(filename) {
    try {
      const filePath = path.join(this.dbPath, filename);
      const data = await fs.readFile(filePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      if (error.code === 'ENOENT') {
        return [];
      }
      throw error;
    }
  }

  async writeFile(filename, data) {
    const filePath = path.join(this.dbPath, filename);
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
  }

  async getAll(collection) {
    return await this.readFile(`${collection}.json`);
  }

  async getById(collection, id) {
    const items = await this.getAll(collection);
    return items.find(item => item.id === id);
  }

  async create(collection, item) {
    const items = await this.getAll(collection);
    items.push(item);
    await this.writeFile(`${collection}.json`, items);
    return item;
  }

  async update(collection, id, updates) {
    const items = await this.getAll(collection);
    const index = items.findIndex(item => item.id === id);
    if (index === -1) {
      throw new Error(`${collection} with id ${id} not found`);
    }
    items[index] = { ...items[index], ...updates };
    await this.writeFile(`${collection}.json`, items);
    return items[index];
  }

  async delete(collection, id) {
    const items = await this.getAll(collection);
    const filteredItems = items.filter(item => item.id !== id);
    await this.writeFile(`${collection}.json`, filteredItems);
    return true;
  }

  async find(collection, predicate) {
    const items = await this.getAll(collection);
    return items.filter(predicate);
  }

  async initializeDefaultData() {
    const users = await this.getAll('users');
    if (users.length > 0) {
      return;
    }

    const defaultUsers = [
      { id: "u1", role: "consumer", name: "Alice", username: "alice", password: "123", address: "123 Main St" }
    ];

    const defaultUserAccounts = [
      { id: "ua1", userId: "u1", username: "alice@gmail.com", password: "password123" }
    ];

    const defaultDrivers = [
      { id: "d1", name: "Bob", username: "bob@gmail.com", password: "driver123", phone: "555-0123", vehicle: "Honda Civic" }
    ];

    const defaultDriverAccounts = [
      { id: "da1", driverId: "d1", username: "bob@gmail.com", password: "driver123" }
    ];

    const defaultStores = [
      { id: "s1", name: "Bodega Central", isOpen: true, description: "Mini market", address: "456 Oak Ave" },
      { id: "s2", name: "Pizza Nova", isOpen: true, description: "Italian pizzas", address: "789 Pine St" },
      { id: "s3", name: "Ollivanders", isOpen: true, description: "Varitas mágicas y artículos de hechicería", address: "Callejón Diagon" },
      { id: "s4", name: "Honeydukes", isOpen: true, description: "Dulces y caramelos mágicos", address: "Hogsmeade" },
      { id: "s5", name: "Flourish & Blotts", isOpen: true, description: "Libros de hechicería y magia", address: "Callejón Diagon" }
    ];

    const defaultStoreAccounts = [
      { id: "sa1", storeId: "s1", username: "bodega@gmail.com", password: "store123" },
      { id: "sa2", storeId: "s2", username: "pizza@gmail.com", password: "pizza123" },
      { id: "sa3", storeId: "s3", username: "ollivanders@gmail.com", password: "varita123" },
      { id: "sa4", storeId: "s4", username: "honeydukes@gmail.com", password: "dulces123" },
      { id: "sa5", storeId: "s5", username: "flourish@gmail.com", password: "libros123" }
    ];

    const defaultProducts = [
      { id: "p1", storeId: "s1", name: "Water 500ml", price: 2.0, stock: 50 },
      { id: "p2", storeId: "s1", name: "Chips", price: 3.5, stock: 25 },
      { id: "p3", storeId: "s2", name: "Pepperoni Pizza", price: 12.0, stock: 10 },
      { id: "p4", storeId: "s3", name: "Varita de Saúco", price: 50.0, stock: 1 },
      { id: "p5", storeId: "s3", name: "Varita de Sauce", price: 25.0, stock: 5 },
      { id: "p6", storeId: "s3", name: "Cristal de Fénix", price: 100.0, stock: 2 },
      { id: "p7", storeId: "s4", name: "Chocolate de la Rana", price: 2.5, stock: 30 },
      { id: "p8", storeId: "s4", name: "Caramelos de Menta", price: 1.75, stock: 50 },
      { id: "p9", storeId: "s4", name: "Galletas de Jengibre", price: 3.25, stock: 25 },
      { id: "p10", storeId: "s4", name: "Pastel de Calabaza", price: 4.50, stock: 15 },
      { id: "p11", storeId: "s5", name: "El Libro de Hechizos", price: 15.0, stock: 10 },
      { id: "p12", storeId: "s5", name: "Historia de la Magia", price: 20.0, stock: 8 },
      { id: "p13", storeId: "s5", name: "Guía de Criaturas Mágicas", price: 18.0, stock: 12 }
    ];

    await this.writeFile('users.json', defaultUsers);
    await this.writeFile('userAccounts.json', defaultUserAccounts);
    await this.writeFile('drivers.json', defaultDrivers);
    await this.writeFile('driverAccounts.json', defaultDriverAccounts);
    await this.writeFile('stores.json', defaultStores);
    await this.writeFile('storeAccounts.json', defaultStoreAccounts);
    await this.writeFile('products.json', defaultProducts);
    await this.writeFile('orders.json', []);
    await this.writeFile('sessions.json', []);
  }

  async createSession(sessionData) {
    const sessions = await this.getAll('sessions');
    const token = `t${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const session = { token, ...sessionData };
    sessions.push(session);
    await this.writeFile('sessions.json', sessions);
    return session;
  }

  async getSession(token) {
    const sessions = await this.getAll('sessions');
    return sessions.find(s => s.token === token);
  }

  async deleteSession(token) {
    const sessions = await this.getAll('sessions');
    const filteredSessions = sessions.filter(s => s.token !== token);
    await this.writeFile('sessions.json', filteredSessions);
  }

  async findUserAccount(username, password) {
    const accounts = await this.getAll('userAccounts');
    return accounts.find(ua => ua.username === username && ua.password === password);
  }

  async findUserByAccountId(accountId) {
    const account = await this.getById('userAccounts', accountId);
    if (!account) return null;
    return await this.getById('users', account.userId);
  }

  async findStoreAccount(username, password) {
    const accounts = await this.getAll('storeAccounts');
    return accounts.find(sa => sa.username === username && sa.password === password);
  }

  async findStoreByAccountId(accountId) {
    const account = await this.getById('storeAccounts', accountId);
    if (!account) return null;
    return await this.getById('stores', account.storeId);
  }

  async getStoreWithProducts(storeId) {
    const store = await this.getById('stores', storeId);
    if (!store) return null;
    
    const products = await this.find('products', p => p.storeId === storeId);
    return { ...store, products };
  }

  async findDriverAccount(username, password) {
    const accounts = await this.getAll('driverAccounts');
    return accounts.find(da => da.username === username && da.password === password);
  }

  async findDriverByAccountId(accountId) {
    const account = await this.getById('driverAccounts', accountId);
    if (!account) return null;
    return await this.getById('drivers', account.driverId);
  }

  async getProductsByStore(storeId) {
    return await this.find('products', p => p.storeId === storeId);
  }

  async updateProductStock(productId, newStock) {
    return await this.update('products', productId, { stock: newStock });
  }

  async getAvailableOrders() {
    return await this.find('orders', o => o.status === 'created');
  }

  async getOrdersByStore(storeId) {
    return await this.find('orders', o => o.storeId === storeId);
  }

  async createOrder(orderData) {
    const products = await this.getAll('products');
    const orderItems = [];
    
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }
      if (product.stock < item.qty) {
        throw new Error(`Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.qty}`);
      }
      orderItems.push({ productId: item.productId, qty: item.qty, price: product.price });
    }

    const order = {
      id: `o${Date.now()}_${Math.random().toString(36).slice(2)}`,
      consumerId: orderData.consumerId,
      storeId: orderData.storeId,
      items: orderItems,
      address: orderData.address,
      payment: orderData.payment,
      status: "created"
    };

    await this.create('orders', order);

    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      await this.updateProductStock(item.productId, product.stock - item.qty);
    }

    return order;
  }

  async isUsernameTaken(username) {
    const userAccounts = await this.getAll('userAccounts');
    const storeAccounts = await this.getAll('storeAccounts');
    const driverAccounts = await this.getAll('driverAccounts');
    
    return userAccounts.some(ua => ua.username === username) ||
           storeAccounts.some(sa => sa.username === username) ||
           driverAccounts.some(da => da.username === username);
  }
}

module.exports = FileSystemDatabase;
