import * as vscode from 'vscode';
import { checkControllers } from '../utils/view-utils';

export async function processExpressProject() {
    try {
        const expressRoutes = await identifyExpressRoutes();

        if (expressRoutes) {
            for (const route of expressRoutes) {
                try {
                    const document = await vscode.workspace.openTextDocument(route);
                    // await controllerExtractor();
                    // await extractControllers(document);
                    await checkControllers()
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
        vscode.window.showInformationMessage('No Express route files found, if your routes file exists make sure it is named `routes.ts` or `routes.js` in your Express app.');
        return undefined;
    }

    const routeFilePaths = expressRouteFiles.map(file => file.fsPath);
    vscode.window.showInformationMessage(`Express route files found: ${routeFilePaths.join(', ')}`);

    return routeFilePaths;
}
