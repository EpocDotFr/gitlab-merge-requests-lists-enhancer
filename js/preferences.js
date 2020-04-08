(function(globals) {
    'use strict';

    globals.browser = globals.browser || globals.chrome; // Firefox uses `browser`, Chrome uses `chrome`

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
            globals.browser.storage.local.get(this.defaults).then(callback, function() { // FIXME Chrome don't use promises
                alert('Error retrieving add-on preferences.');
            });
        }

        /**
         * Set all preferences.
         */
        setAll(preferences) {
            globals.browser.storage.local.set(preferences).then(function() { // FIXME Chrome don't use promises
                // Do nothing if save was successful.
            }, function() {
                alert('Error saving add-on preferences.');
            });
        }
    }
}(this));