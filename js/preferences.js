(function(globals) {
    'use strict';

    globals.Gmrle = globals.Gmrle || {};

    globals.Gmrle.PreferencesManager = class {
        get defaults() {
            return {
                enable_buttons_to_copy_source_and_target_branches_name: true,
                enable_button_to_copy_mr_info: true,
                copy_mr_info_format: 'MR {MR_ID} (from {MR_AUTHOR_NAME}): {MR_TITLE}\n{MR_URL}'
            };
        }

        /**
         * This class holds all the logic related to user preferences persistance.
         */
        constructor() {
            if (globals.browser) { // Firefox uses `browser`, Chrome uses `chrome`
                this.getAll = this.getAllFirefox;
                this.setAll = this.setAllFirefox;
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
         * Used as `getAll` if the current browser is Firefox.
         */
        getAllFirefox(callback) {
            browser.storage.local.get(this.defaults).then(callback, function() {
                alert('Error retrieving extension preferences.');
            });
        }

        /**
         * Save all the user's preferences.
         *
         * Used as `setAll` if the current browser is Firefox.
         */
        setAllFirefox(preferences) {
            browser.storage.local.set(preferences).then(function() {
                // Do nothing if save was successful.
            }, function() {
                alert('Error saving extension preferences.');
            });
        }

        /**
         * Get all the user's preferences.
         *
         * Used as `getAll` if the current browser is Chrome.
         */
        getAllChrome(callback) {
            chrome.storage.local.get(this.defaults, function(preferences) {
                if (chrome.runtime.lastError) {
                    alert('Error retrieving extension preferences, check console for more information.');

                    console.error('Error retrieving extension preferences:', chrome.runtime.lastError);
                } else {
                    callback(preferences);
                }
            });
        }

        /**
         * Save all the user's preferences.
         *
         * Used as `setAll` if the current browser is Chrome.
         */
        setAllChrome(preferences) {
            chrome.storage.local.set(preferences, function() {
                if (chrome.runtime.lastError) {
                    alert('Error saving extension preferences, check console for more information.');

                    console.error('Error saving extension preferences:', chrome.runtime.lastError);
                }
            });
        }
    }
}(this));