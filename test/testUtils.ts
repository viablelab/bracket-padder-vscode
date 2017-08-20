import * as R from 'ramda';
import * as vsc from 'vscode';
import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';

function rndName(): string {
  return Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 10);
}

function createRandomFile(contents = '', fileExtension = 'txt'): Thenable<vsc.Uri> {
  return new Promise((resolve, reject) => {
    const tmpFile = path.join(os.tmpdir(), rndName() + `.${fileExtension}`);
    fs.writeFile(tmpFile, contents, err => {
      if (err) {
        return reject(err);
      }

      resolve(vsc.Uri.file(tmpFile));
    });
  });
}

function deleteFile(file: vsc.Uri): Thenable<boolean> {
  return new Promise((resolve, reject) => {
    fs.unlink(file.fsPath, err => {
      if (err) {
        return reject(false);
      }

      resolve(true);
    })
  });
}

function getActiveEditor(): vsc.TextEditor {
  return vsc.window.activeTextEditor;
}

function getActiveDocument(): vsc.TextDocument {
  return getActiveEditor().document;
}

const groupSelectionsByLine = R.compose(
  R.groupBy(R.prop('line')),
  R.map(R.prop('active'))
);

const insertAtIndex = (str: string, index: number, char: string): string => {
  const start = str.slice(0, index);
  const end = str.slice(index);

  return start + char + end;
}

interface EditorUtil {
  clearEditor: () => Promise<boolean>,
  closeAllEditors: () => Promise<void>,
  convertCharacterToCursorPositions: (character: string, escape?: boolean) => Promise<void>,
  convertCursorPositionsToCharacter: (character: string) => Promise<void>,
  createAndOpenEditor: () => Promise<boolean>,
  populateEditor: (contents: string) => Thenable<vsc.TextEditor>,
}

export function createEditorUtil(): EditorUtil {
  let file;

  return {
    async clearEditor() {
      const editor = getActiveEditor();
      await vsc.commands.executeCommand('editor.action.selectAll');

      return editor.edit(edit =>
        edit.delete(editor.selection)
      );
    },
    async closeAllEditors() {
      const doc = getActiveDocument();

      if (doc.isDirty) {
        await doc.save();
      }

      await deleteFile(file);
      await vsc.commands.executeCommand('workbench.action.closeAllEditors');      
    },
    async convertCharacterToCursorPositions(character, escape = true) {
      const editor = getActiveEditor();
      const lineCount = editor.document.lineCount;
      const positions = [];

      // Find positions of all `character` occurrences
      for (let i = 0; i < lineCount; i++) {
        const line = editor.document.lineAt(i);
        const text = line.text;
        let hitCount = 0;

        for (let charIndex = 0; charIndex < text.length; charIndex++) {
          if (text[charIndex] === character) {
            positions.push(new vsc.Position(line.lineNumber, charIndex - hitCount));
            hitCount++;
          }
        }

        await editor.edit(edit => {
          const regex = new RegExp(escape ? `\\${character}` : character, 'g');
          edit.replace(line.range, text.replace(regex, ''));
        });
      }

      editor.selections = positions.map(position =>
        new vsc.Selection(position, position)
      );
    },
    async convertCursorPositionsToCharacter(character) {
      const editor = getActiveEditor();
      const selectionsByLine = groupSelectionsByLine(editor.selections);

      for (let lineNumber in selectionsByLine) {
        const line = editor.document.lineAt(Number(lineNumber));
        let text = line.text;
        let insertCount = 0;
        
        for (let selection of selectionsByLine[lineNumber]) {
          text = insertAtIndex(text, selection.character + insertCount, character);
          insertCount++;
        }

        await editor.edit(edit => {
          edit.replace(line.range, text);
        });
      }
    },
    async createAndOpenEditor() {
      file = await createRandomFile();

      const doc = await vsc.workspace.openTextDocument(file);
      await vsc.window.showTextDocument(doc);
      
      return true;
    },
    populateEditor(contents) {
      const editor = getActiveEditor();
      
      return editor.edit(edit =>
        edit.insert(new vsc.Position(0, 0), contents)
      ).then(() => editor);
    },
  };
}
