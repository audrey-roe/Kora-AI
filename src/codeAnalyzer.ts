import * as vscode from 'vscode';

// Function to identify Django routes and views based on the code structure
function identifyDjangoRoutesAndViews(code: string): { routes: string[], views: string[] } {
    const routes: string[] = [];
    const views: string[] = [];

    // Regular expression for Django urlpatterns
    const djangoUrlpatternRegex = /\burlpatterns\b\s*=\s*\[[\s\S]*?\]/ig;
    let urlpatternsMatch = djangoUrlpatternRegex.exec(code);

    if (urlpatternsMatch) {
        const urlpatternsCode = urlpatternsMatch[0];

        // Regular expression for Django path() function within urlpatterns
        const pathRegex = /\bpath\s*\(\s*['"]([^'"]+)['"],\s*([^)]+)\)/ig;
        let match;

        // Iterate through Django URL patterns
        while ((match = pathRegex.exec(urlpatternsCode)) !== null) {
            const [_, path, viewFunction] = match;
            routes.push(`URL: ${path}`);
            views.push(`View: ${viewFunction}`);
        }
    }

    return { routes, views };
}

// The findDjangoRoutes function iterates through all open documents,
//  and for each document, it checks if there are Django routes.
//  If found, it displays a message and logs the identified routes and views.

export async function findDjangoRoutes() {
    // Get all open documents in the editor
    const documents = vscode.workspace.textDocuments;

    // Iterate through each open document
    for (const document of documents) {
        const code = document.getText();
        const { routes, views } = identifyDjangoRoutesAndViews(code);

        // If Django routes are found, display a message
        if (routes.length > 0) {
            vscode.window.showInformationMessage('Django framework routes have been found!');
            // Log the identified routes and views (you may want to handle this data as needed)
            console.log('Identified Routes:', routes);
            console.log('Associated Views:', views);
            return;
        }
    }

    // If no Django routes are found, display a message
    vscode.window.showInformationMessage('No Django framework routes found.');
}


// Function to identify the codebase framework
export function identifyCodebaseFramework(): string | undefined {
    const activeTextEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

    let framework: string | undefined;

    if (activeTextEditor) {
        const document: vscode.TextDocument = activeTextEditor.document;
        const code: string = document.getText();
        const filePath: string | undefined = vscode.window.activeTextEditor?.document.fileName;

        console.log('Current File:', filePath);
        console.log('Code:', code);

        // Define regular expressions for each framework
        const expressRegex = /\bconst\s*app\s*=\s*express\s*\(\)\s*;\s*app\.use\(express\.json\(\)\)/;
        const djangoRegex: RegExp = /\bdjango\b.*(\burlpatterns\b.*\bdjango\.urls\b|\bpath\s*\(.*\))/i;
        // ... (other framework regex)

        // Check for matches with regular expressions
        if (expressRegex.test(code)) {
            framework = 'Express.js';
        } else if (djangoRegex.test(code)) {
            framework = 'Django';
        }

        // Display a message indicating the identified framework
        if (framework) {
            vscode.window.showInformationMessage(`${framework} framework has been identified!`);
            // If the identified framework is Django, find the routes
            if (framework === 'Django') {
                findDjangoRoutes();
            }
        } else {
            vscode.window.showInformationMessage('No framework detected.');
        }

        return framework;
    }

    // If no active text editor
    return undefined;
}


