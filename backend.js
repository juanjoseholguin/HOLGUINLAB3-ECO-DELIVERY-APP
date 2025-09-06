const express = require("express")
const cors = require("cors")
const path = require("path")
const multer = require("multer")
const FileSystemDatabase = require("./database/database")

const app = express()

app.use(express.json())
app.use(cors())

app.use('/uploads', express.static(path.join(__dirname, 'uploads')))


const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, path.join(__dirname, 'uploads')),
  filename: (req, file, cb) => {
    const unique = Date.now() + '_' + Math.random().toString(36).slice(2)
    const ext = path.extname(file.originalname || '')
    cb(null, `prod_${unique}${ext}`)
  }
})
const upload = multer({ storage })


const db = new FileSystemDatabase()


db.initializeDefaultData().catch(console.error)

async function createSession(account) {
  return await db.createSession({
    accountId: account.id,
    storeId: account.storeId,
    driverId: account.driverId
  })
}

async function getSession(token) {
  return await db.getSession(token)
}

async function requireStoreAuth(req, res, next) {
  try {
    const token = req.header("x-auth-token")
    if (!token) return res.status(401).send({ message: "Missing auth token" })
    const session = await getSession(token)
    if (!session) return res.status(401).send({ message: "Invalid auth token" })
    
    if (req.params && req.params.id && req.params.id !== session.storeId) {
      return res.status(403).send({ message: "Forbidden for this store" })
    }
    req.storeSession = session
    next()
  } catch (error) {
    res.status(500).send({ message: "Authentication error" })
  }
}

async function requireDriverAuth(req, res, next) {
  try {
    const token = req.header("x-auth-token")
    if (!token) return res.status(401).send({ message: "Missing auth token" })
    const session = await getSession(token)
    if (!session) return res.status(401).send({ message: "Invalid auth token" })
    if (!session.driverId) return res.status(403).send({ message: "Driver authentication required" })
    req.driverSession = session
    next()
  } catch (error) {
    res.status(500).send({ message: "Authentication error" })
  }
}


app.get("/users", async (req, res) => {
  try {
    const users = await db.getAll('users')
    res.status(200).send(users)
  } catch (error) {
    res.status(500).send({ message: "Error fetching users" })
  }
})

app.get("/drivers", async (req, res) => {
  try {
    const drivers = await db.getAll('drivers')
    res.status(200).send(drivers)
  } catch (error) {
    res.status(500).send({ message: "Error fetching drivers" })
  }
})


