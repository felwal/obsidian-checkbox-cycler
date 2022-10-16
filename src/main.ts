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
    let checkbox = lineTrimmed.substring(0, 5);

    if (checkbox.length < 1) {
      console.log("line too short");
      return;
    }
    else if (!["-", "*", "+"].includes(checkbox[0])) {
      console.log("line not list item");
      return;
    }
    else if (checkbox[1] !== " " || checkbox[2] !== "[" || checkbox[4] !== "]") {
      console.log("line not checkbox");
      return;
    }

    let state = checkbox[3];
    let stateIndex = line.length - lineTrimmed.length + 3;
    let newState = states[(states.indexOf(state) + 1) % states.length];

    console.log(checkbox);
    console.log("line: " + lineIndex + ", ch: " + stateIndex);

    editor.replaceRange(
      newState,
      {line: lineIndex, ch: stateIndex},
      {line: lineIndex, ch: stateIndex + 1}
    )
  }
}
