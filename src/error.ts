import * as vscode from 'vscode';

const outputChannel = vscode.window.createOutputChannel('Kora AI Output Channel');

outputChannel.appendLine('');

outputChannel.appendLine('');

outputChannel.show();

vscode.window.showErrorMessage('Invalid token: missing token: 403');

vscode.window.showInformationMessage('');
