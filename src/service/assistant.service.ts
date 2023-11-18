import * as vscode from 'vscode';
import { openai } from './ai.service';

// CommonView interface
interface CommonView {
    name: string;
    content: {
        moduleName: string;
        functionName: string;
        content: string;
    } | string;
}

// DjangoView interface
interface DjangoView extends CommonView {
    content: {
        moduleName: string;
        functionName: string;
        content: string;
    } | string;
}
// function for generating documentation for Django views
export function generateDocumentation(views: CommonView[]) {
    // Iterating over the list of views and generate documentation
    for (const view of views) {
        vscode.window.showInformationMessage(`Generating documentation for View: ${view.name}`);
    }
}

export async function assistantCreator() {
    const outputChannel = vscode.window.createOutputChannel('Controller Functions');

    outputChannel.clear();
    outputChannel.appendLine('creating openai beta assistant...');

    try {
        const myAssistant = await openai.beta.assistants.create({
            instructions:
                "Your role is to extract function names from Express route files. When given an Express\
        route file, your task is to identify and list the functions that the routes are executing. Be aware \
        of the imports and see how you can use it too to detact what is unwanted in the list you will be returning, for example middlewares.\
         Double check your work and ensure that you have all the cintroller type functions. Please return the list of functions in a clear and formatted manner.",
            name: 'Controller Name Extractor',
            tools: [{ type: 'code_interpreter' }],
            model: 'text-davinci-002',
        });

        outputChannel.appendLine('Assistant created successfully.');

        outputChannel.appendLine('Extraction completed.');
        outputChannel.show(true);
    } catch (error) {
        console.error('Error creating assistant:', error);
        outputChannel.appendLine('Error creating assistant.');
        outputChannel.show(true);
    }
}

  