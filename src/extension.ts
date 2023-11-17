import * as vscode from 'vscode';
import { identifyCodebaseFramework } from './service/identity.service';
import { processExpressProject } from './express/express-pocessor';
import { identifyDjangoViews } from './django/django-views';
import { generateDocumentation } from './service/assistant.service';
import { authenticateWithGitHub } from './service/github.service';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('kodekraftai.generateDocumentation', async () => {
        vscode.window.showInformationMessage('KodekraftAI is now running!');

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

    const githubDisposable = vscode.commands.registerCommand('kodekraftai.loginGithub', () => {
        authenticateWithGitHub();
    });

    let polygotDisposable = vscode.commands.registerCommand('kodekraftai.polygot', () => {
        vscode.window.showInformationMessage('New command is executed!');
        // Add your logic for the new command here
    });

    const checkLoginCommand = vscode.commands.registerCommand('kodekraftai.convertCodebase', async () => {
        let isLoggedIn;

        const session = await vscode.authentication.getSession('github', ['repo', 'workflow', 'read:user']);
        if(session){
            const isLoggedIn = true 

        }else{
            const isLoggedIn = false 
        }

        if (!isLoggedIn) {
            vscode.window.showInformationMessage('Sign in to Kora AI to use the convert codebase feature!', 'Continue with Github')
                .then((selectedItem) => {
                    if (selectedItem === 'Continue with Github') {
                        authenticateWithGitHub();
                    }
                });
        }
    });


    context.subscriptions.push(polygotDisposable);
    context.subscriptions.push(checkLoginCommand);

}


function getWebviewContent(panel: vscode.WebviewPanel) {
    const extensionUri = vscode.extensions.getExtension('kodekraftai.kodekraftai')!.extensionUri;
    const scriptUri = panel.webview.asWebviewUri(vscode.Uri.joinPath(extensionUri, 'index.js'));

    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>GitHub Login</title>
        </head>
        <body>
            <h2>GitHub Login</h2>
            <button onclick="login()">Login with GitHub</button>
            <script src="${scriptUri}"></script>
        </body>
        </html>
    `;
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
