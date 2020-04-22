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

            this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox = document.querySelector('input#enable_buttons_to_copy_source_and_target_branches_name');

            this.copyMrInfoOptionsDiv = document.querySelector('div#copy-mr-info-options');
            this.enableButtonToCopyMrInfoCheckbox = document.querySelector('input#enable_button_to_copy_mr_info');
            this.copyMrInfoFormatTextarea = document.querySelector('textarea#copy_mr_info_format');

            this.jiraTicketLinkOptionsDiv = document.querySelector('div#jira-ticket-link-options');
            this.enableJiraTicketLinkCheckbox = document.querySelector('input#enable_jira_ticket_link');
            this.baseJiraUrlInput = document.querySelector('input#base_jira_url');
            this.jiraTicketLinkLabelTypeRadioButtons = Array.from(document.querySelectorAll('input[name="jira_ticket_link_label_type"]'));
        }

        /**
         * Retrieve preferences from local storage and update the UI accordingly.
         */
        restoreOptionsFromStorage() {
            let self = this;

            this.preferencesManager.getAll(function(preferences) {
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
            });
        }

        /**
         * Attach some events to DOM nodes that were queried early.
         */
        attachEventListenersToDomNodes() {
            let self = this;

            this.optionsForm.addEventListener('submit', function(e) {
                e.preventDefault();

                self.submitButtonInOptionsForm.disabled = true;

                if (!('originalTextContent' in self.submitButtonInOptionsForm.dataset)) {
                    self.submitButtonInOptionsForm.dataset.originalTextContent = self.submitButtonInOptionsForm.textContent;
                }

                self.submitButtonInOptionsForm.textContent = 'Saving...';

                if ('timeOutId' in self.submitButtonInOptionsForm.dataset) {
                    clearTimeout(self.submitButtonInOptionsForm.dataset.timeOutId);

                    delete self.submitButtonInOptionsForm.dataset.timeOutId;
                }

                self.saveOptionsToStorage();
            });

            this.enableButtonToCopyMrInfoCheckbox.addEventListener('change', function() {
                self.copyMrInfoOptionsDiv.classList.toggle('is-hidden', !this.checked);
                self.copyMrInfoFormatTextarea.toggleAttribute('required', this.checked);
            });

            this.enableJiraTicketLinkCheckbox.addEventListener('change', function() {
                self.jiraTicketLinkOptionsDiv.classList.toggle('is-hidden', !this.checked);
                self.baseJiraUrlInput.toggleAttribute('required', this.checked);

                self.jiraTicketLinkLabelTypeRadioButtons.forEach(function(el) {
                    el.toggleAttribute('required', this.checked);
                }, this);
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
                    enable_buttons_to_copy_source_and_target_branches_name: this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked,
                    enable_button_to_copy_mr_info: this.enableButtonToCopyMrInfoCheckbox.checked,
                    copy_mr_info_format: this.copyMrInfoFormatTextarea.value,
                    enable_jira_ticket_link: this.enableJiraTicketLinkCheckbox.checked,
                    base_jira_url: this.baseJiraUrlInput.value,
                    jira_ticket_link_label_type: jira_ticket_link_label_type
                },
                function() {
                    self.submitButtonInOptionsForm.disabled = false;
                    self.submitButtonInOptionsForm.textContent = 'Saved!';
                    self.submitButtonInOptionsForm.dataset.timeOutId = setTimeout(function() {
                        delete self.submitButtonInOptionsForm.dataset.timeOutId;
                        self.submitButtonInOptionsForm.textContent = self.submitButtonInOptionsForm.dataset.originalTextContent;
                        delete self.submitButtonInOptionsForm.dataset.originalTextContent;
                    }, 700);
                },
                function() {
                    self.submitButtonInOptionsForm.disabled = false;
                    self.submitButtonInOptionsForm.textContent = self.submitButtonInOptionsForm.dataset.originalTextContent;
                    delete self.submitButtonInOptionsForm.dataset.originalTextContent;
                }
            );
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
    }

    document.addEventListener('DOMContentLoaded', function() {
        let op = new OptionsPage();
    });
}(this));