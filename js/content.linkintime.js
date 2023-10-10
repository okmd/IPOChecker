function waitForElement(selector, callback) {
    const observer = new MutationObserver((mutationsList, observer) => {
        const element = document.querySelector(selector);
        if (element) {
            callback(element);
            observer.disconnect();
        }
    });
    observer.observe(document.body, { childList: true, subtree: true });
}


$(document).ready(function () {
    initializeStatusDiv();
    // Wait for the select element to be available
    waitForElement('#ddlClient', populateOptionsFromHtml);
});
