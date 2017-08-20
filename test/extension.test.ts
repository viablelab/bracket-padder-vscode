import * as assert from 'assert';

import * as vsc from 'vscode';
import {
  createEditorUtil,
} from './testUtils';
import * as extension from '../src/extension';
import { smartBackspace, smartClose, smartSpace } from '../src/smartActions';

const editorUtil = createEditorUtil();

suite('smartBackspace', () => {
  suiteSetup(editorUtil.createAndOpenEditor);
  suiteTeardown(editorUtil.closeAllEditors);
  teardown(editorUtil.clearEditor); // After each

  test('unpads configured bracket pairs', async () => {
    const contents = 'import {| } from "library"';
    const expected = 'import {|} from "library"';

    const changeEvent: vsc.TextDocumentContentChangeEvent = {
      range: new vsc.Range(0, 8, 0, 9),
      rangeLength: 1,
      text: '',
    };

    const editor = await editorUtil.populateEditor(contents);
    await editorUtil.convertCharacterToCursorPositions('|');
    await smartBackspace(changeEvent);
    await editorUtil.convertCursorPositionsToCharacter('|');

    assert.equal(editor.document.getText(), expected);
  });

  test('behaves normally in other situations', async () => {
    const contents = 'import { |} from "library"';
    const expected = contents;

    const changeEvent: vsc.TextDocumentContentChangeEvent = {
      range: new vsc.Range(0, 9, 0, 10),
      rangeLength: 1,
      text: '',
    };

    const editor = await editorUtil.populateEditor(contents);
    await editorUtil.convertCharacterToCursorPositions('|');
    await smartBackspace(changeEvent);
    await editorUtil.convertCursorPositionsToCharacter('|');

    assert.equal(editor.document.getText(), expected);
  });
});

suite('smartSpace', () => {
  suiteSetup(editorUtil.createAndOpenEditor);
  suiteTeardown(editorUtil.closeAllEditors);
  teardown(editorUtil.clearEditor); // After each

  test('pads configured bracket pairs', async () => {
    const contents = 'import {| } from "library"';
    const expected = 'import { | } from "library"';

    const changeEvent: vsc.TextDocumentContentChangeEvent = {
      range: new vsc.Range(0, 8, 0, 8),
      rangeLength: 0,
      text: ' ',
    };

    const editor = await editorUtil.populateEditor(contents);
    await editorUtil.convertCharacterToCursorPositions('|');
    await smartSpace(changeEvent);
    await editorUtil.convertCursorPositionsToCharacter('|');

    assert.equal(editor.document.getText(), expected);
  });

  test('does nothing in other situations', async () => {
    const contents = 'import |{ } from "library"';
    const expected = contents;

    const changeEvent: vsc.TextDocumentContentChangeEvent = {
      range: new vsc.Range(0, 7, 0, 7),
      rangeLength: 0,
      text: ' ',
    };
    
    const editor = await editorUtil.populateEditor(contents);
    await editorUtil.convertCharacterToCursorPositions('|');
    await smartSpace(changeEvent);
    await editorUtil.convertCursorPositionsToCharacter('|');

    assert.equal(editor.document.getText(), expected);
  });
});

suite('smartClose', () => {
  suiteSetup(editorUtil.createAndOpenEditor);
  suiteTeardown(editorUtil.closeAllEditors);
  teardown(editorUtil.clearEditor); // After each

  test('closes configured bracket pairs', async () => {
    const contents = 'import { |} } from "library"';
    const expected = 'import {  }| from "library"';

    const changeEvent: vsc.TextDocumentContentChangeEvent = {
      range: new vsc.Range(0, 9, 0, 9),
      rangeLength: 0,
      text: '}',
    };

    const editor = await editorUtil.populateEditor(contents);
    await editorUtil.convertCharacterToCursorPositions('|');
    await smartClose(changeEvent);
    await editorUtil.convertCursorPositionsToCharacter('|');

    assert.equal(editor.document.getText(), expected);
  });

  test('does nothing in other situations', async () => {
    const contents = 'import { foo: "bar|} }';
    const expected = contents;

    const changeEvent: vsc.TextDocumentContentChangeEvent = {
      range: new vsc.Range(0, 18, 0, 18),
      rangeLength: 0,
      text: '}',
    };

    const editor = await editorUtil.populateEditor(contents);
    await editorUtil.convertCharacterToCursorPositions('|');
    await smartClose(changeEvent);
    await editorUtil.convertCursorPositionsToCharacter('|');

    assert.equal(editor.document.getText(), expected);
  });
});
