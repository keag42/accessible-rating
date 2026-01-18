document.addEventListener("DOMContentLoaded", () => {
    const runBtn = document.getElementById("run");

    runBtn.addEventListener("click", async () => {
        const [tab] = await chrome.tabs.query({
            active: true,
            currentWindow: true
        });

        // Inject content.js into the active tab
        chrome.scripting.executeScript({
            target: { tabId: tab.id },
            files: ["content.js"]
        });
    });
});