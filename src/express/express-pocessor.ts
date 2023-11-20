import * as vscode from 'vscode';
import * as path from 'path';
import { extractControllers } from '../service/ai.service';
import { filesRecursive } from '../utils/file-utils';
import { assistantCreator } from '../service/assistant.service';

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
                        vscode.window.showInformationMessage(`controllers: ${controllers }`);
                        // await checkControllers(controllers);
                        
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
                    return; //{ moduleName, functionName, content: viewContent };
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

// const controller =  ['loginUserHandler', 'createUserHandler', 'deleteUserHandler', 'revokeSession', 'getFileHandler', 'streamFileController', 'uploadFileHandler', 'handleCreateFolder', 'markAndDeleteUnsafeFileController', 'getFileHistoryController', 'reviewFile', 'createOrUpdateSession', 'isAdmin']
async function checkControllers(controllers: string[] | undefined) {
    if (!controllers) {
        vscode.window.showErrorMessage('Error identifying express controllers');

        return;
    }

    for (const controller of controllers) {
        try {
            vscode.window.showInformationMessage(`controller: ${controller}`);
            const result = await locateExpressController(controller);
            if (result) {
                vscode.window.showInformationMessage(`Controller ${controller} found`);
            }
        } catch (error) {
            // console.error(`Error checking controller ${controller}: `, error);
            vscode.window.showInformationMessage(`Error checking controller ${controller}: ${error} `);
        }
    }
}

async function extractList(inputText: string[]): Promise<string[]> {
    const inputString = inputText.join(''); // Join the array of strings into a single string
    const startIndex = inputString.indexOf('[');
    const endIndex = inputString.lastIndexOf(']');
  
    if (startIndex === -1 || endIndex === -1) {
      throw new Error('Invalid input format. Could not find [ or ].');
    }
  
    const listSubstring = inputString.substring(startIndex + 1, endIndex);
    const extractedList = listSubstring.split(',').map((item: string) => item.trim());
    const finalList = extractedList.filter((item: string) => item !== '');
  
    return finalList;
  }