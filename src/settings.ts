import { App, PluginSettingTab, Setting } from "obsidian";
import CheckboxCyclerPlugin from "./main";

export interface CheckboxCyclerPluginSettings {
  mySetting: string;
}

export const DEFAULT_SETTINGS: CheckboxCyclerPluginSettings = {
  mySetting: "default"
}

export class CheckboxCyclerSettingTab extends PluginSettingTab {
  plugin: CheckboxCyclerPlugin;

  constructor(app: App, plugin: CheckboxCyclerPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  display(): void {
    const {containerEl} = this;

    containerEl.empty();
    containerEl.createEl("h1", {text: "Checkbox Cycler"});
  }
}
