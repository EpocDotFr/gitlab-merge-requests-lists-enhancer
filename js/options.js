(function(globals) {
    'use strict';

    class OptionsPage {
        /**
         * Class which handles everything related to the options page of the extension. Preferences are persisted in
         * the browser's local storage.
         */
        constructor() {
            this.addBrowserDiscriminatingClassToBody();

            this.preferencesManager = new globals.Gmrle.PreferencesManager();

            this.getDomNodes();
            this.restoreOptionsFromStorage();
            this.attachEventListenersToDomNodes();
        }

        /**
         * Queries and caches every relevant DOM nodes for further manipulations.
         */
        getDomNodes() {
            this.optionsForm = document.querySelector('form');
            this.submitButtonInOptionsForm = this.optionsForm.querySelector('button[type="submit"]');

            this.displaySourceTargetBranchesOptionsDiv = document.querySelector('div#display-source-target-branches-options');
            this.displaySourceAndTargetBranchesCheckbox = document.querySelector('input#display_source_and_target_branches');
            this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox = document.querySelector('input#enable_buttons_to_copy_source_and_target_branches_name');

            this.copyMrInfoOptionsDiv = document.querySelector('div#copy-mr-info-options');
            this.enableButtonToCopyMrInfoCheckbox = document.querySelector('input#enable_button_to_copy_mr_info');
            this.copyMrInfoFormatTextarea = document.querySelector('textarea#copy_mr_info_format');

            this.jiraTicketLinkOptionsDiv = document.querySelector('div#jira-ticket-link-options');
            this.enableJiraTicketLinkCheckbox = document.querySelector('input#enable_jira_ticket_link');
            this.baseJiraUrlInput = document.querySelector('input#base_jira_url');
            this.jiraTicketLinkLabelTypeRadioButtons = Array.from(document.querySelectorAll('input[name="jira_ticket_link_label_type"]'));

            this.enableButtonToToggleWipStatusCheckbox = document.querySelector('input#enable_button_to_toggle_wip_status');

            this.automaticallyUpdatePipelineStatusIconsCheckbox = document.querySelector('input#automatically_update_pipeline_status_icons');
        }

        /**
         * Retrieve preferences from local storage and update the UI accordingly.
         */
        restoreOptionsFromStorage() {
            let self = this;

            this.preferencesManager.getAll(function(preferences) {
                self.displaySourceAndTargetBranchesCheckbox.checked = preferences.display_source_and_target_branches;
                self.displaySourceAndTargetBranchesCheckbox.dispatchEvent(new CustomEvent('change'));

                self.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked = preferences.enable_buttons_to_copy_source_and_target_branches_name;

                self.enableButtonToCopyMrInfoCheckbox.checked = preferences.enable_button_to_copy_mr_info;
                self.enableButtonToCopyMrInfoCheckbox.dispatchEvent(new CustomEvent('change'));

                self.copyMrInfoFormatTextarea.value = preferences.copy_mr_info_format;

                self.enableJiraTicketLinkCheckbox.checked = preferences.enable_jira_ticket_link;
                self.enableJiraTicketLinkCheckbox.dispatchEvent(new CustomEvent('change'));

                self.baseJiraUrlInput.value = preferences.base_jira_url;

                self.jiraTicketLinkLabelTypeRadioButtons.find(function(el) {
                    return el.value == preferences.jira_ticket_link_label_type;
                }).checked = true;

                self.enableButtonToToggleWipStatusCheckbox.checked = preferences.enable_button_to_toggle_wip_status;
                self.enableButtonToToggleWipStatusCheckbox.dispatchEvent(new CustomEvent('change'));

                self.automaticallyUpdatePipelineStatusIconsCheckbox.checked = preferences.automatically_update_pipeline_status_icons;
                self.automaticallyUpdatePipelineStatusIconsCheckbox.dispatchEvent(new CustomEvent('change'));
            });
        }

        /**
         * Attach some events to DOM nodes that were queried early.
         */
        attachEventListenersToDomNodes() {
            let self = this;

            this.optionsForm.addEventListener('submit', function(e) {
                e.preventDefault();

                if (self.hasUserDisabledAllFeatures()) {
                    return false;
                }

                if (!self.initializeVisualFeedbackOnSubmitButton()) {
                    return false;
                }

                self.saveOptionsToStorage();
            });

            this.displaySourceAndTargetBranchesCheckbox.addEventListener('change', function() {
                self.displaySourceTargetBranchesOptionsDiv.classList.toggle('is-hidden', !this.checked);

                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableButtonToCopyMrInfoCheckbox.addEventListener('change', function() {
                self.copyMrInfoOptionsDiv.classList.toggle('is-hidden', !this.checked);
                self.copyMrInfoFormatTextarea.toggleAttribute('required', this.checked);

                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableJiraTicketLinkCheckbox.addEventListener('change', function() {
                self.jiraTicketLinkOptionsDiv.classList.toggle('is-hidden', !this.checked);
                self.baseJiraUrlInput.toggleAttribute('required', this.checked);

                self.jiraTicketLinkLabelTypeRadioButtons.forEach(function(el) {
                    el.toggleAttribute('required', this.checked);
                }, this);

                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableButtonToToggleWipStatusCheckbox.addEventListener('change', function() {
                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.automaticallyUpdatePipelineStatusIconsCheckbox.addEventListener('change', function() {
                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });
        }

        /**
         * Take all DOM nodes values and persist them in the local storage.
         */
        saveOptionsToStorage() {
            let self = this;

            let jira_ticket_link_label_type = this.jiraTicketLinkLabelTypeRadioButtons.find(function(el) {
                return el.checked;
            }).value;

            this.preferencesManager.setAll(
                {
                    display_source_and_target_branches: this.displaySourceAndTargetBranchesCheckbox.checked,
                    enable_buttons_to_copy_source_and_target_branches_name: this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked,
                    enable_button_to_copy_mr_info: this.enableButtonToCopyMrInfoCheckbox.checked,
                    copy_mr_info_format: this.copyMrInfoFormatTextarea.value,
                    enable_jira_ticket_link: this.enableJiraTicketLinkCheckbox.checked,
                    base_jira_url: this.baseJiraUrlInput.value,
                    jira_ticket_link_label_type: jira_ticket_link_label_type,
                    enable_button_to_toggle_wip_status: this.enableButtonToToggleWipStatusCheckbox.checked,
                    automatically_update_pipeline_status_icons: this.automaticallyUpdatePipelineStatusIconsCheckbox.checked
                },
                function() {
                    self.setSuccessfulVisualFeedbackOnSubmitButton();
                },
                function() {
                    self.revertVisualFeedbackOnSubmitButton();
                }
            );
        }

        /**
         * Force the user to enable at least one feature if he disabled all the features of
         * the extension (which is useless).
         */
        forceUserToEnableAtLeastOneFeatureIfNecessarily() {
            if (this.hasUserDisabledAllFeatures() && !this.submitButtonInOptionsForm.disabled) {
                this.submitButtonInOptionsForm.disabled = true;
                this.submitButtonInOptionsForm.dataset.originalTextContent = this.submitButtonInOptionsForm.textContent;
                this.submitButtonInOptionsForm.textContent = '⚠️ Please enable at least one feature';
            } else if (this.submitButtonInOptionsForm.disabled) {
                this.submitButtonInOptionsForm.disabled = false;
                this.submitButtonInOptionsForm.textContent = this.submitButtonInOptionsForm.dataset.originalTextContent;

                delete this.submitButtonInOptionsForm.dataset.originalTextContent;
            }
        }

        /**
         * Determine if the user has disabled all the features of the extension (which is useless).
         */
        hasUserDisabledAllFeatures() {
            return !this.displaySourceAndTargetBranchesCheckbox.checked
                && !this.enableButtonToCopyMrInfoCheckbox.checked
                && !this.enableJiraTicketLinkCheckbox.checked
                && !this.enableButtonToToggleWipStatusCheckbox.checked
                && !this.automaticallyUpdatePipelineStatusIconsCheckbox.checked;
        }

        /**
         * Returns the browser name the extension is currently running on.
         */
        getCurrentBrowserName() {
            let ua = navigator.userAgent;

            if (ua.includes('Firefox') && !ua.includes('Seamonkey')) {
                return 'firefox';
            } else if (ua.includes('Chrome') && !ua.includes('Chromium')) {
                return 'chrome';
            }

            return null;
        }

        /**
         * Adds a CSS class name to the <body> tag identifying the browser the extension is currently running on.
         */
        addBrowserDiscriminatingClassToBody() {
            let currentBrowserName = this.getCurrentBrowserName();

            if (!currentBrowserName) {
                return;
            }

            let body = document.querySelector('body');

            if (!body) {
                return;
            }

            body.classList.add('is-' + currentBrowserName);
        }

        /**
         * Sets the submit button to a "saving" state when preferences are being saved: disable the button, update
         * its label.
         */
        initializeVisualFeedbackOnSubmitButton() {
            if (this.submitButtonInOptionsForm.disabled) {
                return false;
            }

            this.submitButtonInOptionsForm.disabled = true;

            if (!('originalTextContent' in this.submitButtonInOptionsForm.dataset)) {
                this.submitButtonInOptionsForm.dataset.originalTextContent = this.submitButtonInOptionsForm.textContent;
            }

            this.submitButtonInOptionsForm.textContent = 'Saving...';

            if ('timeOutId' in this.submitButtonInOptionsForm.dataset) {
                clearTimeout(this.submitButtonInOptionsForm.dataset.timeOutId);

                delete this.submitButtonInOptionsForm.dataset.timeOutId;
            }

            return true;
        }

        /**
         * Sets the submit button to a "successfull" state when preferences are successfully saved: enable the button,
         * update its label, and set a timeout when the label will be reverted back to the original one.
         */
        setSuccessfulVisualFeedbackOnSubmitButton() {
            let self = this;

            this.submitButtonInOptionsForm.disabled = false;
            this.submitButtonInOptionsForm.textContent = 'Saved!';
            this.submitButtonInOptionsForm.dataset.timeOutId = setTimeout(function() {
                self.submitButtonInOptionsForm.textContent = self.submitButtonInOptionsForm.dataset.originalTextContent;

                delete self.submitButtonInOptionsForm.dataset.timeOutId;
                delete self.submitButtonInOptionsForm.dataset.originalTextContent;
            }, 700);
        }

        /**
         * Reverts the submit button back to its initial state: enabled it and revert its label.
         */
        revertVisualFeedbackOnSubmitButton() {
            this.submitButtonInOptionsForm.disabled = false;
            this.submitButtonInOptionsForm.textContent = this.submitButtonInOptionsForm.dataset.originalTextContent;

            delete this.submitButtonInOptionsForm.dataset.originalTextContent;
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        let op = new OptionsPage();
    });
}(this));