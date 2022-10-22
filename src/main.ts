import { Plugin, Editor, TFile, CachedMetadata } from "obsidian";
import { EditorView } from "@codemirror/view";
import { CheckboxCyclerPluginSettings, DEFAULT_SETTINGS, CheckboxCyclerSettingTab } from "./settings"

const STATE_INDEX = 3;
const FILE_CUSTOM_STATES_FM = "cb-states";

export default class CheckboxCyclerPlugin extends Plugin {
  settings: CheckboxCyclerPluginSettings;
  states: Array<string>;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
    this.loadCommands();
    this.registerEvents();
    this.loadStates(this.app.workspace.getActiveFile());

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
    // checkbox click in live preview mode
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

    // file open
    this.registerEvent(this.app.workspace.on("file-open", (file: TFile) => {
      console.log("file-open");
      this.loadStates(file);
    }));

    // metadata change
    //this.registerEvent(this.app.metadataCache.on("changed", (file: TFile, data: string, cache: CachedMetadata) => {
    //  console.log("metadata changed");
    //  this.loadStates(file);
    //}));
  }

  loadStates(file: TFile | null) {
    if (file) {
      let fm = this.getFrontMatter(file);

      if (fm) {
        let states = fm[FILE_CUSTOM_STATES_FM];

        if (states) {
          console.log(states);
          this.states = states.map((s: string) => s.length > 0 ? s[0] : " ");
          return;
        }
      }
    }

    this.states = this.settings.states;
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
      this.insert(editor, cycleThroughBullet ? "- " : "- [" + this.states[0] + "] ", lineIndex, trimSize);
    }
    else if (!this.isCheckbox(checkbox)) {
      // add checkbox to bullet
      this.insert(editor, " [" + this.states[0] + "]", lineIndex, trimSize + 1);
    }
    else if (cycleThroughBullet && checkbox[STATE_INDEX] === this.states[this.states.length - 1]) {
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
    let newState = this.states[(this.states.indexOf(state) + 1) % this.states.length];

    editor.replaceRange(
      newState,
      {line: lineIndex, ch: stateIndexOnLine},
      {line: lineIndex, ch: stateIndexOnLine + 1}
    )
  }

  //

  getFrontMatter(file: TFile) {
    return app.metadataCache.getFileCache(file)?.frontmatter;
  }

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
