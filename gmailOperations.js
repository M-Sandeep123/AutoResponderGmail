const { google } = require('googleapis');
const dotenv = require('dotenv');

dotenv.config();

const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3000/oauthcallback';

const oauth2Client = new google.auth.OAuth2(
  CLIENT_ID,
  CLIENT_SECRET,
  REDIRECT_URI
);
const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
const SCOPES = ['https://www.googleapis.com/auth/gmail.modify'];

async function setAuthCredentials(tokens) {
    try {
      oauth2Client.setCredentials(tokens);
      return true;
    } catch (error) {
      console.error('Error setting auth credentials:', error);
      return false;
    }
  }

async function fetchEmailThreads() {
    try {
      const response = await gmail.users.threads.list({
        userId: 'me',
        q: 'is:inbox',
      });
      return response.data.threads || [];
    } catch (error) {
      console.error('Error fetching email threads:', error);
      return [];
    }
  }

async function identifyAndIsolateFirstTimeThreads() {
  try {
    const threads = await fetchEmailThreads();
    threads.forEach(async (thread) => {
      const hasResponded = await checkIfResponded(thread);
      console.log("I'm herere**********debugging");
      if (!hasResponded) {
        console.log("I'm inside ***************************")
        const messageId = thread.messages[0].id;
        await sendReply(messageId);
        await addLabel(thread);
      }
    });
  } catch (error) {
    console.error('Error in identifying and isolating threads:', error);
  }
}

async function checkIfResponded(thread) {
  try {
    const messages = await gmail.users.messages.list({
      userId: 'me',
      q: `from:${thread.messages[0].from.emailAddress}`,
    });
    return messages.data.messages.some((msg) => {
      return msg.payload.headers.some((header) => {
        return header.name === 'From' && header.value.includes('mudigondasandeep01@gmail.com');
      });
    });
  } catch (error) {
    console.error('Error in checking if responded:', error);
    return false;
  }
}

async function sendReply(messageId) {
    try {
      const message = "This is an auto-generated reply.";
      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          threadId: messageId,
          raw: Buffer.from(
            `From: mudigondasandeep01@gmail.com\r\nTo: sandeepstark01@gmail.com\r\nSubject: Re: AutomaticEmailSender\r\n\r\n${message}`
          ).toString('base64'),
        },
      });
      console.log('Reply sent:', response.data);
    } catch (error) {
      console.error('Error in sending reply:', error);
    }
  }
  

async function addLabel(thread) {
  try {
    const response = await gmail.users.messages.modify({
      userId: 'me',
      id: thread.id,
      requestBody: {
        addLabelIds: ['AutoMaticEmailSender_first_LABEL_ID'], 
      },
    });
    console.log('Label added:', response.data);
  } catch (error) {
    console.error('Error in adding label:', error);
  }
}

module.exports = {
  identifyAndIsolateFirstTimeThreads,
  setAuthCredentials
};
