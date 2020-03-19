(function(globals) {
    'use strict';

    globals.gmrle = {
        baseGitLabUrl: null,
        currentProjectId: null,

        init() {
            this.baseGitLabUrl = location.protocol + '//' + location.host;
            this.currentProjectId = this.getCurrentProjectId();

            if (!this.currentProjectId) {

                console.error('Aborting: current project ID cannot be found');

                return;
            }

            console.debug('GitLab base URL:', this.baseGitLabUrl);
            console.debug('Current project ID:', this.currentProjectId);

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

            console.debug('Current merge requests IDS:', currentMergeRequestsIds);

            this.fetchMergeRequestsDetails(currentMergeRequestsIds);
        },
        getCurrentMergeRequestsIds() {
            return Array.from(document.querySelectorAll('.mr-list > .merge-request .issuable-reference'))
                .map(function(mergeRequest) {
                    return mergeRequest.textContent.trim().replace('!', '');
                });
        },
        fetchMergeRequestsDetails(mergeRequestIds) {
            let self = this;
            let xhr = new XMLHttpRequest();

            xhr.responseType = 'json';

            xhr.onload = function() {
                if (this.status == 200) {
                    if (!this.response) {
                        console.error('Got empty response from GitLab');

                        return;
                    }

                    self.handleMergeRequestsDetails(this.response);
                } else {
                    console.error('Got error from GitLab:', this.status);
                }
            };

            xhr.onerror = function() {
                console.error('Error contacting GitLab');
            };

            xhr.open('GET', this.createMergeRequestsDetailsGitLabApiUrl(mergeRequestIds));
            xhr.send();
        },
        createMergeRequestsDetailsGitLabApiUrl(mergeRequestIds) {
            let url = new URL(
                '/api/v4/projects/' + this.currentProjectId + '/merge_requests',
                this.baseGitLabUrl
            );

            mergeRequestIds.forEach(function(mergeRequestId) {
                url.searchParams.append('iids[]', mergeRequestId);
            });

            return url;
        },
        handleMergeRequestsDetails(mergeRequestsDetails) {
            mergeRequestsDetails.forEach(function(mergeRequest) {
                console.log(
                    mergeRequest.title,
                    mergeRequest.source_branch,
                    mergeRequest.target_branch
                );
            });
        }
    };

    globals.gmrle.init();
}(this));
