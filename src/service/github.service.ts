import * as vscode from 'vscode';
import * as octokit from '@octokit/rest'; 
import { Octokit } from "@octokit/rest"; 

// OAuth App details
const clientId = 'YOUR_CLIENT_ID';
const clientSecret = 'YOUR_CLIENT_SECRET';
const redirectUri = 'YOUR_REDIRECT_URI';

// GitHub API configuration
const octokitInstance = new octokit.Octokit();

export async function authenticateWithGitHub() {
  // Open GitHub login page
  const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo`;
  await vscode.env.openExternal(vscode.Uri.parse(loginUrl));

  // Capture the authorization code (using the onDidChangeWindowState event or other event)
  // Exchange the authorization code for an access token
  const authorizationCode = await vscode.window.showInputBox({ prompt: 'Enter GitHub Authorization Code' });

  if (authorizationCode) {
    const { data } = await octokitInstance.oauthAuthorizations.createAuthorization({
      client_id: clientId,
      client_secret: clientSecret,
      code: authorizationCode,
    });

    const accessToken = data.access_token;
    
    // Use the accessToken to perform Git commands or GitHub API requests
    octokitInstance.authenticate({
      type: 'token',
      token: accessToken,
    });

    // Now you can use octokitInstance to perform GitHub API requests
    const repoCreationResponse = await octokitInstance.repos.createForAuthenticatedUser({
      name: 'your-repo-name',
      description: 'Your repository description',
    });

    vscode.window.showInformationMessage(`Repository created: ${repoCreationResponse.data.html_url}`);
  }
}
