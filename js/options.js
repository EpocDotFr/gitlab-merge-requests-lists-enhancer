(function(globals) {
    'use strict';

    class GmrleOptionsPage {
        constructor() {
            this.preferences = new globals.GmrlePreferences();

            this.getDomNodes();
            this.restoreOptionsFromStorage();
            this.attachEventListenersToDomNodes();
        }

        getDomNodes() {
            this.optionsForm = document.querySelector('form.gmrle-options');
            this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox = document.querySelector('input#enable_buttons_to_copy_source_and_target_branches_name');
        }

        restoreOptionsFromStorage() {
            let self = this;

            this.preferences.getAll(function(allOptions) {
                self.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked = allOptions.enable_buttons_to_copy_source_and_target_branches_name;
            });
        }

        attachEventListenersToDomNodes() {
            let self = this;

            this.optionsForm.addEventListener('submit', function(e) {
                e.preventDefault();

                self.saveOptionsToStorage();
            });
        }

        saveOptionsToStorage() {
            this.preferences.setAll({
                enable_buttons_to_copy_source_and_target_branches_name: this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        let op = new GmrleOptionsPage();
    });
}(this));