app.post("/users/register", async (req, res) => {
  try {
    const { name, address, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).send({ message: "Missing required fields" })
    }
    
    if (await db.isUsernameTaken(username)) {
      return res.status(400).send({ message: "Username already exists" })
    }
    
    const userId = `u${Date.now()}_${Math.random().toString(36).slice(2)}`
    const accountId = `ua${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const newUser = { id: userId, role: "consumer", name, address: address || "", username }
    const newAccount = { id: accountId, userId, username, password }
    
    await db.create('users', newUser)
    await db.create('userAccounts', newAccount)
    
    const session = await createSession(newAccount)
    
    res.status(201).send({ user: newUser, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Registration failed" })
  }
})

app.post("/users/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const account = await db.findUserAccount(username, password)
    
    if (!account) {
      return res.status(401).send({ message: "Invalid credentials" })
    }
    
    const user = await db.findUserByAccountId(account.id)
    const session = await createSession({ id: account.id, userId: account.userId })
    res.send({ user, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Login failed" })
  }
})

app.post("/stores/register", async (req, res) => {
  try {
    const { name, description, address, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).send({ message: "Missing required fields" })
    }
    
    if (await db.isUsernameTaken(username)) {
      return res.status(400).send({ message: "Username already exists" })
    }
    
    const storeId = `s${Date.now()}_${Math.random().toString(36).slice(2)}`
    const accountId = `sa${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const newStore = { id: storeId, name, description: description || "", address: address || "", isOpen: true }
    const newAccount = { id: accountId, storeId, username, password }
    
    await db.create('stores', newStore)
    await db.create('storeAccounts', newAccount)
    
    const session = await createSession(newAccount)
    
    res.status(201).send({ store: newStore, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Registration failed" })
  }
})

app.post("/stores/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const account = await db.findStoreAccount(username, password)
    
    if (!account) {
      return res.status(401).send({ message: "Invalid credentials" })
    }
    
    const store = await db.findStoreByAccountId(account.id)
    const session = await createSession(account)
    res.send({ store, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Login failed" })
  }
})

app.post("/drivers/register", async (req, res) => {
  try {
    const { name, phone, vehicle, username, password } = req.body
    if (!name || !username || !password) {
      return res.status(400).send({ message: "Missing required fields" })
    }
    
    if (await db.isUsernameTaken(username)) {
      return res.status(400).send({ message: "Username already exists" })
    }
    
    const driverId = `d${Date.now()}_${Math.random().toString(36).slice(2)}`
    const accountId = `da${Date.now()}_${Math.random().toString(36).slice(2)}`
    
    const newDriver = { id: driverId, name, phone: phone || "", vehicle: vehicle || "", username }
    const newAccount = { id: accountId, driverId, username, password }
    
    await db.create('drivers', newDriver)
    await db.create('driverAccounts', newAccount)
    
    const session = await createSession(newAccount)
    
    res.status(201).send({ driver: newDriver, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Registration failed" })
  }
})

app.post("/drivers/login", async (req, res) => {
  try {
    const { username, password } = req.body
    const account = await db.findDriverAccount(username, password)
    
    if (!account) {
      return res.status(401).send({ message: "Invalid credentials" })
    }
    
    const driver = await db.findDriverByAccountId(account.id)
    const session = await createSession(account)
    res.send({ driver, account: { username }, token: session.token })
  } catch (error) {
    res.status(500).send({ message: "Login failed" })
  }
})

app.get("/stores", async (req, res) => {
  try {
    const stores = await db.getAll('stores')
    res.send(stores)
  } catch (error) {
    res.status(500).send({ message: "Error fetching stores" })
  }
})

app.get("/stores/:id", async (req, res) => {
  try {
    const store = await db.getStoreWithProducts(req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    res.send(store)
  } catch (error) {
    res.status(500).send({ message: "Error fetching store" })
  }
})

app.get("/stores/:id/orders", async (req, res) => {
  try {
    const orders = await db.getAll('orders')
    const filtered = orders.filter(o => o.storeId === req.params.id)
    res.send(filtered)
  } catch (error) {
    res.status(500).send({ message: "Error fetching store orders" })
  }
})

app.patch("/stores/:id/toggle", requireStoreAuth, async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    const updatedStore = await db.update('stores', req.params.id, { isOpen: !store.isOpen })
    res.send(updatedStore)
  } catch (error) {
    res.status(500).send({ message: "Error updating store" })
  }
})

app.post("/stores/:id/products", requireStoreAuth, upload.single('image'), async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    
    const { name, price, stock } = req.body
    if (!name || !price || stock === undefined) {
      return res.status(400).send({ message: "Missing required fields: name, price, stock" })
    }
    
    const product = { 
      id: `p${Date.now()}_${Math.random().toString(36).slice(2)}`, 
      storeId: store.id, 
      name, 
      price, 
      stock: parseInt(stock) || 0,
      imageUrl: req.file ? `/uploads/${req.file.filename}` : undefined
    }
    
    await db.create('products', product)
    res.status(201).send(product)
  } catch (error) {
    res.status(500).send({ message: "Error creating product" })
  }
})

app.patch("/stores/:id/products/:productId/stock", requireStoreAuth, async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    
    const product = await db.getById('products', req.params.productId)
    if (!product || product.storeId !== store.id) {
      return res.status(404).send({ message: "Product not found" })
    }
    
    const { stock } = req.body
    if (stock === undefined) {
      return res.status(400).send({ message: "Stock value is required" })
    }
    
    const updatedProduct = await db.updateProductStock(req.params.productId, parseInt(stock) || 0)
    res.send(updatedProduct)
  } catch (error) {
    res.status(500).send({ message: "Error updating product stock" })
  }
})

app.delete("/stores/:id/products/:productId", requireStoreAuth, async (req, res) => {
  try {
    const store = await db.getById('stores', req.params.id)
    if (!store) return res.status(404).send({ message: "Store not found" })
    
    const product = await db.getById('products', req.params.productId)
    if (!product || product.storeId !== store.id) {
      return res.status(404).send({ message: "Product not found" })
    }
    
    await db.delete('products', req.params.productId)
    res.send({ message: "Product deleted successfully" })
  } catch (error) {
    res.status(500).send({ message: "Error deleting product" })
  }
})

app.get("/products/:id/availability", async (req, res) => {
  try {
    const product = await db.getById('products', req.params.id)
    if (!product) return res.status(404).send({ message: "Product not found" })
    res.send({ productId: product.id, stock: product.stock, available: product.stock > 0 })
  } catch (error) {
    res.status(500).send({ message: "Error checking product availability" })
  }
})

app.get("/orders", async (req, res) => {
  try {
    const orders = await db.getAll('orders')
    res.send(orders)
  } catch (error) {
    res.status(500).send({ message: "Error fetching orders" })
  }
})

