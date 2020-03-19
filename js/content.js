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

            this.updateUI();
        },
        getCurrentProjectId() {
            let body = document.querySelector('body');

            if (!body || !('projectId' in body.dataset)) {
                return null;
            }

            return body.dataset.projectId;
        },
        updateUI() {
            let currentMergeRequestsIds = this.getCurrentMergeRequestsIdsAndSetUuidDataAttributes();

            console.debug('Current merge requests IDs:', currentMergeRequestsIds);

            this.fetchMergeRequestsDetails(currentMergeRequestsIds);
        },
        getCurrentMergeRequestsIdsAndSetUuidDataAttributes() {
            return Array.from(
                document.querySelectorAll('.mr-list .merge-request')
            ).map(function(el) {
                let iid = el.querySelector('.issuable-reference').textContent.trim().replace('!', '');

                el.dataset.iid = iid;

                return iid;
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

                    self.removeExistingTargetBranchNodes();
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
                let branchesInfoNode = document.createElement('div');

                branchesInfoNode.classList.add('issuable-info');
                branchesInfoNode.innerHTML = '<span class="project-ref-path has-tooltip" title="Source branch">' +
                        + '<a class="ref-name" href="#TODO">' +
                            + '<svg class="s12 fork-sprite"><use xlink:href="/assets/icons-2206b8b510dd8a2edccabbd872bdecb67fa80554b54d351d80c5b056d048670e.svg#fork"></use></svg> ' + mergeRequest.source_branch
                        + '</a>' +
                    + '</span>' +
                    + '<span class="project-ref-path has-tooltip" title="Target branch">' +
                        + '<a class="ref-name" href="#TODO">' +
                            + '<svg class="s12 fork-sprite"><use xlink:href="/assets/icons-2206b8b510dd8a2edccabbd872bdecb67fa80554b54d351d80c5b056d048670e.svg#fork"></use></svg> ' + mergeRequest.target_branch
                        + '</a>' +
                    + '</span>';

                document
                    .querySelector('.mr-list .merge-request[data-iid="' + mergeRequest.iid + '"] .issuable-main-info')
                    .appendChild(branchesInfoNode);
            });
        },
        removeExistingTargetBranchNodes() {
            document.querySelectorAll('.mr-list .merge-request .project-ref-path').forEach(function(el) {
                el.parentNode.removeChild(el);
            });
        }
    };

    globals.gmrle.init();
}(this));
