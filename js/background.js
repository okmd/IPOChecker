chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      if (tab.url.includes("https://linkintime.co.in")) {
        chrome.action.enable(tabId);
      } else {
        chrome.action.disable(tabId);
      }
    }
  });
  