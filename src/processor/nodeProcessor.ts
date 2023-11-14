//function to find the ending of a function in node.ts file
function findEndOfBlock(content: string, startIndex: number): number {
    let openBraces = 0;
    let i = startIndex;

    while (i < content.length) {
        if (content[i] === '{') {
            openBraces++;
        } else if (content[i] === '}') {
            openBraces--;

            if (openBraces === 0) {
                return i;
            }
        }

        i++;
    }

    return -1; // Not found
}
