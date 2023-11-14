import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('MyExtensionOutput');

// Display an error message in the custom output channel
outputChannel.appendLine('[ERROR] [default] [2023-11-14T16:36:07.447Z] Extension activation failed: "No access to GitHub Copilot found. You are currently logged in as audrey-roe."');

// Display an information message in the custom output channel
outputChannel.appendLine('[INFO] [auth] [2023-11-14T16:36:15.402Z] Invalid copilot token: missing token: 403');

// Show the output channel
outputChannel.show();

// Display an error message
vscode.window.showErrorMessage('Invalid copilot token: missing token: 403');

// Display an information message
vscode.window.showInformationMessage('Extension activation failed: "No access to GitHub Copilot found. You are currently logged in as audrey-roe."');
