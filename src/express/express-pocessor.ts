import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

import { ControllerDictionary, extractControllers } from '../service/ai.service';
import { filesRecursive } from '../utils/file-utils';
import { generateDocumentation } from '../service/bot.service';

export async function processExpressProject() {
    try {
        const expressRoutes = await identifyExpressRoutes();

        if (expressRoutes) {
            for (const route of expressRoutes) {
                try {
                    const document = await vscode.workspace.openTextDocument(route);
                    const apiResponse = await extractControllers(document);

                    // Extract keys from the dictionary
                    if (apiResponse) {
                        const controllers: string[] = Object.keys(apiResponse);
                        // vscode.window.showInformationMessage(`controllers: ${controllers}`);
                        await checkControllers(controllers, apiResponse);
                        
                    } else {
                        console.log('API response is undefined.');
                    }

                } catch (error) {
                    console.error(`Error opening ${route} for processing:`, error);
                    vscode.window.showErrorMessage(`Error opening ${route} for processing`);
                }
            }
        }
    } catch (error) {
        console.error('Error identifying express routes:', error);
        vscode.window.showErrorMessage('Error identifying express routes');
    }
}

async function identifyExpressRoutes(): Promise<string[] | undefined> {
    const expressRouteFiles = await vscode.workspace.findFiles('**/routes.ts', '**/routes.js');

    if (expressRouteFiles.length === 0) {
        vscode.window.showInformationMessage('No Express route files found, if youhave routes, make sure they are registerd in the `routes.ts` or `routes.js` file in your Express app.');
        return undefined;
    }

    const routeFilePaths = expressRouteFiles.map(file => file.fsPath);
    vscode.window.showInformationMessage(`Express route files found: ${routeFilePaths.join(', ')}`); //Debugging line

    return routeFilePaths;
}

async function locateExpressController(controllerName: string): Promise<{ moduleName: string, functionName: string, content: string } | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Workspace path not found.');
        return undefined;
    }

    const workspacePath = workspaceFolders[0].uri.fsPath;

    const allowedExtensions = ['.ts', '.js'];

    const controllerPath = controllerName.replace(/\./g, path.sep);

    const parts = controllerName.split('.');
    const moduleName = parts.slice(0, -1).join('.');
    const functionName = parts[parts.length - 1];

    const sourceFiles = await filesRecursive(workspacePath, allowedExtensions);

    for (const sourceFile of sourceFiles) {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(sourceFile)).then(buffer => new TextDecoder().decode(buffer));

        const functionRegex = new RegExp(`(?:\\b${functionName}\\s*=\\s*(?:async\\s*)?\\([^)]*\\)\\s*=>\\s*|\\b${functionName}\\s*\\([^)]*\\)\\s*(?:=>\\s*|\\{\\s*)|\\bconst\\s+${functionName}\\s*\\=|\\bexport\\s+(?:async\\s+)?(?:function\\s+)?(?:const\\s+)?\\b${functionName}\\s*\\(\\s*|\\b${functionName}\\s*\\(\\s*)`, 'g');

        const matches = content.match(functionRegex);

        if (matches) {
            for (const match of matches) {
                // Find the end of the function block
                const startIndex = content.indexOf(match);
                const endOfBlock = findEndOfBlock(content, startIndex);

                if (endOfBlock !== -1) {
                    const viewContent = content.substring(startIndex, endOfBlock + 1);
                    vscode.window.showInformationMessage(`Module name: ${moduleName}, Function name: ${functionName}, Content: ${viewContent}`);
                    return { moduleName, functionName, content: viewContent };
                }
            }
        }
    }

    vscode.window.showErrorMessage(`Controller function for ${controllerName} not found.`);
    return undefined;
}

// Function to find the ending of a block in TypeScript or JavaScript file
function findEndOfBlock(content: string, startIndex: number): number {
    let openBraces = 0;
    let i = startIndex;

    while (i < content.length) {
        if (content[i] === '{') {
            openBraces++;
        } else if (content[i] === '}') {
            openBraces--;

            if (openBraces === 0) {
                return i;
            }
        }

        i++;

        // If a closing brace is encountered before an opening brace, break to avoid false positives
        if (openBraces < 0) {
            break;
        }
    }

    return -1; // Not found
}

let documentationFileCreated = false;
async function checkControllers(controllers: string[] | undefined, apiResponse: ControllerDictionary) {
    if (!controllers) {
        vscode.window.showErrorMessage('Error identifying express controllers');
        return;
    }

    for (const controller of controllers) {
        try {
            // vscode.window.showInformationMessage(`controller: ${controller}`);

            // Check if the controller exists in apiResponse
            if (apiResponse.hasOwnProperty(controller)) {
                const [endpointURL, method, functionName] = apiResponse[controller];

                const result = await locateExpressController(controller);

                if (result) {
                    const documentation = await generateDocumentation(functionName, method, endpointURL, result.content);

                    vscode.window.showInformationMessage(`${functionName} ${method} ${endpointURL} ${result.content}`);
                    appendDocumentationToMarkdown(documentation);

                }
            } else {
                vscode.window.showWarningMessage(`Controller ${controller} not found in API response.`);
            }
        } catch (error) {
            vscode.window.showErrorMessage(`Error checking controller ${controller}: ${error} `);
        }
    }
}


function appendDocumentationToMarkdown(documentation: string) {
    try {
        // Get the root path of the workspace
        const workspaceRoot = vscode.workspace.rootPath;

        if (!workspaceRoot) {
            vscode.window.showErrorMessage('No workspace is open.');
            return;
        }

        // Generate the filename
        const fileName = `${workspaceRoot}/documentation.md`;

        // If the documentation file hasn't been created in this execution, create it
        if (!documentationFileCreated && !fs.existsSync(fileName)) {
            fs.writeFileSync(fileName, ''); // Create an empty file
            documentationFileCreated = true;
        }

        // Append the generated documentation to the Markdown file
        fs.appendFileSync(fileName, documentation + '\n\n');
    } catch (error) {
        vscode.window.showErrorMessage(`Error appending documentation to file: ${error}`);
        throw error;
    }
}



