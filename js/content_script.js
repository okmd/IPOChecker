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
function initializeStatusDiv() {
    const statusContainer = document.createElement("div");
    const statusHeading = document.createElement("h4");
    const statusBody = document.createElement("p");
    statusContainer.setAttribute("id", "extensionStatusDiv");
    statusHeading.setAttribute("id", "extensionStatusHead");
    statusBody.setAttribute("id", "extensionStatusp");
    Object.assign(statusContainer.style, {
        position: "fixed",
        bottom: "10px",
        right: "10px",
        zIndex: "1000",
        backgroundColor: "green",
        color: "#FFFFFF",
        padding: "10px",
        borderRadius: "5px",
        minHeight: "50px"
    });
    Object.assign(statusBody.style, {
        paddingTop: "10px"
    });
    statusHeading.innerText = "Extension Initialization...";
    statusContainer.appendChild(statusHeading);
    statusContainer.appendChild(statusBody);
    document.body.appendChild(statusContainer);
}
function updateStatus(message, id) {
    const statusDiv = document.getElementById(id);
    if (statusDiv) {
        statusDiv.innerText = message;
    }
}

function populateOptionsFromHtml(select) {
    const options = Array.from(select.options).map(option => ({
        value: option.value,
        label: option.text
    }));

    // Send options to popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'getOptions') {
            sendResponse(options);
        }
        if (request.action === 'error') {
            updateStatus(request.message, "extensionStatusp");
        }
    });

    updateStatus(options.length + " IPOs Present.", "extensionStatusHead");
}

$(document).ready(function () {
    initializeStatusDiv();
    // Wait for the select element to be available
    waitForElement('#ddlClient', populateOptionsFromHtml);
});
