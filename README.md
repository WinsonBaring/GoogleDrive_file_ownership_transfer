# Google Drive File Ownership Transfer

A simple Node.js application to transfer Google Drive file ownership using the Google Drive API.

## Prerequisites

1. Node.js installed on your system
2. A Google Cloud Project with the Google Drive API enabled
3. Service Account credentials from Google Cloud Console

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file in the root directory with the following variables:
```
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/service-account-key.json
FILE_ID=your_file_id_here
NEW_OWNER_EMAIL=new_owner@example.com
```

3. Get your Google Drive file ID:
   - Open the file in Google Drive
   - The file ID is in the URL: `https://drive.google.com/file/d/FILE_ID_HERE/view`

## Usage

Run the application:
```bash
npm start
```

## Important Notes

- The service account must have permission to transfer ownership of the file
- The new owner must have a Google account
- The file ID must be correct and accessible to the service account
- The new owner will receive an email notification about the ownership transfer

## Error Handling

The application includes basic error handling and will display appropriate error messages if:
- Environment variables are missing
- Authentication fails
- File ID is invalid
- Permission issues occur 