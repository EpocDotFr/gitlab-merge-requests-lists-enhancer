(function(globals) {
    'use strict';

    class BackgroundScript {
        /**
         * The background script of the extension.
         */
        constructor() {
            this.listenToExtensionUpdates();
        }

        /**
         * Attach a callback to the `onInstalled` runtime event, which handles stuff related to extension updates.
         */
        listenToExtensionUpdates() {
            let self = this;

            browser.runtime.onInstalled.addListener(function(details) {
                if (!('reason' in details) || details.reason != 'update' || !('previousVersion' in details) || !details.previousVersion) {
                    return;
                }

                // TODO
            });
        }
    }

    let bs = new BackgroundScript();
}(this));