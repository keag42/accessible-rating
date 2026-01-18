// ==================== ACCESS LENS BACKGROUND SERVICE WORKER ====================
// Combines accessibility rating features with TextSavvy text tools

// ==================== CONTEXT MENU SETUP (TextSavvy) ====================
chrome.runtime.onInstalled.addListener(() => {
  // Clear old font settings on install/update to fix dyslexia mode bug
  chrome.storage.sync.remove(
    [
      "font",
      "size",
      "spacing",
      "isBold",
      "colorblindModeEnabled",
      "settingsApplied",
    ],
    () => {
      console.log("Cleared old font settings on extension install/update");
    },
  );

  // Create simplify text option
  chrome.contextMenus.create({
    id: "simplifyText",
    title: "Simplify Text",
    contexts: ["selection"],
  });

  // Create parent menu for translation
  chrome.contextMenus.create({
    id: "translateText",
    title: "Translate Text",
    contexts: ["selection"],
  });

  // Create language submenu items
  const languages = [
    { id: "translateEnglish", title: "English", lang: "English" },
    { id: "translateSpanish", title: "Spanish", lang: "Spanish" },
    { id: "translateFrench", title: "French", lang: "French" },
    { id: "translateGerman", title: "German", lang: "German" },
    { id: "translateChinese", title: "Chinese", lang: "Chinese" },
    { id: "translateJapanese", title: "Japanese", lang: "Japanese" },
    { id: "translateKorean", title: "Korean", lang: "Korean" },
    { id: "translateItalian", title: "Italian", lang: "Italian" },
    { id: "translatePortuguese", title: "Portuguese", lang: "Portuguese" },
    { id: "translateRussian", title: "Russian", lang: "Russian" },
  ];

  // Add each language as a submenu item
  languages.forEach((lang) => {
    chrome.contextMenus.create({
      id: lang.id,
      parentId: "translateText",
      title: lang.title,
      contexts: ["selection"],
    });
  });

  // Create text-to-speech option
  chrome.contextMenus.create({
    id: "speakText",
    title: "Speak Text",
    contexts: ["selection"],
  });
});

// Handle clicks on the context menu items
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === "simplifyText") {
    chrome.tabs.sendMessage(tab.id, {
      action: "modifyPageText",
      prompt:
        "Rewrite the following to be simpler and easier to read. DO NOT RESPOND WITH ANYTHING ELSE BUT THE SIMPLIFIED TEXT. Here is the text you simplify:\n\n{{text}}\n DO NOT REPLY WITH 'Here is your simplified text:'",
    });
  }
  // Handle translation menu items
  else if (info.menuItemId.startsWith("translate")) {
    const languageMap = {
      translateEnglish: "English",
      translateSpanish: "Spanish",
      translateFrench: "French",
      translateGerman: "German",
      translateChinese: "Chinese",
      translateJapanese: "Japanese",
      translateKorean: "Korean",
      translateItalian: "Italian",
      translatePortuguese: "Portuguese",
      translateRussian: "Russian",
    };

    const language = languageMap[info.menuItemId];
    if (language) {
      chrome.tabs.sendMessage(tab.id, {
        action: "translatePage",
        language: language,
      });
    }
  }
  // Handle text-to-speech
  else if (info.menuItemId === "speakText") {
    chrome.tabs.sendMessage(tab.id, {
      action: "speakText",
    });
  }
});

// ==================== URL FETCHING (Access Lens accessibility rating) ====================
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "fetchUrl") {
    // A log for the request
    console.log("Received request to fetch:", request.url);

    fetch(request.url)
      .then((response) => {
        // Confirming the fetch
        console.log("Successfully fetched: ", request.url);
        return response.text();
      })
      .then((text) => sendResponse({ success: true, data: text }))
      .catch((error) => {
        // Logging: to see why it has failed
        console.error("Fetch error for: ", request.url, error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keeps the message channel open for async response.
  }
});

// For testing
setInterval(() => {
  console.log("I am alive! Waiting for messages...");
}, 30000);
