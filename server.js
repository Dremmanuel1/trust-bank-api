// Trust Bank API Server
const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'supersecrettoken';

// In-memory data store for bank accounts
const accounts = {};

// Middleware
app.use(cors()); // Enable CORS for all origins
app.use(express.json()); // Enable JSON body parsing

// --- Utility Functions ---
function generateAccountNumber() {
  let accountNumber;
  do {
    accountNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
  } while (accounts[accountNumber]);
  return accountNumber;
}

// --- Admin Middleware ---
// Protects admin endpoints with a simple header token
function verifyAdminToken(req, res, next) {
  const token = req.headers['x-admin-token'];
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(403).json({ error: 'Access Denied: Invalid admin token' });
  }
  next();
}

// --- API Endpoints ---

// Create a new bank account
app.post('/create', (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Account holder name is required' });
  }

  const accountNumber = generateAccountNumber();
  accounts[accountNumber] = {
    accountNumber,
    name,
    balance: 0
  };

  console.log(`New account created for ${name} with number ${accountNumber}`);
  res.status(201).json(accounts[accountNumber]);
});

// Get a single account's details
app.get('/get/:accountNumber', (req, res) => {
  const { accountNumber } = req.params;
  const account = accounts[accountNumber];
  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  res.json(account);
});

// Deposit funds into an account
app.post('/deposit', (req, res) => {
  const { accountNumber, amount } = req.body;
  const account = accounts[accountNumber];

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid deposit amount' });
  }

  account.balance += amount;
  console.log(`Deposited ${amount} into account ${accountNumber}`);
  res.json(account);
});

// Withdraw funds from an account
app.post('/withdraw', (req, res) => {
  const { accountNumber, amount } = req.body;
  const account = accounts[accountNumber];

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }
  if (typeof amount !== 'number' || amount <= 0) {
    return res.status(400).json({ error: 'Invalid withdrawal amount' });
  }
  if (account.balance < amount) {
    return res.status(400).json({ error: 'Insufficient funds' });
  }

  account.balance -= amount;
  console.log(`Withdrew ${amount} from account ${accountNumber}`);
  res.json(account);
});

// --- Admin-only Endpoints ---

// List all accounts (admin only)
app.get('/admin/list', verifyAdminToken, (req, res) => {
  res.json(Object.values(accounts));
});

// Reset an account's balance to zero (admin only)
app.post('/admin/reset', verifyAdminToken, (req, res) => {
  const { accountNumber } = req.body;
  const account = accounts[accountNumber];

  if (!account) {
    return res.status(404).json({ error: 'Account not found' });
  }

  account.balance = 0;
  console.log(`Reset balance for account ${accountNumber}`);
  res.json(account);
});

// Delete an account (admin only)
app.delete('/admin/delete/:accountNumber', verifyAdminToken, (req, res) => {
  const { accountNumber } = req.params;
  if (!accounts[accountNumber]) {
    return res.status(404).json({ error: 'Account not found' });
  }

  delete accounts[accountNumber];
  console.log(`Account ${accountNumber} deleted`);
  res.status(204).send(); // No content
});

// Start the server
app.listen(port, () => {
  console.log(`Trust Bank API listening on port ${port}`);
});
