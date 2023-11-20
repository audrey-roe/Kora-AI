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
export async function generateDocumentation(functionName: string, method:string, endpointURL: string, code: string): Promise<string> {
    try {
    const completionParams = {
      model: 'text-davinci-003',
      prompt: `Your task involves generating documentation for each endpoint of an API, focusing on a one-endpoint-at-a-time approach.\
      The documentation for each endpoint should be comprehensive, providing key details in a structured format. 
      For each endpoint:
      1. **Name of the Endpoint:**
         Clearly specify the name of the endpoint.
      
      2. **Request Method and Endpoint URL:**
         Present the HTTP request method (e.g., GET, POST) and the endpoint URL in a concise and easily readable format.
      
      3. **Single Line Description:**
         Provide a brief, one-line description of the endpoint's purpose and functionality.
      
      4. **Request Body (if applicable):**
         If the endpoint involves a POST request, detail the required fields in the request body.
      
      5. **Returns:**
         Clarify what the endpoint returns, whether it's data, status codes, or other relevant information.
      
      6. **Example Request and Response:**
         If applicable, include an example request and response. Format these within a clear black box or another visually distinct container for easy identification.
      
      Here is a template to guide your documentation generation:
      
      '''plaintext
      **[Endpoint Name]**
      
      **[HTTP Method] [Endpoint URL]** 
      
      [One-line description]
      
      **Request Body (if POST):** 
          [Field Name] [*required -if the field is required]
          [Field Description].
      
          [Field Name 2] [*required -if the field is required]
          [Field Description 2].
      
      **Returns:** [Description of what the endpoint returns]
      
      **Example Request:**
      '''json
      {
        "exampleField1": "exampleValue1",
        "exampleField2": "exampleValue2",
        ...
      }
      '''
      
      **Example Response:**
      '''json
      {
        "responseField1": "responseValue1",
        "responseField2": "responseValue2",
        ...
      }
      '''
      '''
      One endpoint will be generated at a time, the function name, method, Endpoint URL, the function code will be passed 
      to you to generate the documentation for each endpoint. Ensure that the documentation is clear, consistent, and adheres 
      to best practices. Maintain a logical order for presenting information, making it easy for developers to understand and 
      implement. When generating the documentation, consider the nuances of POST requests, making explicit any required fields 
      in the request body. Additionally, emphasize the importance of the response structure by including a representative example. 
      Each endpoint should have a clear markdown formatting.
      Function Name: ${functionName}, Method ${method}, Endpoint URL: ${endpointURL}, Function Code: ${code}`,
      temperature: 0.7,
      max_tokens: 700,
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

