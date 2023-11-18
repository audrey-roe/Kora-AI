import * as vscode from 'vscode';

function getTargetFileExtension(targetLanguage: string): string {
    // Map target languages to file extensions
    const languageExtensions: Record<string, string> = {
        'JavaScript': 'js',
        'Python': 'py',
        'Java': 'java',
        'TypeScript': 'ts',
    };

    // Default to using the language as the extension
    return languageExtensions[targetLanguage] || targetLanguage.toLowerCase();
}

/**
 * Represents the code action provider for the Polyglot extension.
 */
class PolyglotCodeActionProvider implements vscode.CodeActionProvider {
    /**
     * Provides code actions for the given document, range, and context.
     *
     * @param {vscode.TextDocument} document - The document in which the code action provider is invoked.
     * @param {vscode.Range | vscode.Selection} range - The range for which code actions are requested.
     * @param {vscode.CodeActionContext} context - The context for the code action request.
     * @returns {vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]>} The list of code actions.
     */
    provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range | vscode.Selection,
        context: vscode.CodeActionContext
    ): vscode.ProviderResult<(vscode.Command | vscode.CodeAction)[]> {
        console.log('Code action provider invoked.');

        // Offer a code action to convert the code to a specific language
        const convertAction = new vscode.CodeAction('Polyglot: Convert Code', vscode.CodeActionKind.QuickFix);
        convertAction.command = {
            title: 'Polyglot: Convert Code',
            command: 'kodekraftai.polygot',
        };
        return [convertAction];
    }
}

export { PolyglotCodeActionProvider, getTargetFileExtension };
