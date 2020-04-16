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
         * Gets all Merge Requests IDs that are currently displayed.
         */
        getCurrentMergeRequestIds() {
            return Array.from(
                document.querySelectorAll('.mr-list .merge-request .issuable-reference')
            ).map(function(el) {
                return el.textContent.trim().replace('!', '');
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

                        if (self.preferences.enable_button_to_copy_mr_info) {
                            self.attachClickEventToCopyMergeRequestInfoButtons();
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
            );
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
            mergeRequestsDetails.forEach(function(mergeRequest) {
                let mergeRequestContainer = document.querySelector('.mr-list .merge-request[data-id="' + mergeRequest.id + '"]');

                this.setDataAttributesToMergeRequestContainer(mergeRequestContainer, mergeRequest);

                // -----------------------------------------------
                // Jira ticket link (data attributes are set in setDataAttributesToMergeRequestContainer, above)

                if (('jiraTicketId' in mergeRequestContainer.dataset) && ('jiraTicketUrl' in mergeRequestContainer.dataset)) {
                    let jiraTicketLinkLabel = '';

                    switch (this.preferences.jira_ticket_link_label_type) {
                        case 'ticket_id':
                            jiraTicketLinkLabel = mergeRequestContainer.dataset.jiraTicketId;

                            break;
                        case 'icon':
                            jiraTicketLinkLabel = '<button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip" title="Jira ticket ' + mergeRequestContainer.dataset.jiraTicketId + '">' +
                                '<i class="fa fa-ticket" aria-hidden="true"></i>' +
                            '</button>';

                            break;
                        default:
                            console.error('Invalid link label type');

                            return null;
                    }

                    let jiraTicketLink = '<a href="' + mergeRequestContainer.dataset.jiraTicketUrl + '" class="issuable-milestone">' +
                        jiraTicketLinkLabel +
                    '</a> ';

                    this.parseHtmlAndPrepend(
                        mergeRequestContainer.querySelector('.merge-request-title'),
                        jiraTicketLink
                    );
                }

                // -----------------------------------------------
                // Copy MR info button

                if (this.preferences.enable_button_to_copy_mr_info) {
                    let copyMrInfoButton = '<button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-copy-mr-info" title="Copy Merge Request info">' +
                        '<i class="fa fa-share-square-o" aria-hidden="true"></i>' +
                    '</button> ';

                    this.parseHtmlAndPrepend(
                        mergeRequestContainer.querySelector('.issuable-info'),
                        copyMrInfoButton
                    );
                }

                // -----------------------------------------------
                // Source and target branches info

                // Source branch name
                let newInfoLineToInject = '<div class="issuable-info">' +
                    '<span class="project-ref-path has-tooltip" title="Source branch">' +
                        '<a class="ref-name" href="' + this.baseProjectUrl + '/-/commits/' + mergeRequest.source_branch + '">' + mergeRequest.source_branch + '</a>' +
                    '</span>';

                // Copy source branch name button
                if (this.preferences.enable_buttons_to_copy_source_and_target_branches_name) {
                    newInfoLineToInject += ' <button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-copy-branch-name" title="Copy branch name" data-branch-name-to-copy="source">' +
                        '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                    '</button>';
                }

                // Target branch name
                newInfoLineToInject += ' <i class="fa fa-long-arrow-right" aria-hidden="true"></i> ' +
                    '<span class="project-ref-path has-tooltip" title="Target branch">' +
                        '<a class="ref-name" href="' + this.baseProjectUrl + '/-/commits/' + mergeRequest.target_branch + '">' + mergeRequest.target_branch + '</a>' +
                    '</span>';

                // Copy target branch name button
                if (this.preferences.enable_buttons_to_copy_source_and_target_branches_name) {
                    newInfoLineToInject += ' <button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-copy-branch-name" title="Copy branch name" data-branch-name-to-copy="target">' +
                        '<i class="fa fa-clipboard" aria-hidden="true"></i>' +
                    '</button>';
                }

                newInfoLineToInject += '</div>';

                this.parseHtmlAndAppend(
                    mergeRequestContainer.querySelector('.issuable-main-info'),
                    newInfoLineToInject
                );
            }, this);
        }

        /**
         * Sets several data-* attributes on a DOM node representing a Merge Request so these values may be used later.
         */
        setDataAttributesToMergeRequestContainer(mergeRequestContainer, mergeRequest) {
            mergeRequestContainer.dataset.title = mergeRequest.title;
            mergeRequestContainer.dataset.iid = mergeRequest.iid;
            mergeRequestContainer.dataset.url = mergeRequest.web_url;
            mergeRequestContainer.dataset.diffsUrl = mergeRequest.web_url + '/diffs';
            mergeRequestContainer.dataset.authorName = mergeRequest.author.name;
            mergeRequestContainer.dataset.status = mergeRequest.state;
            mergeRequestContainer.dataset.sourceBranchName = mergeRequest.source_branch;
            mergeRequestContainer.dataset.targetBranchName = mergeRequest.target_branch;

            if (this.preferences.enable_jira_ticket_link) {
                let jiraTicketId = this.findFirstJiraTicketId(mergeRequest);

                if (jiraTicketId) {
                    mergeRequestContainer.dataset.jiraTicketId = jiraTicketId;
                    mergeRequestContainer.dataset.jiraTicketUrl = this.createJiraTicketUrl(jiraTicketId);
                }
            }
        }

        /**
         * Finds a Jira ticket ID in the given Merge Request object. Finding location may be different regarding
         * user's preferences.
         */
        findFirstJiraTicketId(mergeRequest) {
            let textToSearchJiraTicketIdIn = null;

            switch (this.preferences.jira_ticket_id_detection_location) {
                case 'source_branch_name':
                    textToSearchJiraTicketIdIn = mergeRequest.source_branch;

                    break;
                case 'merge_request_title':
                    textToSearchJiraTicketIdIn = mergeRequest.title;

                    break;
                default:
                    console.error('Invalid detection location');

                    return null;
            }

            let jiraTicketIdRegex = new RegExp('[A-Z]{1,10}-\\d+');
            let results = jiraTicketIdRegex.exec(textToSearchJiraTicketIdIn);

            if (!results) {
                return null;
            }

            return results[0];
        }

        /**
         * Creates an URL to a given Jira ticket ID, pointing to the Jira base URL the user has defined in its
         * preferences.
         */
        createJiraTicketUrl(jiraTicketId) {
            let baseJiraUrl = new URL(this.preferences.base_jira_url);

            if (!baseJiraUrl.pathname.endsWith('/')) {
                baseJiraUrl.pathname += '/';
            }

            baseJiraUrl.pathname += 'browse/' + jiraTicketId;

            return baseJiraUrl.toString();
        }

        /**
         * Attach a click event to all buttons inserted by the extension allowing to copy the source and target
         * branches name.
         */
        attachClickEventToCopyBranchNameButtons() {
            document.querySelectorAll('button.gmrle-copy-branch-name').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    e.preventDefault();

                    let branchName = this.closest('.merge-request').dataset[this.dataset.branchNameToCopy + 'BranchName'];

                    navigator.clipboard.writeText(branchName).then(function() {
                        // Do nothing if copy was successful.
                    }, function() {
                        alert('Unable to copy branch name.');
                    });
                });
            });
        }

        /**
         * Attach a click event to all buttons inserted by the extension allowing to copy Merge Request info.
         */
        attachClickEventToCopyMergeRequestInfoButtons() {
            let self = this;

            document.querySelectorAll('button.gmrle-copy-mr-info').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    e.preventDefault();

                    let text = self.buildMergeRequestInfoText(this.closest('.merge-request'));

                    navigator.clipboard.writeText(text).then(function() {
                        // Do nothing if copy was successful.
                    }, function() {
                        alert('Unable to copy Merge Request info.');
                    });
                });
            });
        }

        /**
         * Creates the Merge Request info text from a Merge Request container DOM node.
         */
        buildMergeRequestInfoText(mergeRequestContainer) {
            let placeholders = {
                'MR_TITLE': mergeRequestContainer.dataset.title,
                'MR_ID': mergeRequestContainer.dataset.iid,
                'MR_URL': mergeRequestContainer.dataset.url,
                'MR_DIFFS_URL': mergeRequestContainer.dataset.diffsUrl,
                'MR_AUTHOR_NAME': mergeRequestContainer.dataset.authorName,
                'MR_STATUS': mergeRequestContainer.dataset.status,
                'MR_SOURCE_BRANCH_NAME': mergeRequestContainer.dataset.sourceBranchName,
                'MR_TARGET_BRANCH_NAME': mergeRequestContainer.dataset.targetBranchName,
                'MR_JIRA_TICKET_ID': ('jiraTicketId' in mergeRequestContainer.dataset) ? mergeRequestContainer.dataset.jiraTicketId : '',
                'MR_JIRA_TICKET_URL': ('jiraTicketUrl' in mergeRequestContainer.dataset) ? mergeRequestContainer.dataset.jiraTicketUrl : ''
            };

            let placeholdersReplaceRegex = new RegExp('{(' + Object.keys(placeholders).join('|') + ')}', 'g');

            return this.preferences.copy_mr_info_format.replace(placeholdersReplaceRegex, function(_, placeholder) {
              return placeholders[placeholder];
            }).trim();
        }
    }

    let cs = new ContentScript();
}(this));