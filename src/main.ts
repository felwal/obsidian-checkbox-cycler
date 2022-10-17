import { Plugin, Editor } from "obsidian";
import { EditorView } from "@codemirror/view";
import { CheckboxCyclerPluginSettings, DEFAULT_SETTINGS, CheckboxCyclerSettingTab } from "./settings"
import { type } from "os";

const STATE_INDEX = 3;

export default class CheckboxCyclerPlugin extends Plugin {
  settings: CheckboxCyclerPluginSettings;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
    this.loadCommands();
    this.registerEvents();

    this.addSettingTab(new CheckboxCyclerSettingTab(this.app, this));
  }

  onunload() {
    console.log("unloading plugin");
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  loadCommands() {
    this.addCommand({
      id: "cycle-checkbox",
      name: "Cycle checkbox",
      icon: "checkbox-glyph",
      editorCallback: (editor: Editor) => this.cycleBulletOrCheckbox(editor)
    });
  }

  registerEvents() {
    // register checkbox click in live preview mode
    this.registerDomEvent(document, "click", (evt: MouseEvent) => {
      if (!this.settings.previewModeEnabled) {
        return;
      }

      const checkbox = Object(evt.target);

      if (checkbox.className === "task-list-item-checkbox") {
        evt.preventDefault();

        try {
          // @ts-expect-error, not typed
          let editor = this.app.workspace.activeLeaf?.view.editor as Editor;
          // @ts-expect-error, not typed
          let editorView = editor.cm as EditorView;
          let offset = editorView.posAtDOM(checkbox);

          let pos = editor.offsetToPos(offset);
          let lineIndex = pos.line;
          console.log(lineIndex);

          this.cycleCheckbox(editor, lineIndex)
        }
        catch (e) {
          console.log("not supported in reading mode");
        }
      }
    });
  }

  cycleBulletOrCheckbox(editor: Editor) {
    let lineIndex = editor.getCursor().line;
    let line = editor.getLine(lineIndex);
    let lineTrimmed = line.trimStart();

    let trimSize = line.length - lineTrimmed.length;
    let checkbox = lineTrimmed.substring(0, 6);

    // add bullet
    if (checkbox.length < 2 || !["-", "*", "+"].includes(checkbox[0]) || checkbox[1]  !== " ") {
      editor.replaceRange("- ", {line: lineIndex, ch: trimSize});

      if (editor.getCursor().ch <= trimSize) {
        editor.setCursor({line: lineIndex, ch: trimSize + 2});
      }
    }

    // add box
    else if (checkbox[1] !== " " || checkbox[2] !== "[" || checkbox[4] !== "]" || checkbox[5] !== " ") {
      editor.replaceRange(
        " [" + this.settings.states[0] + "]",
        {line: lineIndex, ch: trimSize + 1}
      );
    }

    // remove box
    else if (checkbox[STATE_INDEX] === this.settings.states[this.settings.states.length - 1]) {
      editor.replaceRange(
        "",
        {line: lineIndex, ch: trimSize + 1},
        {line: lineIndex, ch: trimSize + 5}
      );
    }

    // cycle box state
    else {
      this.updateCheckboxState(editor, lineIndex, trimSize, checkbox);
    }
  }

  cycleCheckbox(editor: Editor, lineIndex: number) {
    let line = editor.getLine(lineIndex);
    let lineTrimmed = line.trimStart();

    let trimSize = line.length - lineTrimmed.length;
    let checkbox = lineTrimmed.substring(0, 6);

    this.updateCheckboxState(editor, lineIndex, trimSize, checkbox);
  }

  updateCheckboxState(editor: Editor, lineIndex: number, trimSize: number, checkbox: string) {
    let stateIndexOnLine = trimSize + STATE_INDEX;
    let state = checkbox[STATE_INDEX];
    let newState = this.settings.states[(this.settings.states.indexOf(state) + 1) % this.settings.states.length];

    editor.replaceRange(
      newState,
      {line: lineIndex, ch: stateIndexOnLine},
      {line: lineIndex, ch: stateIndexOnLine + 1}
    )
  }
}
