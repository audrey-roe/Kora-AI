import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";
import dotenv from 'dotenv';
import {
    createOAuthAppAuth,
    createOAuthUserAuth,
} from "@octokit/auth-oauth-app"

dotenv.config();



// OAuth App details
const clientId = process.env.GITHUB_CLIENT_ID;
const clientSecret = process.env.GITHUB_CLIENT_SECRET;
const redirectUri = process.env.GITHUB_REDIRECT_URI;
const octokitInstance =
    new Octokit({
        auth: process.env.GITHUB_CLIENT_SECRET,
        timeZone: 'Africa/Lagos',
        baseUrl: 'https://api.github.com',
        log: {
            debug: () => { },
            info: () => { },
            warn: console.warn,
            error: console.error
        },
        request: {
            agent: undefined,
            fetch: undefined,
            timeout: 0
        }
    });


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
                id: 'session-id',
                accessToken: accessToken,
                scopes: ['repo', 'workflow'],
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
    // We may need to use a timer and repeatedly call the /oauth/device/token endpoint
    // Example: https://docs.github.com/en/developers/apps/authorizing-oauth-apps#device-flow
    // Note: Make sure to handle errors and implement appropriate logic
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            resolve({ access_token: '' }); // fill with the actual access token
        }, 5000); // polling interval
    });
}


export async function createGitHubRepository(token: vscode.AuthenticationSession, repoName: string, description: string): Promise<void> {
    const octokit = new Octokit({
        auth: token.accessToken,
    });

    // Create a repository
    const repoCreationResponse = await (octokit.repos as any).createForAuthenticatedUser({ name: repoName, description: description, });
    vscode.window.showInformationMessage(`Repository created: ${repoCreationResponse.data.html_url}`);
}

export async function commitToGitHubRepository(token: vscode.AuthenticationSession, repoName: string, owner: string): Promise<void> {
    const octokit = new Octokit({
        auth: token.accessToken,
    });

    // Commit to the repository
    const commitMessage = 'chore: (First Commit) Boiler Creation';
    await (octokit.repos as any).createOrUpdateFile({
        owner: owner,
        repo: repoName,
        path: 'test-file.txt',
        message: commitMessage,
        content: Buffer.from('Hello, World!').toString('base64'), // have to read the documentation and use this feature for codebase implementation
    });
}
