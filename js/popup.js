// Util function to format PAN card and allotment status
function formatOutput(panCard, details, count) {
    console.log(details);
    const panCardFormatted = panCard.padEnd(10, ' ');
    const qtyFormatted = details[0]!=null && details[1]!=null ? 
    `<div class="name_css col-7">${details[0][1]}</div>
     <div class="qty_css col-1">${details[1][1]}</div>` :
    `<div class="na col-8">Not Found</div>`;
    return `<div class="pan_card col-4">${count}:${panCardFormatted}</div>${qtyFormatted}`;
}

// Fetch IPO allotment details from the LinkInTime server
async function fetchAllotmentDetails(clientId, panCard) {
    try {
        const response = await fetch("https://linkintime.co.in/mipo/IPO.aspx/SearchOnPan", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ clientid: clientId, PAN: panCard, key_word: "PAN" })
        });

        if (!response.ok) throw new Error(`Request failed with status ${response.status}`);
        const data = await response.json();
        const qty = /<NAME1>(.*?)<\/NAME1>/g.exec(data.d);
        const alloted = /<ALLOT>(.*?)<\/ALLOT>/g.exec(data.d);
        return [qty, alloted];
    } catch (error) {
        error =  `${panCard}\tError: ${error.message}`;
        sendErrorMessage(error)
        return error;
    }
}

// Check IPO allotment and fetch formatted output
async function checkIPO(clientId, panCard, count) {
    const details = await fetchAllotmentDetails(clientId, panCard);
    return formatOutput(panCard, details, count);
}

// Populate select options in the popup
function sendMessageToContent(actions, callback=null) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const currentTab = tabs[0];
        chrome.tabs.sendMessage(currentTab.id, actions, callback);
    });
}
function populateOptions() {
    sendMessageToContent({ action: 'getOptions' }, (options) => {
        if (options) {
            const targetSelect = document.getElementById("selectIpo");
            options.forEach(({ value, label }) => {
                const opt = new Option(label, value);
                targetSelect.appendChild(opt);
            });
        }
    });
}

function sendErrorMessage(message){
    sendMessageToContent({ action: 'error', message:message });
}
// Event listeners and initialization
document.addEventListener("DOMContentLoaded", () => {
    populateOptions();
    const responseContainer = document.getElementById("responseContainer");

    document.getElementById("checkButton").addEventListener("click", async () => {
        responseContainer.innerHTML = "";
        const clientId = document.getElementById("selectIpo").value;
        const panCards = document.getElementById("inputValues").value.split(/\s+/).map(s => s.trim());
        let count = 1;
        for (const panCard of panCards) {
            const formattedOutput = await checkIPO(clientId, panCard, count++);
            const responseElement = document.createElement("div");
            responseElement.classList.add('row');
            responseElement.innerHTML = formattedOutput;
            responseContainer.appendChild(responseElement);
        }
    });
});

// Fetch text file content to pre-fill the textarea
async function fetchTxtFileContent() {
    try {
        const response = await fetch(chrome.runtime.getURL("data/pan_cards.txt"));
        if (!response.ok) throw new Error("Failed to fetch the TXT file");
        document.getElementById("inputValues").value = await response.text();
    } catch (error) {
        sendErrorMessage(JSON.stringify(error));
    }
}

document.addEventListener("DOMContentLoaded", fetchTxtFileContent);
