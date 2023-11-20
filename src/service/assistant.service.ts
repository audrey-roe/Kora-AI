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
    const outputChannel = vscode.window.createOutputChannel('Controller Function Names');

    outputChannel.clear();
    outputChannel.appendLine('creating openai beta assistant...');

    try {
        const myAssistant = await openai.beta.assistants.create({
            instructions:
                "Your task is to meticulously extract function names from route or URL files.Approach the problem methodically,\
                 thinking step by step to ensure accuracy in your output.Initiate the process by scrutinizing the route file and \
                 systematically identify the all the functions that the routes execute. Your ultimate goal is to compile a complete \
                 and well-organized list of these functions. To increase accuracy, scan the entire document and collect all possible \
                 functions. Examine how each function is imported, reference is typically at the top of the document and where they \
                 are being imported from. Also, observe other files being imported alongside it to determine if they should be \
                 included in the output. also analyse other import lines and see whether they should be included. Be sure to avoid \
                 including middlewares in the output.As you near completion, perform a comprehensive double-check to confirm the presence \
                of all function names in the file. Only conclude your work when you are certain that the list is complete. Your response \
                should be a simple list of functions enclosed in square brackets, each item encased in inverted commas, separated by comma and a single space and nothing else",
            name: 'Controller Name Extractor',
            tools: [{ type: 'code_interpreter' }],
            model: 'gpt-4',
        });

        outputChannel.appendLine('Assistant created successfully.');

        outputChannel.appendLine('Extraction completed.');
        outputChannel.show(true);
    } catch (error) {
        console.error('Error creating assistant:', error);
        outputChannel.appendLine(`Error creating assistant. ${error}` );
        outputChannel.show(true);
    }
}

  