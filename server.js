const express = require('express');
const gmailOAuth = require('./gmailOAuth');
const gmailOperations = require('./gmailOperations');

const app = express();

app.get('/auth', (req, res) => {
  res.redirect(gmailOAuth.authUrl);
});

app.get('/oauthcallback', async (req, res) => {
  const code = req.query.code;

  const { tokens } = await gmailOAuth.oauth2Client.getToken(code);
  await gmailOperations.setAuthCredentials(tokens);
  console.log('Access Token:', tokens.access_token);
  console.log('Refresh Token:', tokens.refresh_token);
  console.log('Expires in:', tokens.expiry_date);

  res.send('Authentication successful! You can now use the Gmail API.');
});



app.listen(3000,async () => {
  console.log('Server is running on port 3000');
  try {
    await gmailOperations.identifyAndIsolateFirstTimeThreads();
    console.log('Initial identification and isolation of email threads completed.');
  } catch (error) {
    console.error('Error in identifying and isolating threads:', error);
  }
});
