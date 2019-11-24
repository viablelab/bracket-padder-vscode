'use strict';

import * as vsc from 'vscode';
import { smartBackspace, smartClose, smartSpace } from './smartActions';

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
  ];

  context.subscriptions.concat(disposables);
}

export function deactivate() {
  // ..
}
