import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";
import dotenv from 'dotenv';

dotenv.config();

// OAuth App details
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri = process.env.GITHUB_REDIRECT_URI;
const octokitInstance = new Octokit();


export async function authenticateWithGitHub() {
    const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,workflow`;
    await vscode.env.openExternal(vscode.Uri.parse(loginUrl));

    // Capture the authorization code (using the onDidChangeWindowState event or other event)
    // Exchange the authorization code for an access token
    const authorizationCode = await vscode.window.showInputBox({ prompt: 'Enter GitHub Authorization Code' });

    if (authorizationCode) {
        try {
            const response = await octokitInstance.request('POST /login/oauth/access_token', {
                client_id: clientId,
                client_secret: clientSecret,
                code: authorizationCode,
                redirect_uri: redirectUri,
            });

            const accessToken = response.data.access_token;

            // Use the accessToken to perform Git commands or GitHub API requests
            // octokitInstance.auth = {
            //     token: accessToken,
            //     type: 'token',
            // };

            // Return the authentication session
            return {
                id: 'your-session-id',
                accessToken: accessToken,
                scopes: ['repo', 'workflow'], // Adjust with the actual scopes
            };
        } catch (error) {
            console.error('GitHub login error:', error);
            throw error;
        }
    } else {
        throw new Error('Authorization code not provided');
    }
}


async function pollForToken(deviceCodeData: any): Promise<any> {
    // Implement polling logic to obtain the access token using deviceCodeData
    // You may need to use a timer and repeatedly call the /oauth/device/token endpoint
    // Example: https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow
    // Note: Make sure to handle errors and implement appropriate logic
    return new Promise((resolve, reject) => {
        // Placeholder logic, replace with actual implementation
        setTimeout(() => {
            resolve({ access_token: 'your-access-token' }); // Replace with the actual access token
        }, 5000); // Adjust the polling interval as needed
    });
}


export async function createGitHubRepository(token: vscode.AuthenticationSession, repoName: string, description: string): Promise<void> {
    const octokit = new Octokit({
        auth: token.accessToken,
    });

    // Create a repository
    const repoCreationResponse = await (octokit.repos as any).createForAuthenticatedUser({ name: repoName, description: description, });
    vscode.window.showInformationMessage(`Repository created: ${repoCreationResponse.data.html_url}`);

    // // Now you can use octokitInstance to perform GitHub API requests
    // const repoCreationResponse = await octokitInstance.repos.createForAuthenticatedUser({
    //     name: 'your-repo-name',
    //     description: 'Your repository description',
    // });
}

export async function commitToGitHubRepository(token: vscode.AuthenticationSession, repoName: string): Promise<void> {
    const octokit = new Octokit({
        auth: token.accessToken,
    });

    // Commit to the repository
    const commitMessage = 'Initial commit';
    await (octokit.repos as any).createOrUpdateFile({
        owner: 'your-username',
        repo: repoName,
        path: 'test-file.txt',
        message: commitMessage,
        content: Buffer.from('Hello, World!').toString('base64'),
    });
}
