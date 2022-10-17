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

  //

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  loadCommands() {
    this.addCommand({
      id: "cycle-bullet-checkbox",
      name: "Cycle bullet/checkbox",
      icon: "checkbox-glyph",
      editorCallback: (editor: Editor) => this.cycleCheckbox(editor, true)
    });

    this.addCommand({
      id: "cycle-checkbox-status",
      name: "Cycle checkbox status",
      icon: "checkbox-glyph",
      editorCallback: (editor: Editor) => this.cycleCheckbox(editor, false)
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

          this.onCheckboxClick(editor, lineIndex)
        }
        catch (e) {
          console.log("not supported in reading mode");
        }
      }
    });
  }

  //

  cycleCheckbox(editor: Editor, cycleThroughBullet: boolean) {
    let lineIndex = editor.getCursor().line;
    let line = editor.getLine(lineIndex);
    let lineTrimmed = line.trimStart();

    let trimSize = line.length - lineTrimmed.length;
    let checkbox = lineTrimmed.substring(0, 6);

    if (!this.isBullet(checkbox)) {
      // add bullet or checkbox
      this.insert(editor, cycleThroughBullet ? "- " : "- [ ] ", lineIndex, trimSize);
    }
    else if (!this.isCheckbox(checkbox)) {
      // add checkbox to bullet
      this.insert(editor, " [" + this.settings.states[0] + "]", lineIndex, trimSize + 1);
    }
    else if (cycleThroughBullet && checkbox[STATE_INDEX] === this.settings.states[this.settings.states.length - 1]) {
      // remove checkbox from bullet
      editor.replaceRange(
        "",
        {line: lineIndex, ch: trimSize + 1},
        {line: lineIndex, ch: trimSize + 5}
      );
    }
    else {
      this.updateCheckboxState(editor, lineIndex, trimSize, checkbox);
    }
  }

  onCheckboxClick(editor: Editor, lineIndex: number) {
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

  //

  isBullet(line: string) {
    return line.length > 1 && ["-", "*", "+"].includes(line[0]) && line[1] === " ";
  }

  isCheckbox(line: string) {
    return line[1] === " " && line[2] === "[" && line[4] === "]" && line[5] === " ";
  }

  insert(editor: Editor, insertion: string, line: number, ch: number) {
    editor.replaceRange(insertion, {line: line, ch: ch});

    if (editor.getCursor().ch <= ch) {
      editor.setCursor({line: line, ch: ch + insertion.length});
    }
  }
}
