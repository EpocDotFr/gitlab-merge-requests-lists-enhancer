(function(globals) {
    'use strict';

    globals.gmrle = {
        currentProjectId: null,

        init() {
            this.currentProjectId = this.getCurrentProjectId();

            if (!this.currentProjectId) {

                console.error('Aborting: current project ID cannot be found');

                return;
            }

            this.refreshUI();
        },
        getCurrentProjectId() {
            let body = document.querySelector('body');

            if (!body || !('projectId' in body.dataset)) {
                return null;
            }

            return body.dataset.projectId;
        },
        refreshUI() {
            let currentMergeRequestsIds = this.getCurrentMergeRequestsIds();

            console.log(currentMergeRequestsIds);

            // this.fetchMergeRequestsDetails(currentMergeRequestsIds)
        },
        getCurrentMergeRequestsIds() {
            return Array.prototype.map.call(
                document.querySelectorAll('.mr-list > .merge-request'),
                function (mergeRequest) {
                    return mergeRequest.dataset.id;
                }
            );
        },
        fetchMergeRequestsDetails(mergeRequestIds) {

            // https://stackoverflow.com/questions/37944051/xmlhttprequest-from-firefox-webextension
            // https://developer.mozilla.org/en-US/docs/Web/API/XMLHttpRequest/Using_XMLHttpRequest
        }
    };

    globals.gmrle.init();
}(this));