import * as vscode from 'vscode';

// CommonView interface
interface CommonView {
    name: string;
    content: {
        moduleName: string;
        functionName: string;
        content: string;
    } | string;
}

// DjangoView interface
interface DjangoView extends CommonView {
    content: {
        moduleName: string;
        functionName: string;
        content: string;
    } | string;
}
// function for generating documentation for Django views
export function generateDocumentation(views: CommonView[]) {
    // Iterating over the list of views and generate documentation
    for (const view of views) {
        // Customize this part based on how you want to document each view
        vscode.window.showInformationMessage(`Generating documentation for View: ${view.name}`);
    }

    // Additional logic or aggregation to be performed here.
}
