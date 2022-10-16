import { Plugin } from "obsidian";
import { CheckboxCyclerPluginSettings, DEFAULT_SETTINGS, CheckboxCyclerSettingTab } from "./settings"

export default class CheckboxCyclerPlugin extends Plugin {
  settings: CheckboxCyclerPluginSettings;

  async onload() {
    console.log("loading plugin");

    await this.loadSettings();
		this.loadCommands();
    this.loadRibbon();

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
  }

  loadRibbon() {
  }
}
