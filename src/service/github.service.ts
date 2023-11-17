import * as vscode from 'vscode';
import { Octokit } from "@octokit/rest";

import config from '../config/defaults';
import fetch from "node-fetch";

// OAuth App details
const clientId = config.GITHUB_CLIENT_ID;
const clientSecret = config.GITHUB_CLIENTSECRET;
const redirectUri = config.GITHUB_REDIRECT_URL;
const octokitInstance = new Octokit({
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
        const loginUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}&scope=read:user,repo,workflow`;

        await vscode.env.openExternal(vscode.Uri.parse(loginUrl));

        const code = await vscode.window.showInputBox({
            prompt: 'Enter the code from GitHub authentication',
            ignoreFocusOut: true,
        });

        if (!code) {
            throw new Error('GitHub authentication code not provided.');
        }

        const accessTokenResponse = await exchangeCodeForAccessToken(code, clientId, redirectUri);

        const accessToken = accessTokenResponse.access_token;

        vscode.window.showInformationMessage(`GitHub login user access token: ${accessToken}`);

        octokitInstance.auth = async () => {
            return {
                token: accessToken,
                type: 'token',
            };
        };

        return {
            id: 'session-id',
            accessToken: accessToken,
            scopes: ['repo', 'workflow'],
        };
    } catch (error:any) {
        vscode.window.showInformationMessage(`GitHub login error: ${error.message}`);
        throw error;
    }
}

async function exchangeCodeForAccessToken(code: string, clientId: string, redirectUri: string) {
    const tokenUrl = 'https://github.com/login/oauth/access_token';
    const response = await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'Exchanging GitHub code for access token',
        cancellable: false,
    }, async () => {
        const data = new URLSearchParams({
            client_id: clientId,
            redirect_uri: redirectUri,
            code: code,
        });

        const result = await fetch(tokenUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: data,
        });

        if (!result.ok) {
            throw new Error(`Failed to exchange code for access token: ${result.statusText}`);
        }

        return result.json();
    });

    return response;
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
