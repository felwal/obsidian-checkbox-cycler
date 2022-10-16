import { App, PluginSettingTab, Setting } from "obsidian";
import CheckboxCyclerPlugin from "./main";

export interface CheckboxCyclerPluginSettings {
  states: Array<string>;
}

export const DEFAULT_SETTINGS: CheckboxCyclerPluginSettings = {
  states: [" ", "/", "x", "-"]
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
    containerEl.createEl("h2", {text: "States"});

    // states
    for (let i = 0; i < this.plugin.settings.states.length; i++) {
      let state = this.plugin.settings.states[i];

      new Setting(containerEl)
      .setName("- [" + state + "]")
      .addText(text => text
        .setPlaceholder("A character")
        .setValue(state)
        .onChange(async (value) => {
          this.plugin.settings.states[i] = value[0];

          await this.plugin.saveSettings();
        })
      )
      .addButton(button => {
        button.setIcon("up-chevron-glyph")
          .setTooltip("Move up")
          .onClick(async (callback) => {
            let temp = this.plugin.settings.states[i];
            this.plugin.settings.states[i] = this.plugin.settings.states[i - 1];
            this.plugin.settings.states[i - 1] = temp;

            await this.plugin.saveSettings();
            this.display();
          })

        if (i === 0) {
          button.setDisabled(true);
        }
      })
      .addButton(button => {
        button.setIcon("down-chevron-glyph")
          .setTooltip("Move down")
          .onClick(async (callback) => {
            let temp = this.plugin.settings.states[i];
            this.plugin.settings.states[i] = this.plugin.settings.states[i + 1];
            this.plugin.settings.states[i + 1] = temp;

            await this.plugin.saveSettings();
            this.display();
          })

        if (i === this.plugin.settings.states.length - 1) {
          button.setDisabled(true);
        }
      })
      .addButton(button => button
        .setIcon("trash")
        .setTooltip("Delete")
        .setWarning()
        .onClick(async (callback) => {
          this.plugin.settings.states.splice(i, 1);

          await this.plugin.saveSettings();
          this.display();
        })
      );

    }

    // add state
    new Setting(containerEl)
      .addButton(button => button
        .setButtonText("Add state")
        .onClick(async (callback) => {
          this.plugin.settings.states.push("");

          await this.plugin.saveSettings();
          this.display();
        })
      )
  }
}
