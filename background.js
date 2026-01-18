chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.sync.remove([
    "font",
    "size",
    "spacing",
    "isBold",
    "colorblindModeEnabled",
    "settingsApplied",
  ]);

  chrome.contextMenus.create({
    id: "simplifyText",
    title: "Simplify Text",
    contexts: ["selection"],
  });

  chrome.contextMenus.create({
    id: "speakText",
    title: "Speak Text",
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "simplifyText") {
    chrome.tabs.sendMessage(tab.id, {
      action: "modifyPageText",
      prompt:
        "Rewrite the following to be simpler and easier to read. DO NOT RESPOND WITH ANYTHING ELSE BUT THE SIMPLIFIED TEXT. Here is the text you simplify:\n\n{{text}}\n DO NOT REPLY WITH 'Here is your simplified text:'",
    });
  } else if (info.menuItemId === "speakText") {
    chrome.tabs.sendMessage(tab.id, {
      action: "speakText",
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchUrl") {
    fetch(request.url)
      .then((response) => response.text())
      .then((text) => sendResponse({ success: true, data: text }))
      .catch((error) => {
        console.error("Fetch error:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true;
  }
});
