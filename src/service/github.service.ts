import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";

import config from '../config/defaults';
import fetch from "node-fetch";

// OAuth App details
const clientId = config.GITHUB_CLIENT_ID;
const clientSecret = config.GITHUB_CLIENTSECRET;
const redirectUri = config.GITHUB_REDIRECT_URL;
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
            fetch: fetch,
        }
    });
export async function authenticateWithGitHub() {

    try {
        const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=repo,workflow`;
        const response = await vscode.env.openExternal(vscode.Uri.parse(loginUrl));
        let accessToken
        // const response = await octokitInstance.request('POST /login/oauth/access_token', {
        //     client_id: clientId,
        //     client_secret: clientSecret,
        //     code: authorizationCode,
        //     redirect_uri: redirectUri,
        // });
        // const accessToken = response.data.access_token;

        // vscode.window.showInformationMessage(`GitHub login user access token: ${accessToken}`);

        // Use the accessToken to perform Git commands or GitHub API requests
        // octokitInstance.auth = {
            // token: accessToken,
            // type: 'token',
        // };

        // Return the authentication session
        return {
            id: 'session-id',
            accessToken: accessToken,
            scopes: ['repo', 'workflow'],
        };
        // const { data } = await octokitInstance.request("/user");
        // vscode.window.showInformationMessage(`GitHub login user access token: ${data}`);

    } catch (error) {
        vscode.window.showInformationMessage(`GitHub login error: ${error}`);
        throw error;
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

export async function commitToGitHubRepository(token: vscode.AuthenticationSession, repoName: string, owner: string, content: string): Promise<void> {
    const octokit = new Octokit({
        auth: token.accessToken,
    });

    // Commit to the repository
    const commitMessage = 'chore: (First Commit) Converted codebase';
    await (octokit.repos as any).createOrUpdateFile({
        owner: owner,
        repo: repoName,
        path: 'test-file.txt',
        message: commitMessage,
        content: Buffer.from(content).toString('base64'), // have to read the documentation and use this feature for codebase implementation
    });
}
