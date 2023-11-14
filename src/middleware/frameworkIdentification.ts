// frameworkIdentification.ts
import * as vscode from 'vscode';

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

        return 'Express.js';
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
