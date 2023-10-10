const allowedUrls = ["https://linkintime.co.in", "https://www.bseindia.com"];

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete') {
    if (allowedUrls.some(url => tab.url.includes(url))) {
      chrome.action.enable(tabId);
    } else {
      chrome.action.disable(tabId);
    }
  }
});

// // Define a function to make a fetch request
// async function fetchData(url, body) {
//   try {
//     const response = await fetch(url, body);
//     if (!response.ok) {
//       throw new Error(`Fetch request failed with status ${response.status}`);
//     }
//     const data = await response.json();
//     return data;
//   } catch (error) {
//     console.error(error);
//     return null;
//   }
// }
// // get from and to popup.js
// chrome.runtime.onMessage.addListener(async (request, sender, sendResponse) => {
//   if (request.action === "fetchData") {
//     const url = request.url;
//     const body = request.body;
//     const data = await fetchData(url, body);
//     sendResponse(data);
//   }
// });
