import * as vscode from 'vscode';

//TODO: add more frameworks from here to the main code as time goes on.
export function identifyCodebaseFramework(): string | undefined {
  const activeTextEditor: vscode.TextEditor | undefined = vscode.window.activeTextEditor;

  if (activeTextEditor) {
    const document: vscode.TextDocument = activeTextEditor.document;
    const code: string = document.getText();
    const filePath: string | undefined = vscode.window.activeTextEditor?.document.fileName;

    // Define regular expressions for each framework
    const expressRegex: RegExp = /\bexpress\b.*(\bapp\.listen\b|\bcreateServer\b)/i;
    const djangoRegex: RegExp = /\bdjango\b.*(\burlpatterns\b.*\bdjango\.urls\b|\bpath\s*\(.*\))/i;
    const springBootRegex: RegExp = /\bspring-boot\b.*\b@SpringBootApplication\b/i;
    const railsRegex: RegExp = /\brails\b/i;
    const laravelRegex: RegExp = /\blaravel\b/i;
    const nestjsRegex: RegExp = /\bnestjs\b/i;
    const flaskRegex: RegExp = /\bflask\b/i;
    const sinatraRegex: RegExp = /\bsinatra\b/i;
    const vueRegex: RegExp = /\bvue\b/i;
    const angularRegex: RegExp = /\bangular\b/i;
    const reactRegex: RegExp = /\breact\b/i;

    const nodeRegex: RegExp = /\bnode\b/i;
    const koaRegex: RegExp = /\bkoa\b/i;
    const symfonyRegex: RegExp = /\bsymfony\b/i;
    const phoenixRegex: RegExp = /\bphoenix\b/i;
    const expressRouteRegex: RegExp = /\b\.route\b/i;

    // Check for matches with regular expressions
    if (expressRegex.test(code) || expressRouteRegex.test(code)) {
      return 'Express.js';
    } else if (djangoRegex.test(code)) {
      return 'Django';
    } else if (springBootRegex.test(code)) {
      return 'Spring Boot';
    } else if (railsRegex.test(filePath || '')) {
      return 'Ruby on Rails';
    } else if (laravelRegex.test(code)) {
      return 'Laravel';
    } else if (nestjsRegex.test(code)) {
      return 'Nest.js';
    } else if (flaskRegex.test(code)) {
      return 'Flask';
    } else if (sinatraRegex.test(code)) {
      return 'Sinatra';
    } else if (vueRegex.test(code)) {
      return 'Vue.js';
    } else if (angularRegex.test(code)) {
      return 'Angular';
    } else if (reactRegex.test(code)) {
      return 'React';
    } else if (nodeRegex.test(code) || koaRegex.test(code)) {
      return 'Node.js/Koa';
    } else if (symfonyRegex.test(code)) {
      return 'Symfony';
    } else if (phoenixRegex.test(code)) {
      return 'Phoenix';
    }

    // If no specific framework is identified
    return undefined;
  }

  // If no active text editor
  return undefined;
}
