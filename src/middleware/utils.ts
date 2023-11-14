// utils.ts
import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export function extractViewContent(fileContent: string, viewName: string): string | undefined {
    // Use a regex to find the view function or class
    const viewDeclarationRegex = new RegExp(`(?:class\\s+${viewName}\\s*\\([^:]*:\\s*|def\\s+${viewName}\\s*\\([^)]*\\):)[^]*?(?=(?:\\s*class\\s+|\\s*def\\s+|\\s*\\bpath\\(|\\s*\\burl\\(|\\s*\\bre_path\\())|(?=$)`, 'g');
    const match = viewDeclarationRegex.exec(fileContent);
    
    if (match) {
        // The matched content is the body of the view function or class
        return match[0];
    }

    return undefined;
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

function isWithinDjangoProject(filePath: string): boolean {
    // Check if the file is within a Django project by looking for manage.py
    const workspaceFolders = vscode.workspace.workspaceFolders;

    if (!workspaceFolders || workspaceFolders.length === 0) {
        return false;
    }

    const rootPath = workspaceFolders[0].uri.fsPath;
    const managePyPath = path.join(rootPath, 'manage.py');
    return filePath.includes(path.sep) && filePath.startsWith(rootPath) && fs.existsSync(managePyPath);
}


export function isWithinVirtualEnv(filePath: string): boolean {
    // Common patterns for virtual environment folders
    const virtualEnvPatterns = ['venv', '.venv', 'env'];

    // Subdirectories to exclude
    const excludedSubdirectories = ['bin', 'lib'];

    // Normalize the file path for case-insensitive comparison
    const normalizedFilePath = filePath.toLowerCase();

    // Check if the file path is within a Django project
    if (isWithinDjangoProject(filePath)) {
        // Check if the file path contains any of the common virtual environment patterns
        const isInVirtualEnv = virtualEnvPatterns.some(pattern => normalizedFilePath.includes(path.sep + pattern + path.sep));

        // Check if the file path contains any of the excluded subdirectories
        const isExcluded = excludedSubdirectories.some(subdir => normalizedFilePath.includes(path.sep + subdir + path.sep));

        // Return true if it's in a virtual environment and not in an excluded subdirectory
        return isInVirtualEnv && !isExcluded;
    }

    return false;
}