const express = require("express");
const app = express();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();

const PORT = process.env.PORT || 8000;

// ---------------------- Middlewares ---------------------- //
app.use(cors());
app.use(express.json());

// ---------------------- MongoDB Connection ---------------------- //
mongoose.connect(process.env.MONGO_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
  .then(() => console.log("✅ MongoDB Connected"))
  .catch(err => console.log("❌ MongoDB Connection Error:", err));

// ---------------------- Image Upload ---------------------- //
const storage = multer.diskStorage({
  destination: "./upload/images",
  filename: (req, file, cb) => {
    cb(null, `${file.fieldname}_${Date.now()}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

app.post("/upload", upload.single("product"), (req, res) => {
  res.json({
    success: 1,
    image_url: `/images/${req.file.filename}`,
  });
});

app.use("/images", express.static(path.join(__dirname, "upload/images")));

// ---------------------- Auth Middleware ---------------------- //
const fetchuser = async (req, res, next) => {
  const token = req.header("auth-token");
  if (!token) return res.status(401).json({ errors: "Please authenticate using a valid token" });

  try {
    const data = jwt.verify(token, "secret_ecom");
    req.user = data.user;
    next();
  } catch (error) {
    res.status(401).json({ errors: "Please authenticate using a valid token" });
  }
};

// ---------------------- Mongo Schemas ---------------------- //
const Users = mongoose.model("Users", {
  name: String,
  email: { type: String, unique: true },
  password: String,
  cartData: Object,
  date: { type: Date, default: Date.now },
});

const Product = mongoose.model("Product", {
  id: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  image: { type: String, required: true },
  category: { type: String, required: true },
  new_price: Number,
  old_price: Number,
  date: { type: Date, default: Date.now },
  avilable: { type: Boolean, default: true },
});

// ---------------------- API Routes ---------------------- //

// Test route
app.get("/api", (req, res) => res.send({ message: "API is working!" }));

// Login
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await Users.findOne({ email });
  if (!user) return res.status(400).json({ success: false, errors: "User not found" });

  if (user.password !== password)
    return res.status(400).json({ success: false, errors: "Invalid password" });

  const token = jwt.sign({ user: { id: user.id } }, "secret_ecom");
  res.json({ success: true, token });
});

// Signup
app.post("/api/signup", async (req, res) => {
  const { username, email, password } = req.body;
  let existing = await Users.findOne({ email });
  if (existing) return res.status(400).json({ success: false, errors: "User already exists" });

  const cart = {};
  for (let i = 0; i < 300; i++) cart[i] = 0;

  const user = new Users({ name: username, email, password, cartData: cart });
  await user.save();

  const token = jwt.sign({ user: { id: user.id } }, "secret_ecom");
  res.json({ success: true, token });
});

// Products
app.get("/api/allproducts", async (req, res) => {
  const products = await Product.find({});
  res.json(products);
});

app.get("/api/newcollections", async (req, res) => {
  const products = await Product.find({});
  res.json(products.slice(-8));
});

app.get("/api/popularinwomen", async (req, res) => {
  const products = await Product.find({ category: "women" }).limit(4);
  res.json(products);
});

app.post("/api/relatedproducts", async (req, res) => {
  const { category } = req.body;
  const products = await Product.find({ category }).limit(4);
  res.json(products);
});

// Cart
app.post("/api/addtocart", fetchuser, async (req, res) => {
  const userData = await Users.findById(req.user.id);
  userData.cartData[req.body.itemId] += 1;
  await userData.save();
  res.json({ success: true });
});

app.post("/api/removefromcart", fetchuser, async (req, res) => {
  const userData = await Users.findById(req.user.id);
  if (userData.cartData[req.body.itemId] > 0) userData.cartData[req.body.itemId] -= 1;
  await userData.save();
  res.json({ success: true });
});

app.post("/api/getcart", fetchuser, async (req, res) => {
  const userData = await Users.findById(req.user.id);
  res.json(userData.cartData);
});

// Admin
app.post("/api/addproduct", async (req, res) => {
  const products = await Product.find({});
  const id = products.length ? products[products.length - 1].id + 1 : 1;

  const product = new Product({ id, ...req.body });
  await product.save();
  res.json({ success: true, name: req.body.name });
});

app.post("/api/removeproduct", async (req, res) => {
  await Product.findOneAndDelete({ id: req.body.id });
  res.json({ success: true, name: req.body.name });
});

// ---------------------- Serve React Frontend ---------------------- //
const frontendPath = path.join(__dirname, "../frontend/build");
app.use(express.static(frontendPath));

app.get("*", (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

// ---------------------- Start Server ---------------------- //
app.listen(PORT, () => console.log(`✅ Server running on http://localhost:${PORT}`));