app.get("/orders/available", async (req, res) => {
  try {
    const orders = await db.getAll('orders')
    const availableOrders = orders.filter(order => order.status === 'created' || order.status === 'pending')
    res.send(availableOrders)
  } catch (error) {
    res.status(500).send({ message: "Error fetching available orders" })
  }
})

app.post("/orders", async (req, res) => {
  try {
    const { consumerId, storeId, items, address, payment } = req.body
    
    const order = await db.createOrder({
      consumerId,
      storeId,
      items,
      address,
      payment
    })
    
    res.status(201).send(order)
  } catch (error) {
    if (error.message.includes('not found') || error.message.includes('Insufficient stock')) {
      return res.status(400).send({ message: error.message })
    }
    res.status(500).send({ message: "Error creating order" })
  }
})

app.post("/test-accept", async (req, res) => {
  res.json({ message: "Test endpoint working", timestamp: new Date().toISOString() })
})

app.put("/orders/:id", async (req, res) => {
  try {
    console.log('Updating order:', req.params.id, 'with status:', req.body.status);
    const order = await db.getById('orders', req.params.id)
    if (!order) {
      console.log('Order not found:', req.params.id);
      return res.status(404).send({ message: "Order not found" })
    }
    
    const { status } = req.body
    if (!status) {
      console.log('Status is required');
      return res.status(400).send({ message: "Status is required" })
    }
    
    const validStatuses = ['pending', 'confirmed', 'cancelled', 'delivered']
    if (!validStatuses.includes(status)) {
      console.log('Invalid status:', status);
      return res.status(400).send({ message: "Invalid status" })
    }
    
    console.log('Updating order from', order.status, 'to', status);
    const updatedOrder = await db.update('orders', req.params.id, { status })
    console.log('Order updated successfully:', updatedOrder);
    res.send(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    res.status(500).send({ message: "Error updating order" })
  }
})

app.post("/orders/:id/accept", async (req, res) => {
  try {
    console.log('Accepting order:', req.params.id)
    const order = await db.getById('orders', req.params.id)
    console.log('Order found:', order)
    
    if (!order) return res.status(404).send({ message: "Order not found" })
    if (order.status !== "created") return res.status(400).send({ message: "Order not available" })
    
    const updatedOrder = await db.update('orders', req.params.id, {
      status: "accepted",
      driverId: "driver_test" // Por ahora usamos un ID fijo para pruebas
    })
    console.log('Order updated:', updatedOrder)
    res.send(updatedOrder)
  } catch (error) {
    console.error('Error accepting order:', error)
    res.status(500).send({ message: "Error accepting order" })
  }
})

app.post("/orders/:id/pickup", requireDriverAuth, async (req, res) => {
  try {
    const order = await db.getById('orders', req.params.id)
    if (!order) return res.status(404).send({ message: "Order not found" })
    if (order.status !== "accepted") return res.status(400).send({ message: "Order must be accepted first" })
    if (order.driverId !== req.driverSession.driverId) return res.status(403).send({ message: "Not your order" })
    
    const updatedOrder = await db.update('orders', req.params.id, { status: "picked_up" })
    res.send(updatedOrder)
  } catch (error) {
    res.status(500).send({ message: "Error updating order pickup" })
  }
})


app.post("/orders/:id/deliver", requireDriverAuth, async (req, res) => {
  try {
    const order = await db.getById('orders', req.params.id)
    if (!order) return res.status(404).send({ message: "Order not found" })
    if (order.status !== "picked_up") return res.status(400).send({ message: "Order must be picked up first" })
    if (order.driverId !== req.driverSession.driverId) return res.status(403).send({ message: "Not your order" })
    
    const updatedOrder = await db.update('orders', req.params.id, { status: "delivered" })
    res.send(updatedOrder)
  } catch (error) {
    res.status(500).send({ message: "Error updating order delivery" })
  }
})


app.get("/orders/driver/:driverId", requireDriverAuth, async (req, res) => {
  try {
    const orders = await db.getAll('orders')
    const driverOrders = orders.filter(order => order.driverId === req.params.driverId)
    res.send(driverOrders)
  } catch (error) {
    res.status(500).send({ message: "Error fetching driver orders" })
  }
})


app.use(express.static('.'))
app.use('/app1', express.static('app1'))
app.use('/app2', express.static('app2'))
app.use('/app3', express.static('app3'))


const PORT = 5050
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
  console.log(`Consumer App: http://localhost:${PORT}/app1/`)
  console.log(`Store Admin: http://localhost:${PORT}/app2/`)
  console.log(`Driver App: http://localhost:${PORT}/app3/`)
})
