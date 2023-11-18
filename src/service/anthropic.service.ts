//test.ts
import * as vscode from 'vscode';
import config from '../config/defaults';

//Function that uses anthropic to extract express controllers
export async function getExpressFunctions() {
    try {
        const AnthropicFunctionsModule = await import("langchain/experimental/chat_models/anthropic_functions");
        const { HumanMessage } = await import("langchain/schema");

        const model = new AnthropicFunctionsModule.AnthropicFunctions({
            temperature: 0.1,
            anthropicApiKey: config.ANTHROPIC_API_KEY, 
        }).bind({
            functions: [
                {
                    name: "get_current_weather",
                    description: "Get the current weather in a given location",
                    parameters: {
                        type: "object",
                        properties: {
                            location: {
                                type: "string",
                                description: "The city and state, e.g. San Francisco, CA",
                            },
                            unit: { type: "string", enum: ["celsius", "fahrenheit"] },
                        },
                        required: ["location"],
                    },
                },
            ],
            //  can probably set the `function_call` arg to force the model to use a function
            function_call: {
                name: "get_current_weather",
            },
        });

        const response = await model.invoke([
            new HumanMessage({
                content: "What's the weather in Boston?",
            }),
        ]);

        vscode.window.showInformationMessage(`Response: ${response}`);

    } catch (error) {
        vscode.window.showErrorMessage(`Error importing AnthropicFunctions: ${error}`);
    }
}

