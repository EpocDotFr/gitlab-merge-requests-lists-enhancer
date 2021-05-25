(function(globals) {
    'use strict';

    globals.Gmrle = globals.Gmrle || {};

    globals.Gmrle.PreferencesManager = class {
        get defaults() {
            return {
                display_source_and_target_branches: true,
                enable_buttons_to_copy_source_and_target_branches_name: true,
                enable_button_to_copy_mr_info: true,
                copy_mr_info_format: 'MR {MR_ID} (from {MR_AUTHOR_NAME}): {MR_TITLE}\n{MR_URL}',
                enable_jira_ticket_link: false,
                base_jira_url: '',
                jira_ticket_link_label_type: 'ticket_id',
                enable_button_to_toggle_draft_status: true,
                enable_unresolved_discussions_indicator: true
            };
        }

        /**
         * This class holds all the logic related to user preferences persistance.
         */
        constructor() {
            if (globals.browser) { // Firefox and Edge uses `browser`, Chrome and Opera uses `chrome`
                this.getAll = this.getAllBrowser;
                this.setAll = this.setAllBrowser;
            } else if (globals.chrome) {
                this.getAll = this.getAllChrome;
                this.setAll = this.setAllChrome;
            } else {
                console.error('Unsupported browser');
            }
        }

        /**
         * Get all the user's preferences.
         *
         * Used as `getAll` if the current browser is Firefox or Edge.
         */
        getAllBrowser(successCallback) {
            browser.storage.local.get(this.defaults).then(successCallback, function() {
                alert('Error retrieving extension preferences.');
            });
        }

        /**
         * Save all the user's preferences.
         *
         * Used as `setAll` if the current browser is Firefox or Edge.
         */
        setAllBrowser(preferences, successCallback, errorCallback) {
            browser.storage.local.set(preferences).then(successCallback, function() {
                errorCallback();

                alert('Error saving extension preferences.');
            });
        }

        /**
         * Get all the user's preferences.
         *
         * Used as `getAll` if the current browser is Chrome or Opera.
         */
        getAllChrome(successCallback) {
            chrome.storage.local.get(this.defaults, function(preferences) {
                if (chrome.runtime.lastError) {
                    alert('Error retrieving extension preferences, check console for more information.');

                    console.error('Error retrieving extension preferences:', chrome.runtime.lastError);
                } else {
                    successCallback(preferences);
                }
            });
        }

        /**
         * Save all the user's preferences.
         *
         * Used as `setAll` if the current browser is Chrome or Opera.
         */
        setAllChrome(preferences, successCallback, errorCallback) {
            chrome.storage.local.set(preferences, function() {
                if (chrome.runtime.lastError) {
                    errorCallback();

                    alert('Error saving extension preferences, check console for more information.');

                    console.error('Error saving extension preferences:', chrome.runtime.lastError);
                } else {
                    successCallback();
                }
            });
        }
    }
}(this));