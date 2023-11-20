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
    const functionName = parts[parts.length - 1]|| '';

    const pythonFiles = await filesRecursive(workspacePath, allowedExtensions);
    const viewFunctionRegex = new RegExp(`(?:def\\s+${functionName}\\s*\\([^:]*:\\s*|class\\s+${functionName}\\s*(?:\\([^)]*\\))?\\s*(?:\\b(?:APIView)\\b)?\\s*:\\s*)[^]*?(?=(?:\\s*class\\s+|\\s*def\\s+))|(?=$)`, 'g');

    for (const pythonFile of pythonFiles) {
        const content = await vscode.workspace.fs.readFile(vscode.Uri.file(pythonFile)).then(buffer => new TextDecoder().decode(buffer));

        const index = content.indexOf(`def ${functionName}(`);
        const index2 = content.indexOf(`class ${functionName}(`);
        const index3 = content.indexOf(`class ${functionName}(APIView)`);

        if (index !== -1) {
            // Handle def ${functionName}(
            const endOfFunction = await findEndOfDefFunction(content, index);
            // const viewContent = content.substring(index, endOfFunction + 1);

            vscode.window.showInformationMessage(`Module name: ${moduleName}, Function name: ${functionName}, Content: ${endOfFunction}`);
            // return { moduleName, functionName, content: viewContent };
        } else if (index2 !== -1) {
            // Handle class ${functionName}(
            let i = index2;
            while (i < content.length) {
                if (content[i] === ':') {
                    const endOfFunction = await findEndOfClassFunction(content, i);
                    // const viewContent = content.substring(index2, endOfClass + 1);

                    vscode.window.showInformationMessage(`Module name: ${moduleName}, Class name: ${functionName}, Content: ${endOfFunction}`);
                    // return { moduleName, functionName, content: viewContent };
                }
                i++;
            }
        } else if (index3 !== -1) {
            // Handle class ${functionName}(APIView)
            let i = index3;
            while (i < content.length) {
                if (content[i] === ':') {
                    const endOfFunction = await findEndOfClassFunction(content, i);
                    // const viewContent = content.substring(index3, endOfFunction + 1);

                    vscode.window.showInformationMessage(`Module name: ${moduleName}, Class name: ${functionName}, Content: ${endOfFunction}`);
                    // return { moduleName, functionName, content: endOfFunction };
                }
                i++;
            }
        }
    }
    vscode.window.showErrorMessage(`View function for ${viewName} not found.`);
    return undefined;
}

// finding end of python function
export function findEndOfDefFunction(content: string, startIndex: number): string[] {
    let i = startIndex;
    const nonDefLines: string[] = [];
    let continueProcessing = true;

    // Move to the next line after the provided startIndex
    while (i < content.length && content[i] !== '\n') {
        
        i++;
    }
    i++;
    nonDefLines.push(content.substring(startIndex, i));

    while (i < content.length && continueProcessing) {
        const lineStart = i;
        
        while (i < content.length && content[i] !== '\n') {
            i++;
        }
        i++;

        // Check if the line is not a comment and starts with 'def' or 'class'
        const line = content.substring(lineStart, i).trim();
        if (!line.startsWith('#') && (line.startsWith('def ') || line.startsWith('class '))) {
            continueProcessing = false; // Exit the loop when 'def' or 'class' is found
        } else {
            nonDefLines.push(content.substring(lineStart, i));
        }
    }

    // Print non-'def' lines
    vscode.window.showInformationMessage(`Non-def lines:, ${nonDefLines}`);

    return nonDefLines;
}

//! MUST FIUGRE OUT
let insideClass = false;

export function findEndOfClassFunction(content: string, startIndex: number): string[] {
    let i = startIndex;
    const functionLines: string[] = [];
    let continueProcessing = true;

    // Check if we are inside a class
    if (content.substring(startIndex).startsWith('class ')) {
        insideClass = true;
    }

    // If inside class, use indentation 
    // Else use 'def' keyword
    const nextMarker = insideClass ? /^\s+/ : /^def\s+/;

    // Include the first line in functionLines
    const firstLineStart = i;
    while (i < content.length && content[i] !== '\n') {
        i++;
    }
    i++;
    functionLines.push(content.substring(firstLineStart, i));

    while (i < content.length && continueProcessing) {
        const lineStart = i;
        while (i < content.length && content[i] !== '\n') {
            i++;
        }
        i++;

        // Check if the line is not a comment and starts with 'def' or has indentation in class context
        const line = content.substring(lineStart, i).trim();
        if (!line.startsWith('#') && (line.match(nextMarker) || (insideClass && line.startsWith('class ')))) {
            // Found next function start or class definition inside class
            continueProcessing = false;
        } else {
            functionLines.push(content.substring(lineStart, i));
        }
    }

    // Print function lines
    vscode.window.showInformationMessage(`Function lines:, ${functionLines}`);

    // Reset insideClass when we exit class scope
    if (!insideClass && functionLines[functionLines.length - 1].includes('}')) {
        insideClass = false;
    }

    return functionLines;
}


// export function findEndOfFunction(content: string, startIndex: number): number {
//     let openBraces = 0;
//     let i = startIndex;
//     let insideFunction = false;
//     let initialIndentation: number | null = null;
//     let functionContent = '';

//     while (i < content.length) {
//         if (content[i] === '(') {
//             openBraces++;
//             insideFunction = true;
//         } else if (content[i] === ')') {
//             openBraces--;

//             if (openBraces === 0 && insideFunction) {
//                 if (content[i + 1] === '\n') {
//                     if (initialIndentation === null) {
//                         initialIndentation = findIndentationLevel(content, startIndex);
//                     }

//                     let nextLineIndex = i + 2;
//                     let nextLineIndentation = 0; 

//                     while (nextLineIndex < content.length && content[nextLineIndex] !== '\n') {
//                         functionContent += content[nextLineIndex];
//                         nextLineIndex++;
//                         nextLineIndentation++;
//                     }

//                     if (nextLineIndentation <= initialIndentation) {
//                         return nextLineIndex - 1;
//                     }
//                 }
//             }
//         }

//         i++;
//     }

//     return -1; 
// }

export function findIndentationLevel(content: string, index: number): number {
    let i = index;
    let indentationLevel = 0;

    while (i > 0 && (content[i - 1] === ' ' || content[i - 1] === '\t')) {
        indentationLevel++;
        i--;
    }

    return indentationLevel;
}


