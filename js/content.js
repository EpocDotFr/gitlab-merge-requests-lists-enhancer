(function(globals) {
    'use strict';

    class GitLabApiClient {
        /**
         * The GitLab API client used by the extension. No tokens or authentication needed as every requests are
         * performed from inside the context of the page (GitLab allows API calls if they comes from the site).
         */
        constructor(baseUrl) {
            this.baseUrl = baseUrl;
        }

        /**
         * Creates an `URL` object representing the full URL to the given GitLab API endpoint.
         */
        createEndpointUrl(endpoint, queryStringParameters = null) {
            let url = new URL(this.baseUrl + endpoint);

            if (queryStringParameters) {
                queryStringParameters.forEach(function(queryStringParameter) {
                    url.searchParams.append(queryStringParameter[0], queryStringParameter[1]);
                });
            }

            return url;
        }

        /**
         * Sends an HTTP request to the GitLab API.
         */
        sendRequest(callback, method, endpoint, queryStringParameters = null) {
            let xhr = new XMLHttpRequest();

            xhr.responseType = 'json';

            xhr.onload = callback;

            xhr.onerror = function() {
                console.error('Error while communicating with GitLab');
            };

            xhr.open(method, this.createEndpointUrl(endpoint, queryStringParameters));
            xhr.send();
        }

        /**
         * Fetch details about the given Merge Requests IDs in the given project ID.
         */
        getProjectMergeRequests(callback, projectId, mergeRequestIds) {
            let queryStringParameters = mergeRequestIds.map(function(mergeRequestId) {
                return ['iids[]', mergeRequestId];
            });

            this.sendRequest(
                callback,
                'GET',
                'projects/' + projectId + '/merge_requests',
                queryStringParameters
            );
        }
    }

    class ContentScript {
        /**
         * Initialize the content script of the extension which is executed in the context of the page.
         */
        constructor() {
            this.currentProjectId = this.getCurrentProjectId();

            if (!this.currentProjectId) {

                console.error('Aborting: current project ID cannot be found');

                return;
            }

            this.baseProjectUrl = this.getBaseProjectUrl();

            if (!this.baseProjectUrl) {

                console.error('Aborting: base project URL cannot be found');

                return;
            }

            this.baseUrl = location.protocol + '//' + location.host;
            this.baseApiUrl = this.baseUrl + '/api/v4/';
            this.apiClient = new GitLabApiClient(this.baseApiUrl);

            console.debug('Current project ID:', this.currentProjectId);
            console.debug('Base project URL:', this.baseProjectUrl);
            console.debug('GitLab base URL:', this.baseUrl);
            console.debug('GitLab API base URL:', this.baseApiUrl);

            this.removeExistingTargetBranchNodes();

            let currentMergeRequestIds = this.getCurrentMergeRequestIdsAndSetUuidDataAttributes();

            console.debug('Current merge requests IDs:', currentMergeRequestIds);

            this.fetchMergeRequestsDetails(currentMergeRequestIds);
        }

        /**
         * Finds and returns the GitLab project ID whe're looking merge requests at.
         */
        getCurrentProjectId() {
            let body = document.querySelector('body');

            if (!body || !('projectId' in body.dataset)) {
                return null;
            }

            return body.dataset.projectId;
        }

        /**
         * Finds and returns the URI to the project whe're looking merge requests at.
         */
        getBaseProjectUrl() {
            let link = document.querySelector('.nav-sidebar .context-header a');

            return link ? link.getAttribute('href') : null;
        }

        /**
         * Gets all Merge Requests IDs that are currently displayed AND sets the `iid` data attribute (public Merge
         * Request identifier) on all DOM nodes representing a Merge Requests (it's used later in the process).
         */
        getCurrentMergeRequestIdsAndSetUuidDataAttributes() {
            return Array.from(
                document.querySelectorAll('.mr-list .merge-request')
            ).map(function(el) {
                let iid = el.querySelector('.issuable-reference').textContent.trim().replace('!', '');

                el.dataset.iid = iid;

                return iid;
            });
        }

        /**
         * Performs an HTTP GET request to the GitLab API to retrieve details about Merge Requests that are
         * currently displayed. If successful, it actually updates the UI by altering the DOM.
         */
        fetchMergeRequestsDetails(mergeRequestIds) {
            let self = this;

            this.apiClient.getProjectMergeRequests(
                function() {
                    if (this.status == 200) {
                        self.updateMergeRequestsNodes(this.response);
                    } else {
                        console.error('Got error from GitLab:', this.status, this.response);
                    }
                },
                this.currentProjectId,
                mergeRequestIds
            );
        }

        /**
         * Removes all branches that may have been already displayed by GitLab.
         */
        removeExistingTargetBranchNodes() {
            document.querySelectorAll('.mr-list .merge-request .project-ref-path').forEach(function(el) {
                el.parentNode.removeChild(el);
            });
        }

        /**
         * Actually updates the UI by altering the DOM by adding our stuff.
         */
        updateMergeRequestsNodes(mergeRequestsDetails) {
            let self = this;

            mergeRequestsDetails.forEach(function(mergeRequest) {
                let branchesInfoNode = document.createElement('div');

                branchesInfoNode.classList.add('issuable-info');
                branchesInfoNode.innerHTML = '<span class="project-ref-path has-tooltip" title="Source branch">' +
                        '<a class="ref-name" href="' + self.baseProjectUrl + '/-/commits/' + mergeRequest.source_branch + '">' + mergeRequest.source_branch + '</a>' +
                    '</span>' +
                    ' <i class="fa fa-long-arrow-right" aria-hidden="true"></i> ' +
                    '<span class="project-ref-path has-tooltip" title="Target branch">' +
                        '<a class="ref-name" href="' + self.baseProjectUrl + '/-/commits/' + mergeRequest.target_branch + '">' + mergeRequest.target_branch + '</a>' +
                    '</span>';

                document
                    .querySelector('.mr-list .merge-request[data-iid="' + mergeRequest.iid + '"] .issuable-main-info')
                    .appendChild(branchesInfoNode);
            });
        }
    }

    let cs = new ContentScript();
}(this));