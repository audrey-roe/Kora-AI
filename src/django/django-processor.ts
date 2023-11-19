import * as vscode from 'vscode';
import { identifyDjangoViews } from './django-views';
import { generateDocumentation } from '../service/assistant.service';


export async function processDjangoProject() {
    const djangoUrlsFiles = await vscode.workspace.findFiles('**/urls.py');
    
    for (const file of djangoUrlsFiles) {

        const views = await identifyDjangoViews(file);

        if (views) {
            // Use the 'views' array to generate documentation or perform other tasks.
            generateDocumentation(views);
        }
    }
}