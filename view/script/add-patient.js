'use strict';
(function addPatient() {
    document.getElementById('patient-end').addEventListener('change', function showWarnings(event) {
        var isRecommended = event.target.dataset.recommendedEnd === event.target.value;
        var isWithinIrb = moment(event.target.value, 'MM-DD-YYYY')
            .isSameOrBefore(event.target.dataset.irbEnd, 'MM-DD-YYYY');

        document
            .getElementById('patient-end-group')
            .classList
            .toggle('has-warning', !isRecommended || !isWithinIrb);

        document
            .getElementById('patient-end-default-warning')
            .classList
            .toggle('hidden-xl-down', isRecommended);

        document
            .getElementById('patient-end-irb-warning')
            .classList
            .toggle('hidden-xl-down', isWithinIrb);
    });
}());
