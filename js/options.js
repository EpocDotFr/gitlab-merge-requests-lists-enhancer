(function(globals) {
    'use strict';

    class OptionsPage {
        /**
         * Class which handles everything related to the options page of the extension. Preferences are persisted in
         * the local storage of the browser.
         */
        constructor() {
            this.preferencesManager = new globals.GmrlePreferencesManager();

            this.getDomNodes();
            this.restoreOptionsFromStorage();
            this.attachEventListenersToDomNodes();
        }

        /**
         * Queries and caches every relevant DOM nodes for further manipulations.
         */
        getDomNodes() {
            this.optionsForm = document.querySelector('form');
            this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox = document.querySelector('input#enable_buttons_to_copy_source_and_target_branches_name');
        }

        /**
         * Retrieve preferences from local storage and update the options page accordingly.
         */
        restoreOptionsFromStorage() {
            let self = this;

            this.preferencesManager.getAll(function(preferences) {
                self.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked = preferences.enable_buttons_to_copy_source_and_target_branches_name;
            });
        }

        /**
         * Attach some events to DOM nodes that were queried early.
         */
        attachEventListenersToDomNodes() {
            let self = this;

            this.optionsForm.addEventListener('submit', function(e) {
                e.preventDefault();

                self.saveOptionsToStorage();
            });
        }

        /**
         * Take all DOM nodes values and perist them in the local storage.
         */
        saveOptionsToStorage() {
            this.preferencesManager.setAll({
                enable_buttons_to_copy_source_and_target_branches_name: this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        let op = new OptionsPage();
    });
}(this));