(function(globals) {
    'use strict';

    class BackgroundScript {
        /**
         * The background script of the extension.
         */
        constructor() {
            if ('chrome' in globals && globals.chrome) { // Firefox and Edge uses `browser`, Chrome and Opera uses `chrome`
                globals.browser = globals.chrome;
            }

            if (!('browser' in globals) || !globals.browser) {
                console.error('Unsupported browser');
            }

            this.listenToExtensionUpdates();
        }

        /**
         * Attach a callback to the `onInstalled` runtime event, which handles stuff related to extension updates.
         */
        listenToExtensionUpdates() {
            let self = this;

            globals.browser.runtime.onInstalled.addListener(function(details) {
                if (!('reason' in details) || details.reason != 'update') {
                    return;
                }

                // TODO enable_button_to_toggle_wip_status => enable_button_to_toggle_draft_status
            });
        }
    }

    let bs = new BackgroundScript();
}(this));