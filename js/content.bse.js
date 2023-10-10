

function waitForElement(selector, callback) {
    const element = document.querySelector(selector);
    if (element) {
        callback(element);
    }
}

$(document).ready(function () {
    initializeStatusDiv();
    // Wait for the select element to be available
    waitForElement('#ContentPlaceHolder1_ddlIssue', populateOptionsFromHtml);
});
