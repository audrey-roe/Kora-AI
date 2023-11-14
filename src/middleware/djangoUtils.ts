// djangoUtils.ts
import * as vscode from 'vscode';
import { extractViewContent, isCommentedOut, isWithinVirtualEnv } from './utils';

export interface DjangoView {
    name: string;
    content: {
        moduleName: string;
        functionName: string;
    } | string;
}


export async function identifyDjangoViews(urlsFile: vscode.Uri): Promise<DjangoView[]> {
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

            // Extract the content of the view function or class
            const viewContent = extractViewContent(fileContentString, viewName);
            if (viewContent) {
                views.push({ name: viewName, content: viewContent });
            }
        }
    }

    return views;
}

export function generateDocumentation(views: DjangoView[]) {
    // Iterate over the list of Django views and generate documentation
    for (const view of views) {
        // Customize this part based on how you want to document each view
        vscode.window.showInformationMessage(`Generating documentation for Django View: ${view.name}`);
        // Example: Call a documentation generation function or send the information to OpenAI.
    }

    // Additional logic or aggregation can be performed here.
}

