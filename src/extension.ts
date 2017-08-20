'use strict';

import * as vsc from 'vscode';
import {
  smartBackspace,
  smartClose,
  // smartClosingCurlyBracket,
  // smartClosingSquareBracket,
  // smartClosingParen,
  smartSpace
} from './smartActions';

export function activate(context: vsc.ExtensionContext) {
  const disposables = [
    vsc.workspace.onDidChangeTextDocument(event => {
      try {
        const change = event.contentChanges[0];
        
        if (change.rangeLength === 0 && change.text === ' ') {
          smartSpace(change);
          return;
        }
        
        if (change.rangeLength === 1 && change.text === '') {
          smartBackspace(change);
          return;
        }

        smartClose(change);
      } catch (err) {
        // Ignore
      }
    }),
    // vsc.commands.registerCommand('extension.smartClosingCurlyBracket', smartClosingCurlyBracket),
    // vsc.commands.registerCommand('extension.smartClosingSquareBracket', smartClosingSquareBracket),
    // vsc.commands.registerCommand('extension.smartClosingParen', smartClosingParen),
  ];

  context.subscriptions.concat(disposables);
}

export function deactivate() {
  // ..
}
