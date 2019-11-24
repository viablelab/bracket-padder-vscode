import * as vsc from 'vscode';
import {
  getUnclosedPairs,
  invert,
  reduceIntoKeyPairs,
  removeEscapedQuotes,
} from './utils';

const config = vsc.workspace.getConfiguration('bracket-padder');
const pairs = config.smartPairs;

const invertedPairs = invert(pairs);

interface PairsMap {
  [character: string]: string;
}

const unpad: PairsMap = reduceIntoKeyPairs(pairs, key => ({
  [key]: ' ' + pairs[key],
}));

const pad: PairsMap = reduceIntoKeyPairs(pairs, key => ({
  [key + ' ']: pairs[key],
}));

/**
 * Return `n` characters adjacent to `position`.
 */
function getAdjacentCharacters(
  document: vsc.TextDocument,
  position: vsc.Position,
  n: number
): string {
  const toPosition = new vsc.Position(position.line, position.character + n);
  return document.getText(new vsc.Range(position, toPosition));
}

const insert = (cursor: vsc.Position, content: string) => (
  edit: vsc.TextEditorEdit
): void => edit.insert(cursor, content);

/**
 * "Unpads" bracket pairs on backspace. E.g: (| = cursor)
 *
 * ------------------------------
 * { | } + <Backspace>
 * Results in: {|}
 * Instead of: {| }
 * ------------------------------
 */
export function smartBackspace(
  _change: vsc.TextDocumentContentChangeEvent
): Thenable<boolean | undefined> {
  const editor = vsc.window.activeTextEditor;

  if (!editor || editor.selections.length > 1) {
    return Promise.resolve(false);
  }

  const document = editor.document;
  const selection = editor.selection;

  try {
    const prevChar = getAdjacentCharacters(document, selection.active, -1);
    const nextChars = getAdjacentCharacters(document, selection.active, 2);

    if (nextChars === unpad[prevChar]) {
      return vsc.commands.executeCommand('deleteRight');
    }

    return Promise.resolve(false);
  } catch (err) {
    return Promise.resolve(false);
  }
}

/**
 * Pads bracket pairs on space. E.g: (| = cursor)
 *
 * ------------------------------
 * {|} + <Space>
 * Results in: { | }
 * Instead of: { |}
 * ------------------------------
 */
export function smartSpace(
  change: vsc.TextDocumentContentChangeEvent
): Thenable<boolean> {
  const editor = vsc.window.activeTextEditor;

  if (!editor || editor.selections.length > 1) {
    return Promise.resolve(false);
  }

  const document = editor.document;

  try {
    const cursorPriorToChange = change.range.start;
    const cursorAfterChange = change.range.start.translate(0, 1);

    const prevChars = getAdjacentCharacters(document, cursorAfterChange, -2);
    const nextChar = getAdjacentCharacters(document, cursorAfterChange, 1);

    if (nextChar === pad[prevChars]) {
      return editor
        .edit(insert(cursorPriorToChange, ' '), {
          undoStopAfter: false,
          undoStopBefore: false,
        })
        .then(() => {
          editor.selection = new vsc.Selection(
            cursorAfterChange,
            cursorAfterChange
          );
          return true;
        });
    }

    return Promise.resolve(false);
  } catch (err) {
    return Promise.resolve(false);
  }
}

/**
 * Closes bracket pairs when applicable. E.g: (| = cursor)
 *
 * ------------------------------
 * { foo: 'bar'| } + <}>
 * Results in: { foo: 'bar' }|
 * Instead of: { foo: 'bar'}| }
 * ------------------------------
 */
export function smartClose(
  change: vsc.TextDocumentContentChangeEvent
): Thenable<boolean> {
  const opening = invertedPairs[change.text];

  if (!opening) {
    return Promise.resolve(false);
  }

  const editor = vsc.window.activeTextEditor;

  if (!editor || editor.selections.length > 1) {
    return Promise.resolve(false);
  }

  const document = editor.document;
  const line = document.lineAt(change.range.start.line);

  if (line.text.length > config.smartCloseMaxParseLength) {
    return Promise.resolve(false);
  }

  const index = change.range.start.character;
  const nextChars = line.text.slice(index + 1, index + 3);

  if (nextChars !== ' ' + change.text) {
    return Promise.resolve(false);
  }

  const prevChars = removeEscapedQuotes(line.text.slice(0, index));

  if (!prevChars.includes(opening)) {
    return Promise.resolve(false);
  }

  const unclosedPairs = getUnclosedPairs(prevChars);
  const lastPair = unclosedPairs.pop();

  if (lastPair !== opening) {
    return Promise.resolve(false);
  }

  return editor
    .edit(
      edit =>
        edit.delete(
          new vsc.Range(change.range.start, change.range.start.translate(0, 1))
        ),
      { undoStopAfter: false, undoStopBefore: false }
    )
    .then(() => {
      const position = change.range.start.translate(0, 2);
      editor.selection = new vsc.Selection(position, position);
      return true;
    });
}
