(function(globals) {
    'use strict';

    class GitLabApiClient {
        /**
         * The GitLab API client used by the extension. No tokens or authentication needed as every requests are
         * performed from inside the context of the page (GitLab allows API calls if they comes from the site).
         */
        constructor(baseUrl, csrfToken) {
            this.baseUrl = baseUrl;
            this.csrfToken = csrfToken;
        }

        /**
         * Returns the full URL to the given GitLab API endpoint.
         */
        createEndpointUrl(endpoint, queryStringParameters = null) {
            let endpointUrl = new URL(this.baseUrl + endpoint);

            if (queryStringParameters) {
                queryStringParameters.forEach(function(queryStringParameter) {
                    endpointUrl.searchParams.append(queryStringParameter[0], queryStringParameter[1]);
                });
            }

            return endpointUrl.toString();
        }

        /**
         * Sends an HTTP request to the GitLab API.
         */
        sendRequest(method, endpoint, queryStringParameters = null, data = null) {
            let headers = {};
            let body = null;

            if (['post', 'put', 'patch'].includes(method.toLowerCase())) {
                if (!this.csrfToken) {
                    console.error('Cannot issue POST/PUT/PATCH requests without CSRF token');

                    return;
                }

                headers['X-CSRF-Token'] = this.csrfToken;
            }

            if (data) {
                headers['Content-Type'] = 'application/json';

                body = JSON.stringify(data);
            }

            let fetchPromise = fetch(this.createEndpointUrl(endpoint, queryStringParameters), {
                method: method,
                headers: headers,
                body: body,
                credentials: 'same-origin'
            }).then(function(response) {
                if (response.ok) {
                    return response.json();
                } else {
                    return Promise.reject(response);
                }
            });

            fetchPromise.catch(function(err) {
                console.error('Got error from GitLab:', err);

                alert('Got error from GitLab, check console for more information.');
            });

            return fetchPromise;
        }

        /**
         * Fetch details about the given Merge Requests IDs in the given project ID.
         */
        getProjectMergeRequests(projectId, mergeRequestIds) {
            let queryStringParameters = mergeRequestIds.map(function(mergeRequestId) {
                return ['iids[]', mergeRequestId];
            });

            return this.sendRequest(
                'GET',
                'projects/' + projectId + '/merge_requests',
                queryStringParameters
            );
        }

        /**
         * Update the given Merge Request Id in the given project ID.
         */
        updateProjectMergeRequest(projectId, mergeRequestId, data) {
            let dataToSend = {
                id: parseInt(projectId, 10),
                merge_request_iid: parseInt(mergeRequestId, 10)
            };

            Object.assign(dataToSend, data);

            return this.sendRequest(
                'PUT',
                'projects/' + projectId + '/merge_requests/' + mergeRequestId,
                null,
                dataToSend
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
            this.baseIconsUrl = this.getBaseIconsUrl();
            this.userAuthenticated = this.isUserAuthenticated();
            this.pipelineFeatureEnabled = this.isPipelineFeatureEnabled();
            this.apiClient = new GitLabApiClient(this.baseApiUrl, this.getCsrfToken());

            this.currentMergeRequestIds = this.getCurrentMergeRequestIds();

            let preferencesManager = new globals.Gmrle.PreferencesManager();

            let self = this;

            preferencesManager.getAll(function(preferences) {
                self.preferences = preferences;
                self.fetchMergeRequestsDetailsThenUpdateUI(self.currentMergeRequestIds);
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
         * Get the current CSRF token that should be sent in any subsequent POST or PUT requests to the Gitlab API.
         */
        getCsrfToken() {
            let meta = document.querySelector('meta[name="csrf-token"]');

            return meta ? meta.getAttribute('content') : null;
        }

        /**
         * Determines if the current user is logged-in to GitLab.
         */
        isUserAuthenticated() {
            return document.querySelector('.navbar-nav .header-user') ? true : false;
        }

        /**
         * Return the base URL to the SVG icons file.
         */
        getBaseIconsUrl() {
            let svgUse = document.querySelector('svg.s16 > use');

            if (!svgUse) {
                return null;
            }

            let href = new URL(svgUse.href.baseVal);

            return this.baseUrl + '/' + href.pathname;
        }

        /**
         * Determines if the project do uses the Gitlab "pipeline" feature.
         */
        isPipelineFeatureEnabled() {
            return document.querySelector('.nav-sidebar .shortcuts-pipelines') ? true : false;
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
                this.currentProjectId,
                mergeRequestIds
            ).then(function(responseData) {
                if (self.preferences.display_source_and_target_branches) {
                    self.removeExistingTargetBranchNodes();
                }

                self.updateMergeRequestsNodes(responseData);

                if (self.preferences.enable_buttons_to_copy_source_and_target_branches_name) {
                    self.attachClickEventToCopyBranchNameButtons();
                }

                if (self.preferences.enable_button_to_copy_mr_info) {
                    self.attachClickEventToCopyMergeRequestInfoButtons();
                }

                if (self.userAuthenticated && self.preferences.enable_button_to_toggle_wip_status) {
                    self.attachClickEventToToggleWipStatusButtons();
                }
            });
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
         * Inserts the given HTML string before the given child target node.
         */
        parseHtmlAndInsertBefore(targetNode, html) {
            this.parseHtml(html, function(node) {
                targetNode.parentNode.insertBefore(node, targetNode);
            });
        }

        /**
         * Actually updates the UI by altering the DOM by adding our stuff.
         */
        updateMergeRequestsNodes(mergeRequests) {
            mergeRequests.forEach(function(mergeRequest) {
                let mergeRequestNode = document.querySelector('.mr-list .merge-request[data-id="' + mergeRequest.id + '"]');

                this.setDataAttributesToMergeRequestNode(mergeRequestNode, mergeRequest);

                // -----------------------------------------------
                // Toggle WIP status button

                if (this.userAuthenticated && this.preferences.enable_button_to_toggle_wip_status) {
                    let toggleWipStatusButton = '<button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-toggle-wip-status" title="Toggle WIP status" style="padding-left: 0">' +
                        this.buildSpriteIcon('lock') +
                    '</button> ';

                    this.parseHtmlAndPrepend(
                        mergeRequestNode.querySelector('.merge-request-title'),
                        toggleWipStatusButton
                    );
                }

                // -----------------------------------------------
                // Jira ticket link (data attributes are set in setDataAttributesToNode, above)

                if (('jiraTicketId' in mergeRequestNode.dataset) && ('jiraTicketUrl' in mergeRequestNode.dataset)) {
                    let jiraTicketLinkToolip = null;
                    let jiraTicketLinkLabel = null;

                    switch (this.preferences.jira_ticket_link_label_type) {
                        case 'ticket_id':
                            jiraTicketLinkLabel = mergeRequestNode.dataset.jiraTicketId;

                            break;
                        case 'icon':
                            jiraTicketLinkLabel = '<i class="fa fa-ticket" aria-hidden="true"></i>';
                            jiraTicketLinkToolip = 'Jira ticket ' + mergeRequestNode.dataset.jiraTicketId;

                            break;
                        default:
                            console.error('Invalid link label type ' + this.preferences.jira_ticket_link_label_type);
                    }

                    if (jiraTicketLinkLabel) {
                        let jiraTicketLink = '<a href="' + mergeRequestNode.dataset.jiraTicketUrl + '" ' +
                            'class="issuable-milestone ' + (jiraTicketLinkToolip ? 'has-tooltip' : '') + '" ' +
                            (jiraTicketLinkToolip ? 'title="' + jiraTicketLinkToolip + '"' : '') + '>' +
                            jiraTicketLinkLabel +
                        '</a> ';

                        this.parseHtmlAndInsertBefore(
                            mergeRequestNode.querySelector('.merge-request-title-text'),
                            jiraTicketLink
                        );
                    }
                }

                // -----------------------------------------------
                // Copy MR info button

                if (this.preferences.enable_button_to_copy_mr_info) {
                    let copyMrInfoButton = '<button class="btn btn-secondary btn-md btn-default btn-transparent btn-clipboard has-tooltip gmrle-copy-mr-info" title="Copy Merge Request info" style="padding-left: 0">' +
                        '<i class="fa fa-share-square-o" aria-hidden="true"></i>' +
                    '</button> ';

                    this.parseHtmlAndPrepend(
                        mergeRequestNode.querySelector('.issuable-info'),
                        copyMrInfoButton
                    );
                }

                // -----------------------------------------------
                // Source and target branches info

                if (this.preferences.display_source_and_target_branches) {
                    let newInfoLineToInject = '<div class="issuable-info">';

                    // Source branch name
                    newInfoLineToInject += '<span class="project-ref-path has-tooltip" title="Source branch">' +
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
                        mergeRequestNode.querySelector('.issuable-main-info'),
                        newInfoLineToInject
                    );
                }
            }, this);
        }

        /**
         * Sets several data-* attributes on a DOM node representing a Merge Request so these values may be used later.
         */
        setDataAttributesToMergeRequestNode(mergeRequestNode, mergeRequest) {
            mergeRequestNode.dataset.title = mergeRequest.title;
            mergeRequestNode.dataset.iid = mergeRequest.iid;
            mergeRequestNode.dataset.url = mergeRequest.web_url;
            mergeRequestNode.dataset.diffsUrl = mergeRequest.web_url + '/diffs';
            mergeRequestNode.dataset.authorName = mergeRequest.author.name;
            mergeRequestNode.dataset.status = mergeRequest.state;
            mergeRequestNode.dataset.sourceBranchName = mergeRequest.source_branch;
            mergeRequestNode.dataset.targetBranchName = mergeRequest.target_branch;
            mergeRequestNode.dataset.isWip = mergeRequest.work_in_progress;

            if (this.preferences.enable_jira_ticket_link) {
                let jiraTicketId = this.findFirstJiraTicketId(mergeRequest);

                if (jiraTicketId) {
                    mergeRequestNode.dataset.jiraTicketId = jiraTicketId;
                    mergeRequestNode.dataset.jiraTicketUrl = this.createJiraTicketUrl(jiraTicketId);
                }
            }
        }

        /**
         * Finds a Jira ticket ID in the given Merge Request object. It first tris in the source branch name, then
         * fallbacks to the Merge Request title.
         */
        findFirstJiraTicketId(mergeRequest) {
            let jiraTicketIdRegex = new RegExp('[A-Z]{1,10}-\\d+');

            // First try in the source branch name
            let results = jiraTicketIdRegex.exec(mergeRequest.source_branch);

            if (results) {
                return results[0];
            }

            // Fallback to the Merge Request title if none found in the source branch name
            results = jiraTicketIdRegex.exec(mergeRequest.title);

            if (results) {
                return results[0];
            }

            return null;
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
         * Attach a click event to all buttons inserted by the extension allowing to toggle Merge Request WIP status.
         */
        attachClickEventToToggleWipStatusButtons() {
            let self = this;

            document.querySelectorAll('button.gmrle-toggle-wip-status').forEach(function(el) {
                el.addEventListener('click', function(e) {
                    e.preventDefault();

                    self.toggleMergeRequestWipStatus(this.closest('.merge-request'), this);
                });
            });
        }

        /**
         * Actually toggle a given Merge Request WIP status.
         */
        toggleMergeRequestWipStatus(mergeRequestNode, toggleButton) {
            toggleButton.disabled = true;

            let isWip = mergeRequestNode.dataset.isWip == 'true';
            let newTitle = '';

            if (isWip) {
                newTitle = mergeRequestNode.dataset.title.replace(new RegExp('^WIP:'), '').trim();
            } else {
                newTitle = 'WIP: ' + mergeRequestNode.dataset.title.trim();
            }

            this.apiClient.updateProjectMergeRequest(
                this.currentProjectId,
                mergeRequestNode.dataset.iid,
                {
                    title: newTitle
                }
            ).then(function(responseData) {
                mergeRequestNode.dataset.isWip = responseData.work_in_progress;
                mergeRequestNode.dataset.title = responseData.title;

                mergeRequestNode.querySelector('.merge-request-title-text a').textContent = responseData.title;
            }).finally(function() {
                toggleButton.disabled = false;
            });
        }

        /**
         * Creates the Merge Request info text from a Merge Request container DOM node.
         */
        buildMergeRequestInfoText(mergeRequestNode) {
            let placeholders = {
                MR_TITLE: mergeRequestNode.dataset.title,
                MR_ID: mergeRequestNode.dataset.iid,
                MR_URL: mergeRequestNode.dataset.url,
                MR_DIFFS_URL: mergeRequestNode.dataset.diffsUrl,
                MR_AUTHOR_NAME: mergeRequestNode.dataset.authorName,
                MR_STATUS: mergeRequestNode.dataset.status,
                MR_SOURCE_BRANCH_NAME: mergeRequestNode.dataset.sourceBranchName,
                MR_TARGET_BRANCH_NAME: mergeRequestNode.dataset.targetBranchName,
                MR_JIRA_TICKET_ID: ('jiraTicketId' in mergeRequestNode.dataset) ? mergeRequestNode.dataset.jiraTicketId : '',
                MR_JIRA_TICKET_URL: ('jiraTicketUrl' in mergeRequestNode.dataset) ? mergeRequestNode.dataset.jiraTicketUrl : ''
            };

            let placeholdersReplaceRegex = new RegExp('{(' + Object.keys(placeholders).join('|') + ')}', 'g');

            return this.preferences.copy_mr_info_format.replace(placeholdersReplaceRegex, function(_, placeholder) {
              return placeholders[placeholder];
            }).trim();
        }

        /**
         * Generate the HTML code corresponding to an SVG icon.
         */
        buildSpriteIcon(iconName) {
            return '<svg class="s16" data-testid="' + iconName + '-icon">' +
                '<use xlink:href="' + this.baseIconsUrl + '#' + iconName + '"></use>' +
            '</svg>';
        }
    }

    let cs = new ContentScript();
}(this));
