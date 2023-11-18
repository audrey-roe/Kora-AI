//test.ts
import config from '../config/defaults';

async function useAnthropicFunctions() {
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

        console.log(response);

    } catch (error) {
        console.error('Error importing AnthropicFunctions:', error);
    }
}

// // Call the function to use AnthropicFunctions
// useAnthropicFunctions();
