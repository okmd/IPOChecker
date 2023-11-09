class IPOCheckerBSE {
    constructor() {
        this.baseUrl = "https://www.bseindia.com/1H/appli_check_new.aspx";
    }

    async fetchAllotmentDetails(clientId, panCard) {
        const url = `${this.baseUrl}?panno=${panCard}&issueName=${clientId}&issueType=BB`;
        console.info(url);

        try {

            const response = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                    "Accept": "*/*",
                    "Accept-Encoding": "gzip, deflate, br"
                }
            });
            if (!response.ok) {
                throw new Error(`Request failed with status ${response.status}`);
            }

            const text = await response.text();
            return this.parseAllotmentDetails(text);
        } catch (error) {
            const errorMessage = `Error fetching allotment details for PAN: ${panCard}, Client ID: ${clientId}. ${error.message}`;
            console.error(errorMessage);
            this.sendErrorMessage(errorMessage);
            return null;
        }
    }

    parseAllotmentDetails(htmlText) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, "text/html");

        const allotmentTable = doc.getElementById("ContentPlaceHolder1_grdAllotment");
        const allotmentDetails = [];

        if (allotmentTable) {
            const rows = allotmentTable.querySelectorAll("tr");

            if (rows.length > 0) {
                rows.forEach((row) => {
                    const columns = row.querySelectorAll("td");
                    if (columns.length === 2) {
                        const shares = columns[0].textContent.trim();
                        const price = columns[1].textContent.trim();
                        allotmentDetails.push({ shares, price });
                    }
                });
            }
        }

        return allotmentDetails.length > 0 ? allotmentDetails : null;
    }

    formatOutput(panCard, details, count) {
        console.log(panCard, details, count);
        const panCardFormatted = panCard.padEnd(10, " ");
        const qtyFormatted =
            details != null && details.length
                ? `<div class="name_css col-7">${details[0].shares}</div>
           <div class="qty_css col-1">${details[0].price}</div>`
                : `<div class="na col-8">Not Found</div>`;
        return `<div class="pan_card col-4">${count}:${panCardFormatted}</div>${qtyFormatted}`;
    }

    async checkIPO(clientId, panCard, count) {
        const details = await this.fetchAllotmentDetails(clientId, panCard);
        return this.formatOutput(panCard, details, count);
    }

    sendErrorMessage(message) {
        sendMessageToContent({ action: "error", message: message });
    }
}

class IPOCheckerLinkInTime {
    constructor() {
        this.baseUrl = "https://linkintime.co.in/mipo/IPO.aspx/SearchOnPan";
    }

    async fetchAllotmentDetails(clientId, panCard) {
        try {
            const response = await fetch(this.baseUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ clientid: clientId, PAN: panCard, key_word: "PAN" }),
            });

            if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
            const data = await response.json();
            const qty = /<NAME1>(.*?)<\/NAME1>/g.exec(data.d);
            const alloted = /<ALLOT>(.*?)<\/ALLOT>/g.exec(data.d);
            return [qty, alloted];
        } catch (error) {
            error = `${panCard}\tError: ${error.message}`;
            this.sendErrorMessage(error);
            return error;
        }
    }

    formatOutput(panCard, details, count) {
        console.log(details);
        const panCardFormatted = panCard.padEnd(10, " ");
        const name = details[0];
        const qty =  details[1];
        const ok = name != null && qty != null;
        const alloted = (ok && qty[1]!='0')?"alloted bg-success":"not-alloted";
        const qtyFormatted =
            ok ? `<div class="${alloted} col-7">${name[1]}</div>
                  <div class="${alloted} col-1">${qty[1]}</div>`
                : `<div class="na col-8">Not Found</div>`;
        return `<div class="pan_card col-4">${count}:${panCardFormatted}</div>${qtyFormatted}`;
    }

    async checkIPO(clientId, panCard, count) {
        const details = await this.fetchAllotmentDetails(clientId, panCard);
        return this.formatOutput(panCard, details, count);
    }

    sendErrorMessage(message) {
        sendMessageToContent({ action: "error", message: message });
    }
}

function sendMessageToContent(actions, callback = null) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        chrome.tabs.sendMessage(currentTab.id, actions, callback);
    });
}

function populateOptions() {
    sendMessageToContent({ action: "getOptions" }, (options) => {
        if (options) {
            const targetSelect = document.getElementById("selectIpo");
            options.forEach(({ value, label }) => {
                const opt = new Option(label, value);
                targetSelect.appendChild(opt);
            });
        }
    });
}

// Event listeners and initialization
document.addEventListener("DOMContentLoaded", () => {
    populateOptions();
    document.getElementById("loadingSpinner").style.display = "none";
    const responseContainer = document.getElementById("responseContainer");

    document.getElementById("checkButton").addEventListener("click", async () => {
        responseContainer.innerHTML = "";
        const clientId = document.getElementById("selectIpo").value;
        const panCards = document.getElementById("inputValues").value.split(/\s+/).map((s) => s.trim());
        let count = 1;
        let checker;
        chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
            if (tabs && tabs[0] && tabs[0].url) {
                const currentUrl = tabs[0].url;
                if (currentUrl.includes("bseindia")) {
                    checker = new IPOCheckerBSE();
                } else if (currentUrl.includes("linkintime")) {
                    checker = new IPOCheckerLinkInTime();
                } else {
                    console.error('Error url' + url);
                }
                if (checker) {
                    for (const panCard of panCards) {
                        document.getElementById("loadingSpinner").style.display = "block";
                        const formattedOutput = await checker.checkIPO(clientId, panCard, count++);
                        document.getElementById("loadingSpinner").style.display = "none";
                        const responseElement = document.createElement("div");
                        responseElement.classList.add("row");
                        responseElement.innerHTML = formattedOutput;
                        responseContainer.appendChild(responseElement);
                    }
                }

            }
        });

    });
});

// Fetch text file content to pre-fill the textarea
async function fetchTxtFileContent() {
    try {
        const response = await fetch(chrome.runtime.getURL("data/pan_cards.txt"));
        if (!response.ok) throw new Error("Failed to fetch the TXT file");
        document.getElementById("inputValues").value = await response.text();
    } catch (error) {
        sendMessageToContent({ action: "error", message: JSON.stringify(error) });
    }
}

document.addEventListener("DOMContentLoaded", fetchTxtFileContent);
