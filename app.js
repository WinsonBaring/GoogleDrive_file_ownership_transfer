import 'dotenv/config';
import { google } from 'googleapis';
import { promises as fs } from 'fs';
import http from 'http';
import open from 'open';

const SCOPES = ['https://www.googleapis.com/auth/drive'];
const TOKEN_PATH = 'token.json';
const REDIRECT_URI = 'http://localhost:3000';

async function getOAuth2Client() {
  const credentials = JSON.parse(process.env.CREDENTIALS);
  const { client_secret, client_id } = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    REDIRECT_URI
  );

  try {
    // Check if we have previously stored a token
    const token = await fs.readFile(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
  } catch (error) {
    // If no token exists, get a new one
    await getNewToken(oAuth2Client);
  }

  return oAuth2Client;
}

async function getNewToken(oAuth2Client) {
  return new Promise((resolve, reject) => {
    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, REDIRECT_URI);
        const code = url.searchParams.get('code');

        if (code) {
          const { tokens } = await oAuth2Client.getToken(code);
          oAuth2Client.setCredentials(tokens);
          await fs.writeFile(TOKEN_PATH, JSON.stringify(tokens));
          console.log('Token stored to', TOKEN_PATH);
          
          res.writeHead(200, { 'Content-Type': 'text/html' });
          res.end('Authentication successful! You can close this window.');
          server.close();
          resolve();
        }
      } catch (error) {
        console.error('Error retrieving access token', error);
        reject(error);
      }
    });

    server.listen(3000, () => {
      const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
      });

      console.log('Authorize this app by visiting this url:', authUrl);
      open(authUrl);
    });
  });
}

async function sendOwnershipInvitation(fileId, newOwnerEmail) {
  try {
    console.log('Starting ownership transfer invitation process...');
    const authClient = await getOAuth2Client();
    const drive = google.drive({ version: 'v3', auth: authClient });

    // Get file details
    const fileResponse = await drive.files.get({
      fileId: fileId,
      fields: 'name, permissions'
    });

    const fileName = fileResponse.data.name;
    console.log(`File: ${fileName}`);
    console.log(`Sending invitation to: ${newOwnerEmail}`);

    // Check if user already has permissions
    const existingPermissions = fileResponse.data.permissions || [];
    const existingPermission = existingPermissions.find(p => p.emailAddress === newOwnerEmail);

    if (existingPermission) {
      console.log('User already has access. Updating their role to owner...');
      // Update existing permission
      await drive.permissions.update({
        fileId: fileId,
        permissionId: existingPermission.id,
        requestBody: {
          role: 'owner',
          pendingOwner: true
        },
        transferOwnership: true,
        moveToNewOwnersRoot: true,
        supportsAllDrives: true
      });
    } else {
      console.log('Creating new permission with owner role...');
      // Create new permission
      await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: 'owner',
          type: 'user',
          emailAddress: newOwnerEmail,
          pendingOwner: true
        },
        transferOwnership: true,
        moveToNewOwnersRoot: true,
        emailMessage: `You are invited to become the owner of the file: ${fileName}. Please open the file and accept the ownership transfer when prompted.`,
        sendNotificationEmail: true,
        supportsAllDrives: true
      });
    }

    console.log('\n✓ Ownership transfer invitation sent successfully!');
    console.log('\nNext steps for the new owner:');
    console.log('1. Check email for Google Drive notification');
    console.log('2. Open the file using this link:');
    console.log(`   https://drive.google.com/file/d/${fileId}/view`);
    console.log('3. Look for the ownership transfer banner at the top of the page');
    console.log('4. Click "Accept" to become the new owner\n');

  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Get configuration
const fileId = process.env.FILE_ID;
const newOwnerEmail = process.env.NEW_OWNER_EMAIL;

// Validate configuration
if (!fileId || !newOwnerEmail) {
  console.error('Error: Please set both FILE_ID and NEW_OWNER_EMAIL in your .env file');
  process.exit(1);
}

// Send the invitation
sendOwnershipInvitation(fileId, newOwnerEmail);
