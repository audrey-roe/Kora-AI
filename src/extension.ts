import * as vscode from 'vscode';
import { identifyCodebaseFramework } from './service/identity.service';
import { processExpressProject } from './express/express-pocessor';
import { identifyDjangoViews } from './django/django-views';
import { generateDocumentation } from './service/assistant.service';
import { authenticateWithGitHub } from './service/github.service';


export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('kodekraftai.helloWorld', async () => {
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
    const provider = vscode.authentication.registerAuthenticationProvider(
        'github',
        'GitHub',
        {
            onDidChangeSessions: new vscode.EventEmitter<vscode.AuthenticationProviderAuthenticationSessionsChangeEvent>().event,
            getSessions: () => { /* Implement session retrieval logic */ return []; },
            login: async (scopes: string[]) => { /* Implement login logic */ return { accessToken: 'YOUR_ACCESS_TOKEN' }; },
            logout: async (sessionId: string) => { /* Implement logout logic */ }
        }
    );

    context.subscriptions.push(provider);
    const githubDisposable = vscode.commands.registerCommand('extension.createGitHubRepo', () => {
        authenticateWithGitHub();
      });

    let polygotDisposable = vscode.commands.registerCommand('kodekraftai.polygot', () => {
        vscode.window.showInformationMessage('New command is executed!');
        // Add your logic for the new command here
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
