import * as vscode from 'vscode';
import * as path from 'path';
import { filesRecursive } from './file-utils';

export async function locateViewFunction(viewName: string): Promise<{ moduleName: string, functionName: string, content: string } | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Workspace path not found.');
        return undefined;
    }

    // Assuming the first folder is the root of the workspace
    const workspacePath = workspaceFolders[0].uri.fsPath;

    const allowedExtensions = ['.py'];

    const viewPath = viewName.replace(/\./g, path.sep);

    const parts = viewName.split('.');
    const moduleName = parts.slice(0, -1).join('.');
    const functionName = parts[parts.length - 1];

    const pythonFiles = await filesRecursive(workspacePath, allowedExtensions);
    const viewFunctionRegex = new RegExp(`(?:def\\s+${functionName}\\s*\\([^:]*:\\s*|class\\s+${functionName}\\s*(?:\\([^)]*\\))?\\s*(?:\\b(?:APIView)\\b)?\\s*:\\s*)[^]*?(?=(?:\\s*class\\s+|\\s*def\\s+))|(?=$)`, 'g');

    for (const pythonFile of pythonFiles) {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pythonFile)).then(buffer => new TextDecoder().decode(buffer));

        const index = content.indexOf(`def ${functionName}(`);
        const index2 = content.indexOf(`class ${functionName}(`);
        const index3 = content.indexOf(`class ${functionName}(APIView)`);

        if (index !== -1) {
            // Handle def ${functionName}(
            const endOfFunction = await findEndOfFunction(content, index);
            const viewContent = content.substring(index, endOfFunction + 1);

            vscode.window.showInformationMessage(`Module name: ${moduleName}, Function name: ${functionName}, Content: ${viewContent}`);
            return { moduleName, functionName, content: viewContent };
        } else if (index2 !== -1) {
            // Handle class ${functionName}(
            let i = index2;
            while (i < content.length) {
                if (content[i] === ':') {
                    const endOfClass = await findEndOfFunction(content, i);
                    const viewContent = content.substring(index2, endOfClass + 1);

                    vscode.window.showInformationMessage(`Module name: ${moduleName}, Class name: ${functionName}, Content: ${viewContent}`);
                    return { moduleName, functionName, content: viewContent };
                }
                i++;
            }
        } else if (index3 !== -1) {
            // Handle class ${functionName}(APIView)
            let i = index3;
            while (i < content.length) {
                if (content[i] === ':') {
                    const endOfFunction = await findEndOfFunction(content, i);
                    const viewContent = content.substring(index3, endOfFunction + 1);

                    vscode.window.showInformationMessage(`Module name: ${moduleName}, Class name: ${functionName}, Content: ${viewContent}`);
                    return { moduleName, functionName, content: viewContent };
                }
                i++;
            }
        }
    }

    vscode.window.showErrorMessage(`View function for ${viewName} not found.`);
    return undefined;
}

// finding end of python function
export function findEndOfFunction(content: string, startIndex: number): number {
    let openBraces = 0;
    let i = startIndex;
    let insideFunction = false;
    let initialIndentation: number | null = null;
    let functionContent = '';

    while (i < content.length) {
        if (content[i] === '(') {
            openBraces++;
            insideFunction = true;
        } else if (content[i] === ')') {
            openBraces--;

            if (openBraces === 0 && insideFunction) {
                if (content[i + 1] === '\n') {
                    if (initialIndentation === null) {
                        initialIndentation = findIndentationLevel(content, startIndex);
                    }

                    let nextLineIndex = i + 2;
                    let nextLineIndentation = 0; 

                    while (nextLineIndex < content.length && content[nextLineIndex] !== '\n') {
                        functionContent += content[nextLineIndex];
                        nextLineIndex++;
                        nextLineIndentation++;
                    }

                    if (nextLineIndentation <= initialIndentation) {
                        return nextLineIndex - 1;
                    }
                }
            }
        }

        i++;
    }

    return -1; 
}

export function findIndentationLevel(content: string, index: number): number {
    let i = index;
    let indentationLevel = 0;

    while (i > 0 && (content[i - 1] === ' ' || content[i - 1] === '\t')) {
        indentationLevel++;
        i--;
    }

    return indentationLevel;
}

export async function locateExpressController(controllerName: string): Promise<{ moduleName: string, functionName: string, content: string } | undefined> {
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
export function findEndOfBlock(content: string, startIndex: number): number {
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

//TODO: get open ai to work so that we can remove this placeholder
const controllers = [
    'loginUserHandler',
    'createUserHandler',
    'deleteUserHandler',
    'revokeSession',
    'getFileHandler',
    'streamFileController',
    'uploadFileHandler',
    'handleCreateFolder',
    'markAndDeleteUnsafeFileController',
    'getFileHistoryController',
    'reviewFile',
];

export async function checkControllers() {
    for (const controller of controllers) {
        try {
            const result = await locateExpressController(controller);
            if (result) {
                vscode.window.showInformationMessage(`Controller ${controller} found`);
            }
        } catch (error) {
            console.error(`Error checking controller ${controller}: `, error);
        }
    }
}