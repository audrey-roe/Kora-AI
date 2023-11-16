import * as vscode from 'vscode';
import OpenAI, { ClientOptions } from "openai";
import dotenv from 'dotenv';
dotenv.config();

// const apiKey: string | undefined = process.env.OPENAI_3;
const apiKey = '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'

if (!apiKey) {
    throw new Error("OpenAI API key is not provided.");
}
//   new OpenAI({ apiKey: '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' })
const openai = new OpenAI({ apiKey: apiKey } as ClientOptions);

const outputChannel = vscode.window.createOutputChannel('Controller Functions');

export async function extractControllers(document: vscode.TextDocument) {
    outputChannel.appendLine('Running function name extract controllers...');
    const routeContent = document.getText();
    const prompt = `Given the following Express route file, list the controller functions:\n\n${routeContent}`;

    try {
        const completionParams = {
            model: 'text-davinci-003',
            prompt: `Generate documentation for the following code:`,
            temperature: 0.7,
            //   max_tokens: 150,
        };

        const response = await openai.completions.create(completionParams);


        const controllersList = response.choices[0]?.text.trim().split('\n');
        if (controllersList) {
            vscode.window.showInformationMessage('Controller Functions:\n' + controllersList.join('\n'));
        } else {
            vscode.window.showErrorMessage('Failed to extract controller functions.');
        }
    } catch (error) {
        console.error('OpenAI API Error:', error);

        outputChannel.appendLine(`OpenAI API Error ${error}`);
        outputChannel.show(true);
        vscode.window.showErrorMessage('Error communicating with OpenAI API.');
    }
}


export async function controllerExtractor() {
    const outputChannel = vscode.window.createOutputChannel('Controller Functions');

    outputChannel.clear();
    outputChannel.appendLine('creating openai beta assistant...');

    try {
        const myAssistant = await openai.beta.assistants.create({
            instructions:
                "Your role is to extract function names from Express route files. When given an Express\
        route file, your task is to identify and list the functions that the routes are executing.\
        Please return the list of functions in a clear and formatted manner.",
            name: 'Controller Functions',
            tools: [{ type: 'code_interpreter' }],
            model: 'text-davinci-002',
        });

        outputChannel.appendLine('Assistant created successfully.');

        // Display any additional information you want from myAssistant

        outputChannel.appendLine('Extraction completed.');
        outputChannel.show(true);
    } catch (error) {
        console.error('Error creating assistant:', error);
        outputChannel.appendLine('Error creating assistant.');
        outputChannel.show(true);
    }
}
