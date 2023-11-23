const express = require('express');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const bodyParser = require('body-parser');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(bodyParser.json());

const users = {};

app.post('/register', (req, res) => {
  const { username } = req.body;
  const secret = speakeasy.generateSecret({ length: 20, name: "MFA do meu mano Claudio." });

  users[username] = { secret: secret.base32 };

  // Generate a QR code for the user to scan with the Microsoft Authenticator app
  const otpauth_url = secret.otpauth_url;
  QRCode.toDataURL(otpauth_url, (err, data_url) => {
    res.json({ secret: secret.base32, otpauth_url, qrcode: data_url });
  });
});

app.post('/verify', (req, res) => {
  const { username, token } = req.body;

  if (!users[username]) {
    return res.status(404).json({ error: 'User not found' });
  }

  const { secret } = users[username];

  const verified = speakeasy.totp.verify({
    secret,
    encoding: 'base32',
    token,
    window: 2, // Allow a time window of 2 intervals (adjust as needed)
  });

  if (verified) {
    res.json({ success: true, message: 'MFA successfully verified' });
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
