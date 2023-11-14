import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

interface DjangoView {
    name: string;
    content: {
        moduleName: string;
        functionName: string;
    } | string;
}

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('kodekraftai.helloWorld', async () => {
        vscode.window.showInformationMessage('KodekraftAI is now running!');

        const identifiedFramework = await identifyCodebaseFramework();
        if (identifiedFramework) {
            vscode.window.showInformationMessage(`${identifiedFramework} framework has been identified!`);
            if (identifiedFramework === 'Django') {
                processDjangoProject();
            }
        } else {
            vscode.window.showInformationMessage("No framework detected");
        }
    });

    context.subscriptions.push(disposable);
}

export function deactivate() { }

async function identifyCodebaseFramework(): Promise<string | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (workspaceFolders) {
        for (const folder of workspaceFolders) {
            const files = await vscode.workspace.findFiles(new vscode.RelativePattern(folder, '**/*.{js,ts,jsx,tsx,py,java,rb,php}'));
            // vscode.window.showInformationMessage(`${files}`);

            for (const file of files) {
                const framework = await identifyFrameworkFromFile(file);
                if (framework) {
                    return framework;
                }
            }
        }
    }
    return undefined;
}
const djangoViewRegex = /\b(?:class\s+(\w+)\s*\([^:]*django\.views(?:\.View)?[^:]*\):|def\s+(\w+)\s*\(.*django\.views(?:\.View)?[^:]*\):)/g;
const expressControllerRegex = /(?:app\.(get|post|put|delete)\s*\(\s*['"]([\w\/:]+)['"](?:\s*,\s*(\w+))?\s*,\s*(\w+)\)|Routes\.push\(\s*{\s*method:\s*['"]([a-z]+)['"],\s*route:\s*['"]([\w\/:]+)['"],\s*middleware:\s*(\[.*?\])?,\s*controller:\s*(\w+),\s*action:\s*['"](\w+)['"]\s*}\s*\))/g;

async function identifyFrameworkFromFile(file: vscode.Uri): Promise<string | undefined> {
    const document = await vscode.workspace.openTextDocument(file);
    const code = document.getText();

    const expressRegex = /\bconst\s*app\s*=\s*express\s*\(\)\s*;/;
    const djangoRegex = /\burlpatterns\s*=/;

    if (expressRegex.test(code)) {
        console.log('Matched Express.js:', file.fsPath);

        // Check for Express.js controllers
        const matches = code.matchAll(expressControllerRegex);
        for (const match of matches) {
            const method = match[1] || match[5];
            const route = match[2] || match[6];
            const middleware = match[3] || match[7];
            const controller = match[4] || match[8];
            const action = match[9];
            console.log(`Express.js Controller: ${method.toUpperCase()} ${route} -> ${controller}.${action}`);
        }

        return 'Express';
    } else if (djangoRegex.test(code)) {
        // Check for Django views
        const match = code.match(djangoViewRegex);
        if (match) {
            const viewName = match[1];
            console.log('Django View:', viewName);
        }
        return 'Django';
    }
    console.log('No match:', file.fsPath);
    return undefined;
}

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

// function for generating documentation for Django views
function generateDocumentation(views: DjangoView[]) {
    // Iterating over the list of Django views and generate documentation
    for (const view of views) {
        // Customize this part based on how you want to document each view
        vscode.window.showInformationMessage(`Generating documentation for Django View: ${view.name}`);
    }

    // Additional logic or aggregation to be performed here.
}

async function identifyDjangoViews(urlsFile: vscode.Uri) {
    const fileContent = await vscode.workspace.fs.readFile(urlsFile);

    // Use a regex to identify Django views
    const djangoViewRegex = /\b(?:path|re_path|url)\s*\(\s*['"]([\w\/-]+)['"]\s*,\s*(\w+(\.\w+)?)\b[^\)]*\)|class\s+(\w+)\s*\([^:]*APIView\)|path\s*\(\s*['"]([\w\/-]+)['"]\s*,\s*(\w+(\.\w+)?)\b[^\)]*\)\s*,\s*name\s*=\s*['"](\w+)['"]/g;

    let views = [];
    let match;

    const fileContentString = new TextDecoder().decode(fileContent);

    while ((match = djangoViewRegex.exec(fileContentString)) !== null) {
        const path = match[1] || match[5];
        const classView = match[4];
        const functionView = match[6];
        const viewName = classView || functionView || match[2] || match[7];
        const filePath = urlsFile.path;

        // Exclude views with 'include' in their argument and the admin site
        if (viewName && !viewName.includes('include') && path !== 'admin/' && !isCommentedOut(fileContentString, match.index) && !isWithinVirtualEnv(filePath)) {
            vscode.window.showInformationMessage(`Django View identified - Path: ${path}, View Name: ${viewName}, File Path: ${filePath}`);

            // Call locateViewFunction to get the content of the view function
            const viewContent = await locateViewFunction(viewName);

            // vscode.window.showInformationMessage(`View content ${viewContent}`);

            if (viewContent) {
                views.push({ name: viewName, content: viewContent });
            }
        }
    }

    return views;
}

async function locateViewFunction(viewName: string): Promise<{ moduleName: string, functionName: string, content: string } | undefined> {
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        vscode.window.showErrorMessage('Workspace path not found.');
        return undefined;
    }

    // Assuming the first folder is the root of the workspace
    const workspacePath = workspaceFolders[0].uri.fsPath;

    // Define the file extensions to search
    const allowedExtensions = ['.py'];

    // Convert dots in the view name to path separators
    const viewPath = viewName.replace(/\./g, path.sep);

    // Split the view name into module and function names
    const parts = viewName.split('.');
    const moduleName = parts.slice(0, -1).join('.');
    const functionName = parts[parts.length - 1];

    // Recursively search for Python files in the project directory
    const pythonFiles = filesRecursive(workspacePath, allowedExtensions);
    const viewFunctionRegex = new RegExp(`(?:def\\s+${functionName}\\s*\\([^:]*:\\s*|class\\s+${functionName}\\s*(?:\\([^)]*\\))?\\s*(?:\\b(?:APIView)\\b)?\\s*:\\s*)[^]*?(?=(?:\\s*class\\s+|\\s*def\\s+))|(?=$)`, 'g');

    // Check each Python file for the view function definition
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

function findEndOfFunction(content: string, startIndex: number): number {
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
                // Check if the closing parenthesis is followed by a newline
                if (content[i + 1] === '\n') {
                    // Find the indentation level of the current line
                    if (initialIndentation === null) {
                        initialIndentation = findIndentationLevel(content, startIndex);
                    }

                    // Find the start of the next line after the closing parenthesis
                    let nextLineIndex = i + 2;
                    let nextLineIndentation = 0;  // Initialize indentation for the next line

                    // Find the indentation level of the next line
                    while (nextLineIndex < content.length && content[nextLineIndex] !== '\n') {
                        functionContent += content[nextLineIndex];
                        nextLineIndex++;
                        nextLineIndentation++;
                    }

                    // Check if the next line has the same or lower indentation
                    if (nextLineIndentation <= initialIndentation) {
                        // Stop and return from the line before the next line
                        return nextLineIndex - 1;
                    }
                }
            }
        }

        i++;
    }

    return -1; // Not found
}

function findIndentationLevel(content: string, index: number): number {
    let i = index;
    let indentationLevel = 0;

    // Count the number of spaces or tabs at the beginning of the line
    while (i > 0 && (content[i - 1] === ' ' || content[i - 1] === '\t')) {
        indentationLevel++;
        i--;
    }

    return indentationLevel;
}

// Function to recursively find files with specified extensions
function filesRecursive(dir: string, extensions: string[]): string[] {
    const files: string[] = [];

    function walk(currentDir: string) {
        const entries = fs.readdirSync(currentDir);

        for (const entry of entries) {
            const fullPath = path.join(currentDir, entry);
            const stat = fs.statSync(fullPath);

            if (stat.isDirectory()) {
                walk(fullPath);
            } else {
                const ext = path.extname(entry);

                if (extensions.includes(ext)) {
                    files.push(fullPath);
                }
            }
        }
    }

    walk(dir);
    return files;
}

function isCommentedOut(content: string, index: number): boolean {
    // Check if the match is within a comment block
    const commentRegex = /(?:^|\s)#.*$/gm;
    let match;

    while ((match = commentRegex.exec(content)) !== null) {
        if (match.index < index && index < commentRegex.lastIndex) {
            return true;
        }
    }

    return false;
}

function isWithinDjangoProject(filePath: string): boolean {
    // Check if the file is within a Django project by looking for manage.py
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const managePyPath = path.join(rootPath, 'manage.py');
    return filePath.includes(path.sep) && filePath.startsWith(rootPath) && fs.existsSync(managePyPath);
}

function isWithinVirtualEnv(filePath: string): boolean {
    // Common patterns for virtual environment folders
    const virtualEnvPatterns = ['venv', '.venv', 'env'];

    // Subdirectories to exclude
    const excludedSubdirectories = ['bin', 'lib'];

    // Normalize the file path for case-insensitive comparison
    const normalizedFilePath = filePath.toLowerCase();

    // Check if the file path contains any of the common virtual environment patterns
    const isInVirtualEnv = virtualEnvPatterns.some(pattern => normalizedFilePath.includes(path.sep + pattern + path.sep));

    // Check if the file path contains any of the excluded subdirectories
    const isExcluded = excludedSubdirectories.some(subdir => normalizedFilePath.includes(path.sep + subdir + path.sep));

    // Check if the file path is within a Django project
    if (isInVirtualEnv && !isExcluded) {
        return isWithinDjangoProject(filePath);
    }

    return false;
}
