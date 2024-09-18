// app.js
const express = require('express');
const connectDB = require('./config/db');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const adminRoutes = require('./routes/adminRoutes');
const session = require('express-session');
const path = require('path');

const adminUser = {
  teamName: 'admin',
  passwordHash: 'admin123' // Pre-hashed password
};

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended:true}));

// Session middleware
app.use(session({
  secret: 'secret-key',
  resave: false,
  saveUninitialized: true,
}));

// Set View engine to ejs

app.set('view engine', 'ejs');
//app.set('views');

// Basic route
app.get('/', (req, res) => {
  res.send('API is running...');
});

app.get('/register', async(req, res) => {
  console.log("Registration");
  res.status(200).send("Registration Page");
});

// Register route
app.post('/register', async (req, res) => {
  console.log("Registration");
  const { name, email, password, role } = req.body;
  

  try {
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    user = new User({ name, email, password, role });

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);

    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

app.get('/login', async (req,res) => {
    console.log('Login Page');
    res.render('login');
});

// Login route
// app.post('/login', async (req, res) => {
//   const { email, password } = req.body;

//   try {
//     let user = await User.findOne({ email });
//     if (!user) return res.status(400).json({ message: 'Invalid credentials' });

//     const isMatch = await bcrypt.compare(password, user.password);
//     if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

//     const payload = { user: { id: user.id } };
//     const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1h' });

//     res.json({ token });
//   } catch (err) {
//     console.error(err.message);
//     res.status(500).send('Server error');
//   }
// });

// Middleware to check if user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.isAuthenticated) {
      return next();
  }
  res.redirect('/login');
}


// Admin Login Route
// app.get('/login', (req, res) => {
//   res.render('login');
// });

app.post('/login', (req, res) => {
  const { teamName, password } = req.body;
  console.log(`${teamName}`);
  console.log(`${adminUser.teamName}`);
  console.log(`${password}`);
  console.log(`${adminUser.passwordHash}`);
  
  if (teamName === adminUser.teamName && password === adminUser.passwordHash) {
      req.session.isAuthenticated = true;
      res.redirect('/admin');
  } else {
      res.send('Invalid username or password');
  }
});

// Admin Panel (protected)
app.get('/admin', isAuthenticated, (req, res) => {
  res.render('admin');
});

// Admin Logout
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Admin routes
//app.use('/admin', adminRoutes);


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));