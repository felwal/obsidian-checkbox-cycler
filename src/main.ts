import { Plugin, Editor } from "obsidian";
import { CheckboxCyclerPluginSettings, DEFAULT_SETTINGS, CheckboxCyclerSettingTab } from "./settings"

const states = [" ", "/", "x", "-"];

export default class CheckboxCyclerPlugin extends Plugin {
  settings: CheckboxCyclerPluginSettings;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
    this.loadCommands();

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
      editorCallback: (editor: Editor) => this.cycleCheckbox(editor)
    });
  }

  cycleCheckbox(editor: Editor) {
    // - [ ]
    let lineIndex = editor.getCursor().line;
    let line = editor.getLine(lineIndex);
    let lineTrimmed = line.trimStart();
    let trimSize = line.length - lineTrimmed.length;
    let checkbox = lineTrimmed.substring(0, 6);

    // add bullet and box
    if (checkbox.length < 2 || !["-", "*", "+"].includes(checkbox[0]) || checkbox[1]  !== " ") {
      editor.replaceRange("- [ ] ", {line: lineIndex, ch: 0});
    }

    // add box
    else if (checkbox[1] !== " " || checkbox[2] !== "[" || checkbox[4] !== "]" || checkbox[5] !== " ") {
      editor.replaceRange(" [ ]", {line: lineIndex, ch: trimSize + 1});
    }

    // cycle box state
    else {
      const stateIndex = 3;
      let stateIndexOnLine = trimSize + stateIndex;
      let state = checkbox[stateIndex];
      let newState = states[(states.indexOf(state) + 1) % states.length];

      console.log(checkbox);
      console.log("line: " + lineIndex + ", ch: " + stateIndexOnLine);

      editor.replaceRange(
        newState,
        {line: lineIndex, ch: stateIndexOnLine},
        {line: lineIndex, ch: stateIndexOnLine + 1}
      )
    }
  }
}
