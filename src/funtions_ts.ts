// import * as openai from 'openai'; // Import the openai library
import * as fs from 'fs';
import OpenAI, { ClientOptions } from "openai";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// openai.apiKey = process.env.OPENAI_KEY || ''; // Set OpenAI API key
const apiKey: string | undefined = process.env.OPENAI_KEY || '';
export const openai = new OpenAI({ apiKey: apiKey } as ClientOptions);

// Completion function
async function getCompletion(messages: any, temperature = 0, maxTokens = 300) {
    const response = await openai.completions.create({
        model: "gpt-3.5-turbo",
        prompt: messages,
        temperature,
        max_tokens: maxTokens,
    });
    return response.choices[0].text;
}

// Function to extract controllers from an Express route file
function extractControllersFromExpressRoute(file_path: string) {
    const controllers: string[] = [];
    try {
        const content: string = fs.readFileSync(file_path, 'utf-8');
        const controllerPattern: RegExp = /\.get\([\'"](.*?)[\'"]\s*,\s*(.*?)\)/g;
        const matches: RegExpMatchArray | null = content.match(controllerPattern);

        if (matches) {
            matches.forEach((match: string) => {
                const matchParts: string[] = match.match(controllerPattern) || [];
                const controllerName: string = matchParts[1]?.trim() || '';
                controllers.push(controllerName);
            });
        }
    } catch (error:any) {
        if (error.code === 'ENOENT') {
            console.log('File not found');
        } else {
            console.error('Error reading the file:', error);
        }
    }
    return controllers;
}

// Function to clean and rate Django views
async function viewClean(file_path: string) {
    try {
        const content: string = fs.readFileSync(file_path, 'utf-8');
        const prompt = `
        Your task is: given a django view, return the requested information in the section delimited by ### ###. Format the output as string.
        
        view:
        
        ${content}
        
        ###
        rating: give the following rating to the django view; a rating of 1 if it is complete with no issues, 2 if it is incomplete and 3 if it has has issues and is incomplete.
        clean code: if rating is 1 then return the same code without changes, if rating is 2, complete the code and return the completed code. If rating is 3, then clean and complete the code and return the completed code
        ###
        `;

        const message = [
            {
                "role": "user",
                "content": prompt
            }
        ];

        const response = await getCompletion(message);
        console.log(response);
    } catch (error:any) {
        if (error.code === 'ENOENT') {
            console.log('File not found');
        } else {
            console.error('Error reading the file:', error);
        }
    }
}

// Function to generate documentation
async function docGen(file_path: string) {
    try {
        const content: string = fs.readFileSync(file_path, 'utf-8');
        const prompt = `
        Your task is: given a code, return the requested information in the section delimited by ### ###. Format the output as string.
        
        code:
        
        ${content}
        
        ###
        Language: the language the code is written in
        documentation: the itemized documentation of the code in markdown format
        ###
        `;

        const message = [
            {
                "role": "user",
                "content": prompt
            }
        ];

        const response = await getCompletion(message);
        console.log(response);
    } catch (error:any) {
        if (error.code === 'ENOENT') {
            console.log('File not found');
        } else {
            console.error('Error reading the file:', error);
        }
    }
}
