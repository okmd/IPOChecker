class IPOChecker {
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
    const qtyFormatted =
      details[0] != null && details[1] != null
        ? `<div class="name_css col-7">${details[0][1]}</div>
           <div class="qty_css col-1">${details[1][1]}</div>`
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


chrome.runtime.sendMessage({
  action: "fetchData", url: "https://linkintime.co.in/mipo/IPO.aspx/SearchOnPan", body: {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ clientid: clientId, PAN: panCard, key_word: "PAN" }),
  }
}, (data) => {
  if (data) {

    // Process the fetched data here
    console.log(data);
    const qty = /<NAME1>(.*?)<\/NAME1>/g.exec(data.d);
    const alloted = /<ALLOT>(.*?)<\/ALLOT>/g.exec(data.d);
    console.log(qty, alloted);
  } else {
    // Handle errors or display a message
    console.error("Failed to fetch data.");
  }
});