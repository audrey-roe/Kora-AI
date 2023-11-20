import * as vscode from 'vscode';
import OpenAI, { ClientOptions } from "openai";
import config from '../config/defaults';

import dotenv from 'dotenv';
dotenv.config();

const apiKey: string | undefined = config.OPENAI_3;

if (!apiKey) {
  throw new Error("OpenAI API key is not provided.");
}
const openai = new OpenAI({ apiKey: apiKey } as ClientOptions);

// function to generate documentation using GPT, //TODO: change implementation instead of chat completion use, openai assistant
export async function generateDocumentation(code: string): Promise<string> {
    try {
    const completionParams = {
      model: 'gpt-3.5-turbo',
      prompt: `Generate documentation for the following code:\n\n${code}`,
    //   max_tokens: 150,
    };
    const response = await openai.completions.create(completionParams);

    // Extract the generated documentation from the response
    const generatedDocumentation = response.choices[0].text.trim();

    return generatedDocumentation;
  } catch (error) {
    console.error('Error generating documentation:', error);
    throw error;
  }
}


// function to convert code using GPT
export async function convertCode(code: string, targetLanguage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: `Convert the following code to ${targetLanguage}:\n\n${code}` },
      ],
    });

    // Check if choices array exists and is not empty
    if (response.choices && response.choices.length > 0) {
      // Use the correct property based on the type definition
      const content = response.choices[0].message?.content;
      vscode.window.showInformationMessage(`${content}`);
      if (content !== undefined && content !== null) {
        const convertedCode = content.trim();
        return convertedCode;
      } else {
        throw new Error('Unexpected response structure: message content is null or undefined.');
      }
    } else {
      throw new Error('Unexpected response structure: choices array is empty or undefined.');
    }
  } catch (error) {
    throw error;
  }
}

