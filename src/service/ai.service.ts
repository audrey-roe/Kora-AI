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

export interface ControllerDictionary {
    [controllerName: string]: [string, string, string];
}

//TODO: There are too many nested conditionals, treat when cleaning up
export async function extractControllers(document: any): Promise<ControllerDictionary | undefined> {
    const routeContent = document.getText();

    const prompt = `Your task is to meticulously extract function names, their corresponding URLs, and methods from route or URL files. 
    Approach the problem methodically, thinking step by step to ensure accuracy in your output.

    Initiate the process by scrutinizing the route file and systematically identify all the functions that the routes execute. 
    Your ultimate goal is to compile a complete and well-organized list, where each item in the list follows this order:
    1. The route URL (encased in single inverted commas),
    2. The method (encased in single inverted commas),
    3. The controller function name (encased in single inverted commas).

    To increase accuracy, scan the entire document and collect all possible functions. 
    Examine how each function is imported; the reference is typically at the top of the document and where they are being imported from. 
    Also, observe other files being imported alongside it to determine if they should be included in the output. 
    Analyze other import lines and see whether they should be included. Be sure to avoid including middlewares in the output.

    As you near completion, perform a comprehensive double-check to confirm the presence of all function names in the file. 
    Only conclude your work when you are certain that the dictionary is complete. 
    Your response should be a dictionary where each key is the controller name, and the value is a list containing the route URL, method, 
    and the controller function name (matching the key controller name), enclosed in square brackets and separated by commas and a single space. here is an example below:

    {
        'exampleController1': ['/route1', 'GET', 'exampleController1'],
        'exampleController2': ['/route2', 'POST', 'exampleController2'],
        // ... other controllers ...
    };
    Avoid adding 'Output' or 'Answer' or anything thing else before the , only the list is required as output:
    \n\n${routeContent}`;


    try {
        const completionParams = {
            model: 'text-davinci-003',
            prompt: prompt,
            temperature: 0.7,
            max_tokens: 300,
        };

        const response = await openai.completions.create(completionParams);

        const controllersObject: ControllerDictionary = {};

        if (response.choices && response.choices[0]?.text) {
            const responseText = response.choices[0].text;

            try {
                // Using a regular expression to find the first occurrence of '{' and '}'
                const match = responseText.match(/{[^{}]*}/);

                if (match) {
                    // Extract the matched JSON string and parse it
                    const jsonString = match[0].replace(/'/g, '"');
                    vscode.window.showInformationMessage(`Parsed JSON String: ${jsonString}`);

                    try {
                        const parsedObject = JSON.parse(jsonString);
                        return parsedObject;
                    } catch (jsonError) {
                        console.error('Error parsing JSON:', jsonError);
                        vscode.window.showErrorMessage(`Error parsing JSON. Check the OpenAI response for unexpected format. ${jsonError}`);
                    }
                } else {
                    console.error('Failed to extract controller functions. No JSON object found.');
                    vscode.window.showErrorMessage('Failed to extract controller functions. No JSON object found.');
                }

            } catch (jsonError) {
                console.error('Error parsing JSON:', jsonError);
                vscode.window.showErrorMessage(`Error parsing JSON. Check the OpenAI response for unexpected format. ${jsonError}`);
            }
        } else {
            console.error('Failed to extract controller functions. No response or text found.');
            vscode.window.showErrorMessage('Failed to extract controller functions. No response or text found.');
        }

    } catch (error) {
        console.error('OpenAI API Error:', error);

        outputChannel.appendLine(`OpenAI API Error ${error}`);
        outputChannel.show(true);
        vscode.window.showErrorMessage(`Error communicating with OpenAI API. ${error}`);
    }
}

