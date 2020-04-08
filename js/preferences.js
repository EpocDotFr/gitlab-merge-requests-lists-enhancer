(function(globals) {
    'use strict';

    globals.GmrlePreferencesManager = class {
        defaults = {
            enable_buttons_to_copy_source_and_target_branches_name: true
        };

        /**
         * This class holds all the logic related to user preferences persistance.
         */
        constructor() {}

        /**
         * Get all preferences.
         */
        getAll(callback) {
            browser.storage.local.get(this.defaults).then(callback, function() {
                alert('Error retrieving add-on preferences.');
            });
        }

        /**
         * Set all preferences.
         */
        setAll(preferences) {
            browser.storage.local.set(preferences).then(function() {
                // Do nothing if save was successful.
            }, function() {
                alert('Error saving add-on preferences.');
            });
        }
    }
}(this));