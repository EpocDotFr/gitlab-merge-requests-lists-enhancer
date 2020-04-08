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
            this.enableButtonToCopyMrInfoCheckbox = document.querySelector('input#option_enable_button_to_copy_mr_info');
            this.copyMrInfoFormatTextarea = document.querySelector('textarea#copy_mr_info_format');
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

            this.enableButtonToCopyMrInfoCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    self.copyMrInfoFormatTextarea.parentNode.parentNode.classList.remove('is-hidden');
                } else {
                    self.copyMrInfoFormatTextarea.parentNode.parentNode.classList.add('is-hidden');
                }
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