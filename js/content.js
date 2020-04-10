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
                alert('Error while communicating with GitLab.');
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
         * The content script of the extension which is executed in the context of the page.
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

            this.setMergeRequestsDataAttributes();

            let currentMergeRequestIds = this.getCurrentMergeRequestIds();
            let preferencesManager = new globals.Gmrle.PreferencesManager();

            let self = this;

            preferencesManager.getAll(function(preferences) {
                self.preferences = preferences;
                self.fetchMergeRequestsDetailsThenUpdateUI(currentMergeRequestIds);
            });
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
         * Sets several data-* attributes on all DOM nodes representing a Merge Request so these values may be used
         * later and will not need to be computed again.
         */
        setMergeRequestsDataAttributes() {
            document.querySelectorAll('.mr-list .merge-request').forEach(function(el) {
                let iid = el.querySelector('.issuable-reference').textContent.trim().replace('!', '');

                el.dataset.iid = iid;
            });
        }

        /**
         * Gets all Merge Requests IDs that are currently displayed.
         */
        getCurrentMergeRequestIds() {
            return Array.from(
                document.querySelectorAll('.mr-list .merge-request')
            ).map(function(el) {
                return el.dataset.iid;
            });
        }

        /**
         * Performs an HTTP GET request to the GitLab API to retrieve details about Merge Requests that are
         * currently displayed. If successful, it actually updates the UI by altering the DOM.
         */
        fetchMergeRequestsDetailsThenUpdateUI(mergeRequestIds) {
            let self = this;

            this.apiClient.getProjectMergeRequests(
                function() {
                    if (this.status == 200) {
                        self.removeExistingTargetBranchNodes();
                        self.updateMergeRequestsNodes(this.response);

                        if (self.preferences.enable_buttons_to_copy_source_and_target_branches_name) {
                            self.attachClickEventToCopyBranchNameButtons();
                        }
                    } else {
                        alert('Got error from GitLab, check console for more information.');

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
         * Parses HTML code and applies a callback on all of the parsed root DOM nodes.
         */
        parseHtml(html, callback) {
            new DOMParser()
                .parseFromString(html, 'text/html')
                .querySelector('body')
                .childNodes
                .forEach(function(node) {
                    callback(node);
                }
            )
        }

        /**
         * Prepends the given HTML string at the beginning of the given child target node.
         */
        parseHtmlAndPrepend(targetNode, html) {
            this.parseHtml(html, function(node) {
                targetNode.prepend(node);
            });
        }

        /**
         * Appends the given HTML string at the end of the given child target node.
         */
        parseHtmlAndAppend(targetNode, html) {
            this.parseHtml(html, function(node) {
                targetNode.append(node);
            });
        }

        /**
         * Actually updates the UI by altering the DOM by adding our stuff.
         */
        updateMergeRequestsNodes(mergeRequestsDetails) {
            let self = this;

            mergeRequestsDetails.forEach(function(mergeRequest) {
                let mergeRequestContainer = document.querySelector('.mr-list .merge-request[data-iid="' + mergeRequest.iid + '"]');

                // -----------------------------------------------
                // Copy MR info button

                if (self.preferences.enable_button_to_copy_mr_info) {
                    let copyMrInfoButton = '<button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip" title="Copy Merge Request info">' +
                        '<i class="fa fa-share-square-o" aria-hidden="true"></i>' +
                    '</button> ';

                    self.parseHtmlAndPrepend(
                        mergeRequestContainer.querySelector('.issuable-reference').parentNode,
                        copyMrInfoButton
                    );
                }

                // -----------------------------------------------
                // New source and target branch info

                // Source branch name
                let newInfoLineToInject = '<div class="issuable-info">' +
                    '<span class="project-ref-path has-tooltip" title="Source branch">' +
                        '<a class="ref-name" href="' + self.baseProjectUrl + '/-/commits/' + mergeRequest.source_branch + '">' + mergeRequest.source_branch + '</a>' +
                    '</span>';

                // Copy source branch name button
                if (self.preferences.enable_buttons_to_copy_source_and_target_branches_name) {
                    newInfoLineToInject += ' <button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-copy-branch-name" title="Copy branch name" data-branch-name="' + mergeRequest.source_branch + '">' +
                        '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                    '</button>';
                }

                // Target branch name
                newInfoLineToInject += ' <i class="fa fa-long-arrow-right" aria-hidden="true"></i> ' +
                    '<span class="project-ref-path has-tooltip" title="Target branch">' +
                        '<a class="ref-name" href="' + self.baseProjectUrl + '/-/commits/' + mergeRequest.target_branch + '">' + mergeRequest.target_branch + '</a>' +
                    '</span>';

                // Copy target branch name button
                if (self.preferences.enable_buttons_to_copy_source_and_target_branches_name) {
                    newInfoLineToInject += ' <button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-copy-branch-name" title="Copy branch name" data-branch-name="' + mergeRequest.target_branch + '">' +
                        '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                    '</button>';
                }

                newInfoLineToInject += '</div>';

                self.parseHtmlAndAppend(
                    mergeRequestContainer.querySelector('.issuable-main-info'),
                    newInfoLineToInject
                );
            });
        }

        /**
         * Attach a click event to all buttons inserted by the extension allowing to copy the source and target
         * branches name (if feature is enabled by the user).
         */
        attachClickEventToCopyBranchNameButtons() {
            document.querySelectorAll('button.gmrle-copy-branch-name').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    e.preventDefault();

                    navigator.clipboard.writeText(el.dataset.branchName).then(function() {
                        // Do nothing if copy was successful.
                    }, function() {
                        alert('Unable to copy branch name.');
                    });
                });
            });
        }
    }

    let cs = new ContentScript();
}(this));