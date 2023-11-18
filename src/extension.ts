import * as vscode from 'vscode';
import { identifyCodebaseFramework } from './service/identity.service';
import { processExpressProject } from './express/express-pocessor';
import { identifyDjangoViews } from './django/django-views';
import { generateDocumentation } from './service/assistant.service';
import { authenticateWithGitHub } from './service/github.service';
import { PolyglotCodeActionProvider, getTargetFileExtension } from './actionProvider/polyglot-code-action';
import * as path from 'path';
import * as fs from 'fs';


export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('kodekraftai.generateDocumentation', async () => {
        vscode.window.showInformationMessage('KodekraftAI is now running!'); //helloWorld

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

    const githubDisposable = vscode.commands.registerCommand('kodekraftai.createGitHubRepo', () => {
        authenticateWithGitHub();
    });

    // Register the code action provider for specific languages
    context.subscriptions.push(vscode.languages.registerCodeActionsProvider(
        ['plaintext', 'python', 'javascript', 'java', 'typescript'],
        new PolyglotCodeActionProvider()
    ));

    let polygotDisposable = vscode.commands.registerCommand('kodekraftai.polygot', async () => {
        // Get the entire document's text
        const document = vscode.window.activeTextEditor?.document;
        if (document) {
            const entireCode = document.getText();

            // Show a quick pick menu to choose the target language
            vscode.window.showQuickPick(['JavaScript', 'Python', 'Java', 'TypeScript'])
                .then(async (selectedLanguage) => {
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
                            await createNewFile(document.fileName, selectedLanguage, convertedCode);
                            // Display success message
                            vscode.window.showInformationMessage(`Polyglot: Code successfully converted to ${selectedLanguage} and saved.`);
                        } catch (error) {
                            // Log the error to the output channel
                            logError(error);
                            // Handle errors related to code conversion
                            vscode.window.showErrorMessage(`Error converting code: ${error instanceof Error ? error.message : 'Unknown error'}`);
                        }
                    }
                });
        }
    });

    context.subscriptions.push(polygotDisposable);



}

export function deactivate() { }


async function processDjangoProject() {
    const djangoUrlsFiles = await vscode.workspace.findFiles('**/urls.py');

    for (const file of djangoUrlsFiles) {
        const views = await identifyDjangoViews(file);
        if (views) {
            // Use the 'views' array to generate documentation or perform other tasks.
            generateDocumentation(views);
        }
    }
}


async function identifyExpressRoutes(): Promise<string[] | undefined> {
    const expressRouteFiles = await vscode.workspace.findFiles('**/routes.ts', '**/routes.js');

    if (expressRouteFiles.length === 0) {
        vscode.window.showInformationMessage('No Express route files found, if your routes file exists make sure it is named `routes.ts` or `routes.js` in your Express app.');
        return undefined;
    }

    const routeFilePaths = expressRouteFiles.map(file => file.fsPath);
    vscode.window.showInformationMessage(`Express route files found: ${routeFilePaths.join(', ')}`);

    return routeFilePaths;
}


/**
 * Polyglot Classes, Functions and Methods
 */

function getConvertedCode(code: string, targetLanguage: string, fileName: string, sourceLanguage: string): string {
    // Extract the source file extension
    const targetFileExtension = getTargetFileExtension(targetLanguage);
    const sourceFileExtension = path.extname(fileName).slice(1);

    // Add logic to convert the code to the specified language
    // For simplicity, I'll just return a placeholder string
    return `// check ${path.basename(fileName, path.extname(fileName))}.${targetFileExtension} for the converted code\n\n// Converted from ${sourceLanguage} to ${targetLanguage}\n\n${code}`;
}


async function createNewFile(originalFileName: string, targetLanguage: string, convertedCode: string): Promise<void> {
    // Get the directory and base name of the original file
    const originalFileDir = path.dirname(originalFileName);
    const originalFileNameWithoutExt = path.basename(originalFileName, path.extname(originalFileName));

    // Create a new file name with the target language's extension
    const targetFileExtension = getTargetFileExtension(targetLanguage);
    const newFileName = `${originalFileNameWithoutExt}.${targetFileExtension}`;
    const newFilePath = path.join(originalFileDir, newFileName);

    try {
        // Check if the file already exists
        if (fs.existsSync(newFilePath)) {
            // File with the same name already exists, ask for confirmation or choose a new name
            const choice = await vscode.window.showInformationMessage(
                `A file named ${newFileName} already exists. Do you want to overwrite it?`,
                'Yes',
                'No'
            );

            if (choice === 'No') {
                // Choose a different name or cancel the operation
                return;
            }
        }

        // Write the converted code to the new file
        fs.writeFileSync(newFilePath, convertedCode);

        // Open the newly created file
        const document = await vscode.workspace.openTextDocument(newFilePath);
        vscode.window.showTextDocument(document);
    } catch (error) {
        // Log the error to the output channel
        logError(error);
        // Handle errors related to file creation
        vscode.window.showErrorMessage(`Error creating new file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
}

function logError(error: any): void {
    // Log errors to the output channel
    const outputChannel = vscode.window.createOutputChannel('Polyglot Extension');
    outputChannel.appendLine(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    outputChannel.show(true);
}
