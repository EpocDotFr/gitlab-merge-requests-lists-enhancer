(function(globals) {
    'use strict';

    class OptionsPage {
        constructor() {
            this.getDomNodes();
            this.initEventListenersOnDomNodes();
        }

        getDomNodes() {
            this.enableButtonToCopyMrInfoCheckbox = document.querySelector('input#option_enable_button_to_copy_mr_info');
            this.copyMrInfoFormatTextarea = document.querySelector('textarea#copy_mr_info_format');
        }

        initEventListenersOnDomNodes() {
            let self = this;

            this.enableButtonToCopyMrInfoCheckbox.addEventListener('change', function() {
                if (this.checked) {
                    self.copyMrInfoFormatTextarea.parentNode.parentNode.classList.remove('is-hidden');
                } else {
                    self.copyMrInfoFormatTextarea.parentNode.parentNode.classList.add('is-hidden');
                }
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        let op = new OptionsPage();
    });
}(this));