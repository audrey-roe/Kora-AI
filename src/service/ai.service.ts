import * as vscode from 'vscode';
import OpenAI, { ClientOptions } from "openai";
import config from '../config/defaults';
import dotenv from 'dotenv';
dotenv.config();
interface ApiResponse {
    controllers?: string[];
}
const apiKey: string | undefined = config.OPENAI_3;

if (!apiKey) {
    throw new Error("OpenAI API key is not provided.");
}

export const openai = new OpenAI({ apiKey: apiKey } as ClientOptions);

const outputChannel = vscode.window.createOutputChannel('Controller Functions');

export async function extractControllers(document: any): Promise<string[] | undefined> {

    const routeContent = document.getText();

    const prompt = `Your task is to meticulously extract function names from route or URL files. 
Approach the problem methodically, thinking step by step to ensure accuracy in your output.

Initiate the process by scrutinizing the route file and systematically identify the all the functions that the routes execute. 
Your ultimate goal is to compile a complete and well-organized list of these functions. To increase accuracy, scan the entire document 
and collect all possible functions. Examine how each function is imported, reference is typically at the top of the document and where 
they are being imported from. Also, observe other files being imported alongside it to determine if they should be included in the output. 
also analyse other import lines and see whether they should be included. Be sure to avoid including middlewares in the output.

As you near completion, perform a comprehensive double-check to confirm the presence of all function names in the file. 
Only conclude your work when you are certain that the list is complete. 
Your response should be a simple list of functions enclosed in square brackets, each item encased in single inverted comma, separated by comma 
and a single space and nothing else:\n\n${routeContent}`;


    try {
        const completionParams = {
            model: 'text-davinci-003',
            prompt: prompt,
            temperature: 0.7,
            max_tokens: 300, //will have to edit based on tokens available as well as temprature
        };

        const response = await openai.completions.create(completionParams);


        const controllersList = response.choices[0]?.text.trim().split('\n');
        // vscode.window.showInformationMessage(`open ai response ${controllersList}`); //Debugging line

        if (controllersList) {
            vscode.window.showInformationMessage(`Controller Functions: ${controllersList}`);
        } else {
            vscode.window.showErrorMessage('Failed to extract controller functions.');
        }
        return (controllersList);
    } catch (error) {
        console.error('OpenAI API Error:', error);

        outputChannel.appendLine(`OpenAI API Error ${error}`);
        outputChannel.show(true);
        vscode.window.showErrorMessage(`Error communicating with OpenAI API. ${error}`);
    }
}
