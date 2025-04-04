import 'dotenv/config';
import { google } from 'googleapis';

// Initialize the Google Drive API
const drive = google.drive('v3');

// Function to authenticate with Google
async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  return auth.getClient();
}

// Function to transfer file ownership
async function transferFileOwnership(fileId, newOwnerEmail) {
  try {
    const authClient = await getAuthClient();
    
    // First, add the new owner as a writer
    await drive.permissions.create({
      auth: authClient,
      fileId: fileId,
      requestBody: {
        role: 'writer',
        type: 'user',
        emailAddress: newOwnerEmail,
        pendingOwner: true
      },
      fields: 'id'
    });

    // Then, transfer ownership
    await drive.permissions.update({
      auth: authClient,
      fileId: fileId,
      permissionId: 'anyoneWithLink',
      requestBody: {
        role: 'owner',
        type: 'user',
        emailAddress: newOwnerEmail
      },
      transferOwnership: true
    });

    console.log(`Successfully transferred ownership to ${newOwnerEmail}`);
  } catch (error) {
    console.error('Error transferring ownership:', error.message);
    throw error;
  }
}

// Example usage
const fileId = process.env.FILE_ID;
const newOwnerEmail = process.env.NEW_OWNER_EMAIL;

if (!fileId || !newOwnerEmail) {
  console.error('Please set FILE_ID and NEW_OWNER_EMAIL in your .env file');
  process.exit(1);
}

transferFileOwnership(fileId, newOwnerEmail)
  .then(() => console.log('Ownership transfer completed'))
  .catch(error => console.error('Failed to transfer ownership:', error));