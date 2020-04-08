(function(globals) {
    'use strict';

    class GmrlePreferences {
        defaults = {
            enable_buttons_to_copy_source_and_target_branches_name: true
        };

        constructor() {

        }

        getAll(callback) {
            browser.storage.local.get(this.defaults).then(callback, function() {
                alert('Error retrieving preferences.');
            });
        }

        setAll(prefs) {
            browser.storage.local.set(prefs).then(function() {
                // Do nothing if save was successful.
            }, function() {
                alert('Error saving preferences.');
            });
        }
    }
}(this));