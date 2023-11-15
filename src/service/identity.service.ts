// install @openai/openai package by running:
// npm install @openai/openai

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
