import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { identifyCodebaseFramework } from './service/identity.service';
import { processExpressProject } from './express/express-pocessor';
import { authenticateWithGitHub } from './service/github.service';
import { processDjangoProject } from './django/django-processor';

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

    const githubDisposable = vscode.commands.registerCommand('kodekraftai.loginGithub', () => {
        authenticateWithGitHub();
    });

    let polygotDisposable = vscode.commands.registerCommand('kodekraftai.polygot', () => {
        vscode.window.showInformationMessage('New command is executed!');
        // Add your logic for the new command here
    });

    const checkLoginCommand = vscode.commands.registerCommand('kodekraftai.convertCodebase', async () => {
        let isLoggedIn;

        const session = await vscode.authentication.getSession('github', ['repo', 'workflow', 'read:user']);
        if (session) {
            const isLoggedIn = true

        } else {
            const isLoggedIn = false
        }

        if (!isLoggedIn) {
            vscode.window.showInformationMessage('Sign in to Kora AI to use the convert codebase feature!', 'Continue with Github')
                .then((selectedItem) => {
                    if (selectedItem === 'Continue with Github') {
                        authenticateWithGitHub();
                    }
                });
        }
    });


    // Register the code action provider for specific languages
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(
        ['plaintext', 'python', 'javascript', 'java', 'typescript'],
        new PolyglotCodeActionProvider()
    ));

    // Register the command to show the language menu
    context.subscriptions.push(vscode.commands.registerCommand('kodekraftai.showLanguageMenu', () => {
        // Get the entire document's text
        const document = vscode.window.activeTextEditor?.document;
        if (document) {
            const entireCode = document.getText();

            // Show a quick pick menu to choose the target language
            vscode.window.showQuickPick(['JavaScript', 'Python', 'Java', 'TypeScript'])
                .then((selectedLanguage) => {
                    if (selectedLanguage) {
                        try {
                            // Replace the code with a placeholder code in the selected language
                            const convertedCode = getConvertedCode(entireCode, selectedLanguage, document.fileName, document.languageId);
                            vscode.window.activeTextEditor?.edit((editBuilder) => {
                                editBuilder.replace(
                                    new vscode.Range(
                                        new vscode.Position(0, 0),
                                        document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end
                                    ),
                                    convertedCode
                                );
                            });

                            // Create a new file with the converted code
                            createNewFile(document.fileName, selectedLanguage, convertedCode);
                        } catch (error) {
                            // Handle errors related to code conversion
                            vscode.window.showErrorMessage(`Error converting code: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    }
                });
        }
    }));

    context.subscriptions.push(polygotDisposable);
    context.subscriptions.push(checkLoginCommand);

}
function getConvertedCode(code: string, targetLanguage: string, fileName: string, sourceLanguage: string): string {
    // Extract the source file extension
    const targetFileExtension = getTargetFileExtension(targetLanguage);
    const sourceFileExtension = path.extname(fileName).slice(1);

    // Add logic to convert the code to the specified language
    // For simplicity, I'll just return a placeholder string
    return `// check file.${targetFileExtension} for the converted code\n\n// Converted from ${sourceLanguage} to ${targetLanguage}\n\n${code}`;
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
        console.log('Code action provider invoked.');

        // Offer a code action to convert the code to a specific language
        const convertAction = new vscode.CodeAction('Kora AI: Convert Selected Code', vscode.CodeActionKind.QuickFix);
        convertAction.command = {
            title: 'Kora AI: Convert Selected Code',
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


