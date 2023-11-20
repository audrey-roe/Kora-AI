import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { identifyCodebaseFramework } from './service/identity.service';
import { processExpressProject } from './express/express-pocessor';
import { authenticateWithGitHub } from './service/github.service';
import { processDjangoProject } from './django/django-processor';
import { convertCode } from './service/bot.service';
import { getExpressFunctions} from './service/anthropic.service';

// Import the web-streams-polyfill package and define ReadableStream globally: fixes langchain for node error

global.ReadableStream = require('web-streams-polyfill').ReadableStream;

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('kodekraftai.generateDocumentation', async () => {
        vscode.window.showInformationMessage('KodekraftAI is now running!');

        const identifiedFramework = await identifyCodebaseFramework();
        if (identifiedFramework) {
            vscode.window.showInformationMessage(`${identifiedFramework} framework has been identified!`);
            if (identifiedFramework === 'Django') {
                processDjangoProject();
            } else if (identifiedFramework === 'Express') {
                processExpressProject();
            }
        } else {
            vscode.window.showInformationMessage("No framework detected");
        }
    });

    context.subscriptions.push(disposable);


    context.subscriptions.push(vscode.commands.registerCommand('kodekraftai.convertCodebase', async () => {
        let isLoggedIn;

        const session = await vscode.authentication.getSession('github', ['repo', 'workflow', 'read:user']);
        if (session) {
            const isLoggedIn = true;

        } else {
            const isLoggedIn = false;
        }

        if (!isLoggedIn) {
            vscode.window.showInformationMessage('Sign in to Kora AI to use the convert codebase feature!', 'Continue with Github')
                .then((selectedItem) => {
                    if (selectedItem === 'Continue with Github') {
                        authenticateWithGitHub();
                    }
                });
        }
    }));

    // Register the code action provider for specific languages
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(
        ['plaintext', 'python', 'javascript', 'typescript'],
        new PolyglotCodeActionProvider()
    ));

    // Register the command to show the language menu
    context.subscriptions.push(vscode.commands.registerCommand('kodekraftai.showLanguageMenu', () => {
        // Get the active text editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            // Check if there is a selection
            const selection = editor.selection;
            if (!selection.isEmpty) {

                const selectedCode = editor.document.getText(selection);

                handleCodeConversion(selectedCode, editor.document.fileName, editor.document.languageId);
            } else {
                const entireCode = editor.document.getText();

                handleCodeConversion(entireCode, editor.document.fileName, editor.document.languageId);
            }
        }
    }));

}

async function handleCodeConversion(code: string, fileName: string, sourceLanguage: string): Promise<void> {
    const selectedLanguage = await vscode.window.showQuickPick(['JavaScript', 'TypeScript', 'Python']);
    getExpressFunctions();

    if (selectedLanguage) {
        try {
            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Converting code...',
                cancellable: false,
            }, async (progress) => {
                const convertedCode = await getConvertedCode(code, selectedLanguage, fileName, sourceLanguage);

                // Generate the new file name based on the original file name and target language
                const originalFileNameWithoutExt = path.basename(fileName, path.extname(fileName));
                const targetFileExtension = getTargetFileExtension(selectedLanguage);
                const newFileName = `${originalFileNameWithoutExt}_converted.${targetFileExtension}`;

                // Get the directory of the original file
                const originalFileDir = path.dirname(fileName);

                // Create the new file path
                const newFilePath = path.join(originalFileDir, newFileName);

                // Write the converted code to the new file
                fs.writeFileSync(newFilePath, `// code converted from ${sourceLanguage} to ${selectedLanguage}\n\n${convertedCode}`);

                // Open the newly created file
                vscode.workspace.openTextDocument(newFilePath).then((document) => {
                    vscode.window.showTextDocument(document);
                });

                // Show success message
                vscode.window.showInformationMessage('Code converted successfully!');
            });
        } catch (error) {
            // Handle errors related to code conversion
            vscode.window.showErrorMessage(`Error converting code: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}


async function getConvertedCode(code: string, targetLanguage: string, fileName: string, sourceLanguage: string): Promise<string> {
    const targetFileExtension = getTargetFileExtension(targetLanguage);
    const sourceFileExtension = path.extname(fileName).slice(1);

    try {
        code = await convertCode(code, targetLanguage);
    } catch (error) {
        vscode.window.showErrorMessage(`Error converting code: ${error}`);
        throw error;
    }

    return `// check ${path.basename(fileName, path.extname(fileName))}.${targetFileExtension} for the converted code\n\n// Converted from ${sourceLanguage} to ${targetLanguage}\n\n${code}`;
}

function createNewFile(originalFileName: string, targetLanguage: string, convertedCode: string): void {
    // Get the directory and base name of the original file
    const originalFileDir = path.dirname(originalFileName);
    const originalFileNameWithoutExt = path.basename(originalFileName, path.extname(originalFileName));

    // Create a new file name with the target language's extension
    const targetFileExtension = getTargetFileExtension(targetLanguage);
    const newFileName = `${originalFileNameWithoutExt}.${targetFileExtension}`;
    const newFilePath = path.join(originalFileDir, newFileName);

    try {
        // Write the converted code to the new file
        fs.writeFileSync(newFilePath, `// code converted from file.${path.extname(originalFileName).slice(1)} to file.${targetFileExtension}\n\n${convertedCode}`);

        // Open the newly created file
        vscode.workspace.openTextDocument(newFilePath).then((document) => {
            vscode.window.showTextDocument(document);
        });
    } catch (error) {
        // Handle errors related to file creation
        vscode.window.showErrorMessage(`Error creating new file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

/**
 * Represents the code action provider for the Polyglot extension.
 */
class PolyglotCodeActionProvider implements vscode.CodeActionProvider {
    /**
     * Provides code actions for the given document, range, and context.
     *
     * @param {vscode.TextDocument} document - The document in which the code action provider is invoked.
     * @param {vscode.Range | vscode.Selection} range - The range for which code actions are requested.
     * @param {vscode.CodeActionContext} context - The context for the code action request.
     * @returns {vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]>} The list of code actions.
     */
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {

        // Check if there is a selection in the editor
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            const selection = editor.selection;
            if (!selection.isEmpty) {

                // If text is selected, offer the code action to convert the selected code
                const convertAction = new vscode.CodeAction('Kora AI: Convert Selected Code', vscode.CodeActionKind.QuickFix);
                convertAction.command = {
                    title: 'Kora AI: Convert Selected Code',
                    command: 'kodekraftai.showLanguageMenu',
                };
                return [convertAction];
            }
        }

        // If no selection, offer the code action to convert the entire document
        const convertAction = new vscode.CodeAction('Kora AI: Convert Entire Code', vscode.CodeActionKind.QuickFix);
        convertAction.command = {
            title: 'Kora AI: Convert File',
            command: 'kodekraftai.showLanguageMenu',
        };
        return [convertAction];
    }
}

/**
 * Gets the target file extension based on the selected target language.
 *
 * @param {string} targetLanguage - The selected target language.
 * @returns {string} The corresponding file extension.
 */
function getTargetFileExtension(targetLanguage: string): string {
    // Map target languages to file extensions
    const languageExtensions: Record<string, string> = {
        'JavaScript': 'js',
        'Python': 'py',
        'Java': 'java',
        'TypeScript': 'ts',
    };

    // Default to using the language as the extension
    return languageExtensions[targetLanguage] || targetLanguage.toLowerCase();
}


export function deactivate() { }
