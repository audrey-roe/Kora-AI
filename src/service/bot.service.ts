import OpenAI, { ClientOptions } from "openai";
import dotenv from 'dotenv';
dotenv.config();

const apiKey: string | undefined = process.env.OPENAI_3;
// const apiKey = "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"

if (!apiKey) {
  throw new Error("OpenAI API key is not provided.");
}
const openai = new OpenAI({ key: apiKey } as ClientOptions);

// function to generate documentation using GPT-3
export async function generateDocumentation(code: string): Promise<string> {
    try {
    const completionParams = {
      model: 'text-davinci-002',
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

// function to convert code using GPT-3
export async function convertCode(code: string, targetLanguage: string): Promise<string> {
  try {
    // Use the GPT-3 API to convert code
    const response = await openai.completions.create({
      model: 'text-davinci-002', // Use an appropriate engine
      prompt: `Convert the following code to ${targetLanguage}:\n\n${code}`,
    //   max_tokens: 150, 
    });

    // Extract the converted code from the response
    const convertedCode = response.choices[0].text.trim();

    return convertedCode;
  } catch (error) {
    console.error('Error converting code:', error);
    throw error;
  }
}