import * as vscode from 'vscode';
import { identifyDjangoViews } from './django-views';
import { generateDocumentation } from '../service/assistant.service';


export async function processDjangoProject() {
    const djangoUrlsFiles = await vscode.workspace.findFiles('**/urls.py', '**/node_modules/**');
    
    for (const file of djangoUrlsFiles) {
        const views = await identifyDjangoViews(file);
        console.log(`Django Views found in: ${file.path}`);
        console.log(views);
        if (views) {
            // Use the 'views' array to generate documentation or perform other tasks.
            generateDocumentation(views);
        }
    }
}