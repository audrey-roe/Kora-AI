import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

const djangoViewRegex = /\b(?:class\s+(\w+)\s*\([^:]*django\.views(?:\.View)?[^:]*\):|def\s+(\w+)\s*\(.*django\.views(?:\.View)?[^:]*\):)/g;
const expressControllerRegex = /(?:app\.(get|post|put|delete)\s*\(\s*['"]([\w\/:]+)['"](?:\s*,\s*(\w+))?\s*,\s*(\w+)\)|Routes\.push\(\s*{\s*method:\s*['"]([a-z]+)['"],\s*route:\s*['"]([\w\/:]+)['"],\s*middleware:\s*(\[.*?\])?,\s*controller:\s*(\w+),\s*action:\s*['"](\w+)['"]\s*}\s*\))/g;

export async function identifyCodebaseFramework(): Promise<string | undefined> {
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

export async function identifyFrameworkFromFile(file: vscode.Uri): Promise<string | undefined> {
    const document = await vscode.workspace.openTextDocument(file);
    const code = document.getText();

    const expressRegex = /\bconst\s*app\s*=\s*express\s*\(\)\s*;/;
    const djangoRegex = /\burlpatterns\s*=/;

    // Check for manage.py and wsgi.py files for Django
    const isDjangoProject = isWithinDjangoProject(file.fsPath);
    if (isDjangoProject) {
        console.log('Django Project:', file.fsPath);

        // Check for Django views
        const match = code.match(djangoViewRegex);
        if (match) {
            const viewName = match[1];
            console.log('Django View:', viewName);
        }

        return 'Django';
    } else if (expressRegex.test(code)) {
        console.log('Matched Express:', file.fsPath);

        // Check for Express controllers
        const matches = code.matchAll(expressControllerRegex);
        for (const match of matches) {
            const method = match[1] || match[5];
            const route = match[2] || match[6];
            const middleware = match[3] || match[7];
            const controller = match[4] || match[8];
            const action = match[9];
            console.log(`Express Controller: ${method.toUpperCase()} ${route} -> ${controller}.${action}`); // Debugging line
        }

        return 'Express';
    }

    console.log('No match:', file.fsPath);
    return undefined;
}

export function isWithinDjangoProject(filePath: string): boolean {
    //looking for manage.py or wsgi.py to check if it is within the Django project
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const managePyPath = path.join(rootPath, 'manage.py');
    const wsgiPyPath = path.join(rootPath, 'wsgi.py');
    
    return (
        (filePath.includes(path.sep) && filePath.startsWith(rootPath)) &&
        (fs.existsSync(managePyPath) || fs.existsSync(wsgiPyPath))
    );
}

export function isWithinVirtualEnv(filePath: string): boolean {
    // exclude common patterns for virtual environment folders
    const virtualEnvPatterns = ['venv', '.venv', 'env'];

    // subdirectories to exclude
    const excludedSubdirectories = ['bin', 'lib'];

    // Nnormalize the file path for case-insensitive comparison
    const normalizedFilePath = filePath.toLowerCase();

    // Check if the file path contains any of the common virtual env patterns
    const isInVirtualEnv = virtualEnvPatterns.some(pattern => normalizedFilePath.includes(path.sep + pattern + path.sep));

    // check if the file path contains any of the excluded subdirectories
    const isExcluded = excludedSubdirectories.some(subdir => normalizedFilePath.includes(path.sep + subdir + path.sep));

    // check if the file path is within a Django project
    if (isInVirtualEnv && !isExcluded) {
        return isWithinDjangoProject(filePath);
    }

    return false;
}
