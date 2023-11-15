import * as vscode from 'vscode';
import OpenAI, { ClientOptions } from 'openai';

const apiKey = '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';

const openai = new OpenAI({ apiKey } as ClientOptions);
const outputChannel = vscode.window.createOutputChannel('Controller Functions');

export async function controllerExtractor() {
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
