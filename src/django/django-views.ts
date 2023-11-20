import * as vscode from 'vscode';
import { TextDecoder } from 'util';
import { locateViewFunction } from '../utils/view-utils';
import { isWithinVirtualEnv } from '../service/identity.service';
import { isCommentedOut } from '../utils/file-utils';

export async function identifyDjangoViews(urlsFile: vscode.Uri) {
    const fileContent = await vscode.workspace.fs.readFile(urlsFile);

    // Using a regex to identify Django views
    const djangoViewRegex = /\b(?:path|re_path|url)\s*\(\s*['"]([\w\/-]*)['"]\s*,\s*(\w+(\.\w+)?)\b[^\)]*\)|class\s+(\w+)\s*\([^:]*APIView\)|path\s*\(\s*['"]([\w\/-]*)['"]\s*,\s*(\w+(\.\w+)?)\b[^\)]*\)\s*,\s*name\s*=\s*['"](\w+)['"]/g;

    let views = [];
    let match;

    const fileContentString = new TextDecoder().decode(fileContent);

    while ((match = djangoViewRegex.exec(fileContentString)) !== null) {
        const path = match[1] || match[5];
        const classView = match[4];
        const functionView = match[6];
        const viewName = classView || functionView || match[2] || match[7];
        const filePath = urlsFile.path;

        // Exclude views with 'include' in their argument and the admin site, to avoif picking up false positives.
        if (viewName && !viewName.includes('include') && path !== 'admin/' && !isCommentedOut(fileContentString, match.index) && !isWithinVirtualEnv(filePath)) {
            vscode.window.showInformationMessage(`Django View identified - Path: ${path}, View Name: ${viewName}, File Path: ${filePath}`);

            // Calling locateViewFunction to get the content of the view function
            const viewContent = await locateViewFunction(viewName);

            // vscode.window.showInformationMessage(`View content ${viewContent}`); //Debbuging line

            if (viewContent) {
                views.push({ name: viewName, content: viewContent });
            }
        }
    }

    return views;
}


