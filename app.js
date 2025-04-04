import 'dotenv/config';
import { google } from 'googleapis';

// Initialize the Google Drive API
const drive = google.drive('v3');

async function getAuthClient() {
  const auth = new google.auth.GoogleAuth({
    keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive']
  });
  return auth.getClient();
}

async function sendOwnershipInvitation(fileId, newOwnerEmail) {
  try {
    console.log('Starting ownership transfer invitation process...');
    const authClient = await getAuthClient();

    // Get file details
    const fileResponse = await drive.files.get({
      auth: authClient,
      fileId: fileId,
      fields: 'name'
    });

    const fileName = fileResponse.data.name;
    console.log(`File: ${fileName}`);
    console.log(`Sending invitation to: ${newOwnerEmail}`);

    // Create permission for new owner
    await drive.permissions.create({
      auth: authClient,
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

    console.log('\n✓ Ownership transfer invitation sent successfully!');
    console.log('\nNext steps for the new owner:');
    console.log('1. Check email for Google Drive notification');
    console.log('2. Open the file using this link:');
    console.log(`   https://drive.google.com/file/d/${fileId}/view`);
    console.log('3. Look for the ownership transfer banner at the top of the page');
    console.log('4. Click "Accept" to become the new owner\n');

  } catch (error) {
    if (error.response?.status === 404) {
      console.error('Error: File not found. Please check the file ID.');
    } else if (error.message.includes('permissions')) {
      console.error('Error: Permission denied. Make sure the service account has access to the file.');
    } else if (error.message.includes('Consent is required')) {

      console.error('\nError was: ', error.message);
      console.error('\nError: Consent is required for the service account.');
      console.error('\nTo fix this, you need to:');
      console.error('1. Go to the Google Cloud Console (https://console.cloud.google.com)');
      console.error('2. Select your project');
      console.error('3. Go to "APIs & Services" > "OAuth consent screen"');
      console.error('4. Make sure your app is properly configured with the following scopes:');
      console.error('   - https://www.googleapis.com/auth/drive');
      console.error('5. If you\'re testing, add your email as a test user');
      console.error('6. Make sure your service account has domain-wide delegation if you\'re using Google Workspace');
      console.error('\nAfter completing these steps, try running the script again.');
    } else {
      console.error('Error:', error.message);
    }
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
