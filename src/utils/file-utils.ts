import * as vscode from 'vscode';
import * as path from 'path';

// Function to recursively find files with specified extensions
export async function filesRecursive(directory: string, allowedExtensions: string[], excludedFolders: string[] = ['node_modules', 'dist', 'out', 'lib'], testFilePattern: RegExp = /\.(test|spec)\.(ts|js|py)$/): Promise<string[]> {
    let fileArray: string[] = [];

    const files = await vscode.workspace.fs.readDirectory(vscode.Uri.file(directory));

    for (const [name, type] of files) {
        const fullPath = path.join(directory, name);

        if (type === vscode.FileType.File && allowedExtensions.includes(path.extname(fullPath)) && !testFilePattern.test(name)) {
            fileArray.push(fullPath);
        } else if (type === vscode.FileType.Directory && !excludedFolders.includes(name)) {
            fileArray = fileArray.concat(await filesRecursive(fullPath, allowedExtensions, excludedFolders, testFilePattern));
        }
    }

    return fileArray;
}

export function isCommentedOut(content: string, index: number): boolean {
    // Check if the match is within a comment block
    const commentRegex = /(?:^|\s)#.*$/gm;
    let match;

    while ((match = commentRegex.exec(content)) !== null) {
        if (match.index < index && index < commentRegex.lastIndex) {
            return true;
        }
    }

    return false;
}