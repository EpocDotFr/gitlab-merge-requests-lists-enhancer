(function(globals) {
    'use strict';

    class OptionsPage {
        /**
         * Returns the list of browsers versions for which to compare the current browser version from. This allows to
         * set CSS classes which can be used to target version-specific styles.
         */
        get browser_versions_to_compare() {
            return {
                'firefox': ['89']
            };
        }

        /**
         * Class which handles everything related to the options page of the extension. Preferences are persisted in
         * the browser's local storage.
         */
        constructor() {
            this.addBrowserDiscriminatingClassesToBody();

            this.preferencesManager = new globals.Gmrle.PreferencesManager();

            this.getDomNodes();
            this.restoreOptionsFromStorage();
            this.attachEventListenersToDomNodes();
        }

        /**
         * Queries and caches every relevant DOM nodes for further manipulations.
         */
        getDomNodes() {
            this.optionsForm = document.querySelector('form');
            this.submitButtonInOptionsForm = this.optionsForm.querySelector('button[type="submit"]');

            this.displaySourceTargetBranchesOptionsDiv = document.querySelector('div#display-source-target-branches-options');
            this.displaySourceAndTargetBranchesCheckbox = document.querySelector('input#display_source_and_target_branches');
            this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox = document.querySelector('input#enable_buttons_to_copy_source_and_target_branches_name');

            this.copyMrInfoOptionsDiv = document.querySelector('div#copy-mr-info-options');
            this.enableButtonToCopyMrInfoCheckbox = document.querySelector('input#enable_button_to_copy_mr_info');
            this.copyMrInfoFormatTextarea = document.querySelector('textarea#copy_mr_info_format');

            this.TaigaTicketLinkOptionsDiv = document.querySelector('div#Taiga-ticket-link-options');
            this.enableTaigaTicketLinkCheckbox = document.querySelector('input#enable_Taiga_ticket_link');
            this.baseTaigaUrlInput = document.querySelector('input#base_Taiga_url');
            this.TaigaTicketLinkLabelTypeRadioButtons = Array.from(document.querySelectorAll('input[name="Taiga_ticket_link_label_type"]'));

            this.enableButtonToToggleWipStatusCheckbox = document.querySelector('input#enable_button_to_toggle_wip_status');

            this.enableUnresolvedDiscussionsIndicatorCheckbox = document.querySelector('input#enable_unresolved_discussions_indicator');
        }

        /**
         * Retrieve preferences from local storage and update the UI accordingly.
         */
        restoreOptionsFromStorage() {
            let self = this;

            this.preferencesManager.getAll(function(preferences) {
                self.displaySourceAndTargetBranchesCheckbox.checked = preferences.display_source_and_target_branches;
                self.displaySourceAndTargetBranchesCheckbox.dispatchEvent(new CustomEvent('change'));

                self.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked = preferences.enable_buttons_to_copy_source_and_target_branches_name;

                self.enableButtonToCopyMrInfoCheckbox.checked = preferences.enable_button_to_copy_mr_info;
                self.enableButtonToCopyMrInfoCheckbox.dispatchEvent(new CustomEvent('change'));

                self.copyMrInfoFormatTextarea.value = preferences.copy_mr_info_format;

                self.enableTaigaTicketLinkCheckbox.checked = preferences.enable_Taiga_ticket_link;
                self.enableTaigaTicketLinkCheckbox.dispatchEvent(new CustomEvent('change'));

                self.baseTaigaUrlInput.value = preferences.base_Taiga_url;

                self.TaigaTicketLinkLabelTypeRadioButtons.find(function(el) {
                    return el.value == preferences.Taiga_ticket_link_label_type;
                }).checked = true;

                self.enableButtonToToggleWipStatusCheckbox.checked = preferences.enable_button_to_toggle_wip_status;
                self.enableButtonToToggleWipStatusCheckbox.dispatchEvent(new CustomEvent('change'));

                self.enableUnresolvedDiscussionsIndicatorCheckbox.checked = preferences.enable_unresolved_discussions_indicator;
                self.enableUnresolvedDiscussionsIndicatorCheckbox.dispatchEvent(new CustomEvent('change'));
            });
        }

        /**
         * Attach some events to DOM nodes that were queried early.
         */
        attachEventListenersToDomNodes() {
            let self = this;

            this.optionsForm.addEventListener('submit', function(e) {
                e.preventDefault();

                if (self.hasUserDisabledAllFeatures()) {
                    return false;
                }

                if (!self.initializeVisualFeedbackOnSubmitButton()) {
                    return false;
                }

                self.saveOptionsToStorage();
            });

            this.displaySourceAndTargetBranchesCheckbox.addEventListener('change', function() {
                self.displaySourceTargetBranchesOptionsDiv.classList.toggle('is-hidden', !this.checked);

                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableButtonToCopyMrInfoCheckbox.addEventListener('change', function() {
                self.copyMrInfoOptionsDiv.classList.toggle('is-hidden', !this.checked);
                self.copyMrInfoFormatTextarea.toggleAttribute('required', this.checked);

                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableTaigaTicketLinkCheckbox.addEventListener('change', function() {
                self.TaigaTicketLinkOptionsDiv.classList.toggle('is-hidden', !this.checked);
                self.baseTaigaUrlInput.toggleAttribute('required', this.checked);

                self.TaigaTicketLinkLabelTypeRadioButtons.forEach(function(el) {
                    el.toggleAttribute('required', this.checked);
                }, this);

                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableButtonToToggleWipStatusCheckbox.addEventListener('change', function() {
                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });

            this.enableUnresolvedDiscussionsIndicatorCheckbox.addEventListener('change', function() {
                self.forceUserToEnableAtLeastOneFeatureIfNecessarily();
            });
        }

        /**
         * Take all DOM nodes values and persist them in the local storage.
         */
        saveOptionsToStorage() {
            let self = this;

            let Taiga_ticket_link_label_type = this.TaigaTicketLinkLabelTypeRadioButtons.find(function(el) {
                return el.checked;
            }).value;

            this.preferencesManager.setAll(
                {
                    display_source_and_target_branches: this.displaySourceAndTargetBranchesCheckbox.checked,
                    enable_buttons_to_copy_source_and_target_branches_name: this.enableButtonsToCopySourceAndTargetBranchesNameCheckbox.checked,
                    enable_button_to_copy_mr_info: this.enableButtonToCopyMrInfoCheckbox.checked,
                    copy_mr_info_format: this.copyMrInfoFormatTextarea.value,
                    enable_Taiga_ticket_link: this.enableTaigaTicketLinkCheckbox.checked,
                    base_Taiga_url: this.baseTaigaUrlInput.value,
                    Taiga_ticket_link_label_type: Taiga_ticket_link_label_type,
                    enable_button_to_toggle_wip_status: this.enableButtonToToggleWipStatusCheckbox.checked,
                    enable_unresolved_discussions_indicator: this.enableUnresolvedDiscussionsIndicatorCheckbox.checked
                },
                function() {
                    self.setSuccessfulVisualFeedbackOnSubmitButton();
                },
                function() {
                    self.revertVisualFeedbackOnSubmitButton();
                }
            );
        }

        /**
         * Force the user to enable at least one feature if he disabled all the features of
         * the extension (which is useless).
         */
        forceUserToEnableAtLeastOneFeatureIfNecessarily() {
            if (this.hasUserDisabledAllFeatures() && !this.submitButtonInOptionsForm.disabled) {
                this.submitButtonInOptionsForm.disabled = true;
                this.submitButtonInOptionsForm.dataset.originalTextContent = this.submitButtonInOptionsForm.textContent;
                this.submitButtonInOptionsForm.textContent = '⚠️ Please enable at least one feature';
            } else if (this.submitButtonInOptionsForm.disabled) {
                this.submitButtonInOptionsForm.disabled = false;
                this.submitButtonInOptionsForm.textContent = this.submitButtonInOptionsForm.dataset.originalTextContent;

                delete this.submitButtonInOptionsForm.dataset.originalTextContent;
            }
        }

        /**
         * Determine if the user has disabled all the features of the extension (which is useless).
         */
        hasUserDisabledAllFeatures() {
            return !this.displaySourceAndTargetBranchesCheckbox.checked
                && !this.enableButtonToCopyMrInfoCheckbox.checked
                && !this.enableTaigaTicketLinkCheckbox.checked
                && !this.enableButtonToToggleWipStatusCheckbox.checked
                && !this.enableUnresolvedDiscussionsIndicatorCheckbox.checked;
        }

        /**
         * Returns the browser name the extension is currently running on, as well as its version.
         *
         * https://developer.mozilla.org/en-US/docs/Web/HTTP/Browser_detection_using_the_user_agent
         */
        getCurrentBrowserNameAndVersion() {
            let browserName = null;
            let browserVersion = null;

            let ua = navigator.userAgent;

            if (ua.includes('Firefox/') && !ua.includes('Seamonkey/')) {
                browserName = 'firefox';

                let firefoxVersionRegex = new RegExp('Firefox\/([0-9.]+)');
                let results = firefoxVersionRegex.exec(ua);

                if (results) {
                    browserVersion = results[1];
                }
            } else if (ua.includes('Chrome/') && !ua.includes('Chromium/')) {
                browserName = 'chrome';
            } else if (ua.includes('Edg/')) {
                browserName = 'edge';
            } else if (ua.includes('OPR/')) {
                browserName = 'opera';
            }

            return [browserName, browserVersion];
        }

        /**
         * Adds CSS classes names to the <body> tag identifying the browser the extension is currently running on, as well as its version.
         */
        addBrowserDiscriminatingClassesToBody() {
            let [currentBrowserName, currentBrowserVersion] = this.getCurrentBrowserNameAndVersion();

            if (!currentBrowserName) {
                return;
            }

            let body = document.querySelector('body');

            if (!body) {
                return;
            }

            body.classList.add('is-' + currentBrowserName);

            this.addBrowserVersionsComparisonsClasses(currentBrowserName, currentBrowserVersion, body);
        }

        addBrowserVersionsComparisonsClasses(currentBrowserName, currentBrowserVersion, el) {
            if (!currentBrowserName || !currentBrowserVersion || !(currentBrowserName in this.browser_versions_to_compare)) {
                return;
            }

            this.browser_versions_to_compare[currentBrowserName].forEach(function(targetBrowserVersion) {
                ['gt', 'ge', 'lt', 'le', 'eq', 'ne'].forEach(function(operator) {
                    if (this.versionCompare(currentBrowserVersion, targetBrowserVersion, operator)) {
                        el.classList.add(operator + '-' + targetBrowserVersion.replace(new RegExp('\\.'), '-'));
                    }
                }, this);
            }, this);
        }

        /**
         * Sets the submit button to a "saving" state when preferences are being saved: disable the button, update
         * its label.
         */
        initializeVisualFeedbackOnSubmitButton() {
            if (this.submitButtonInOptionsForm.disabled) {
                return false;
            }

            this.submitButtonInOptionsForm.disabled = true;

            if (!('originalTextContent' in this.submitButtonInOptionsForm.dataset)) {
                this.submitButtonInOptionsForm.dataset.originalTextContent = this.submitButtonInOptionsForm.textContent;
            }

            this.submitButtonInOptionsForm.textContent = 'Saving...';

            if ('timeOutId' in this.submitButtonInOptionsForm.dataset) {
                clearTimeout(this.submitButtonInOptionsForm.dataset.timeOutId);

                delete this.submitButtonInOptionsForm.dataset.timeOutId;
            }

            return true;
        }

        /**
         * Sets the submit button to a "successfull" state when preferences are successfully saved: enable the button,
         * update its label, and set a timeout when the label will be reverted back to the original one.
         */
        setSuccessfulVisualFeedbackOnSubmitButton() {
            let self = this;

            this.submitButtonInOptionsForm.disabled = false;
            this.submitButtonInOptionsForm.textContent = 'Saved!';
            this.submitButtonInOptionsForm.dataset.timeOutId = setTimeout(function() {
                self.submitButtonInOptionsForm.textContent = self.submitButtonInOptionsForm.dataset.originalTextContent;

                delete self.submitButtonInOptionsForm.dataset.timeOutId;
                delete self.submitButtonInOptionsForm.dataset.originalTextContent;
            }, 700);
        }

        /**
         * Reverts the submit button back to its initial state: enabled it and revert its label.
         */
        revertVisualFeedbackOnSubmitButton() {
            this.submitButtonInOptionsForm.disabled = false;
            this.submitButtonInOptionsForm.textContent = this.submitButtonInOptionsForm.dataset.originalTextContent;

            delete this.submitButtonInOptionsForm.dataset.originalTextContent;
        }

        /**
         * This function has been stolen from https://github.com/locutusjs/locutus/blob/master/src/php/info/version_compare.js
         */
        versionCompare(v1, v2, operator) { // eslint-disable-line camelcase
            //       discuss at: https://locutus.io/php/version_compare/
            //      original by: Philippe Jausions (https://pear.php.net/user/jausions)
            //      original by: Aidan Lister (https://aidanlister.com/)
            // reimplemented by: Kankrelune (https://www.webfaktory.info/)
            //      improved by: Brett Zamir (https://brett-zamir.me)
            //      improved by: Scott Baker
            //      improved by: Theriault (https://github.com/Theriault)
            //        example 1: version_compare('8.2.5rc', '8.2.5a')
            //        returns 1: 1
            //        example 2: version_compare('8.2.50', '8.2.52', '<')
            //        returns 2: true
            //        example 3: version_compare('5.3.0-dev', '5.3.0')
            //        returns 3: -1
            //        example 4: version_compare('4.1.0.52','4.01.0.51')
            //        returns 4: 1

            // Important: compare must be initialized at 0.
            let i
            let x
            let compare = 0

            // vm maps textual PHP versions to negatives so they're less than 0.
            // PHP currently defines these as CASE-SENSITIVE. It is important to
            // leave these as negatives so that they can come before numerical versions
            // and as if no letters were there to begin with.
            // (1alpha is < 1 and < 1.1 but > 1dev1)
            // If a non-numerical value can't be mapped to this table, it receives
            // -7 as its value.
            const vm = {
                dev: -6,
                alpha: -5,
                a: -5,
                beta: -4,
                b: -4,
                RC: -3,
                rc: -3,
                '#': -2,
                p: 1,
                pl: 1
            }

            // This function will be called to prepare each version argument.
            // It replaces every _, -, and + with a dot.
            // It surrounds any nonsequence of numbers/dots with dots.
            // It replaces sequences of dots with a single dot.
            //    version_compare('4..0', '4.0') === 0
            // Important: A string of 0 length needs to be converted into a value
            // even less than an unexisting value in vm (-7), hence [-8].
            // It's also important to not strip spaces because of this.
            //   version_compare('', ' ') === 1
            const _prepVersion = function (v) {
                v = ('' + v).replace(/[_\-+]/g, '.')
                v = v.replace(/([^.\d]+)/g, '.$1.').replace(/\.{2,}/g, '.')
                return (!v.length ? [-8] : v.split('.'))
            }
            // This converts a version component to a number.
            // Empty component becomes 0.
            // Non-numerical component becomes a negative number.
            // Numerical component becomes itself as an integer.
            const _numVersion = function (v) {
                return !v ? 0 : (isNaN(v) ? vm[v] || -7 : parseInt(v, 10))
            }

            v1 = _prepVersion(v1)
            v2 = _prepVersion(v2)
            x = Math.max(v1.length, v2.length)

            for (i = 0; i < x; i++) {
                if (v1[i] === v2[i]) {
                    continue
                }
                v1[i] = _numVersion(v1[i])
                v2[i] = _numVersion(v2[i])
                if (v1[i] < v2[i]) {
                    compare = -1
                    break
                } else if (v1[i] > v2[i]) {
                    compare = 1
                    break
                }
            }

            if (!operator) {
                return compare
            }

            // Important: operator is CASE-SENSITIVE.
            // "No operator" seems to be treated as "<."
            // Any other values seem to make the function return null.
            switch (operator) {
                case '>':
                case 'gt':
                    return (compare > 0)
                case '>=':
                case 'ge':
                    return (compare >= 0)
                case '<=':
                case 'le':
                    return (compare <= 0)
                case '===':
                case '=':
                case 'eq':
                    return (compare === 0)
                case '<>':
                case '!==':
                case 'ne':
                    return (compare !== 0)
                case '':
                case '<':
                case 'lt':
                    return (compare < 0)
                default:
                    return null
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        let op = new OptionsPage();
    });
}(this));