const style = document.createElement("style");
style.textContent = `
  @font-face {
    font-family: 'Boldonse';
    src: url('${chrome.runtime.getURL("fonts/Boldonse-Regular.ttf")}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'ComicSans';
    src: url('${chrome.runtime.getURL("fonts/ComicSansMS.ttf")}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'Nunito';
    src: url('${chrome.runtime.getURL(
      "fonts/Nunito-Medium.ttf",
    )}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'OpenDyslexic';
    src: url('${chrome.runtime.getURL(
      "fonts/OpenDyslexic-Regular.otf",
    )}') format('opentype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'Roboto';
    src: url('${chrome.runtime.getURL(
      "fonts/Roboto-Regular.ttf",
    )}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
  @font-face {
    font-family: 'SourGummy';
    src: url('${chrome.runtime.getURL("fonts/SourGummy-Regular.ttf")}') format('truetype');
    font-weight: normal;
    font-style: normal;
  }
`;
document.head.appendChild(style);

let speechSynthesisActive = false;

let originalStyles = {};
run_once = false;
let colorblindModeEnabled = false;
let dyslexiaModeEnabled = false;

function saveSelection() {
  if (window.getSelection) {
    const sel = window.getSelection();
    if (sel.getRangeAt && sel.rangeCount) {
      return sel.getRangeAt(0);
    }
  }
  return null;
}

function restoreSelection(range) {
  if (range) {
    if (window.getSelection) {
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
    }
  }
}

function speakText(text) {
  stopSpeech();

  const utterance = new SpeechSynthesisUtterance(text);

  chrome.storage.sync.get(
    ["speechVoice", "speechRate", "speechPitch"],
    (data) => {
      let voiceName = data.speechVoice || "";
      let rate = data.speechRate || 1;
      let pitch = data.speechPitch || 1;

      if (voiceName) {
        const voices = window.speechSynthesis.getVoices();
        const voice = voices.find((v) => v.name === voiceName);
        if (voice) {
          utterance.voice = voice;
        }
      }

      utterance.rate = rate;
      utterance.pitch = pitch;

      utterance.onstart = () => {
        speechSynthesisActive = true;
        console.log("Speech started");
      };

      utterance.onend = () => {
        speechSynthesisActive = false;
        console.log("Speech ended");
      };

      utterance.onerror = (event) => {
        speechSynthesisActive = false;
        console.error("Speech error:", event);
      };

      window.speechSynthesis.speak(utterance);
    },
  );
}

function stopSpeech() {
  if (speechSynthesisActive) {
    window.speechSynthesis.cancel();
    speechSynthesisActive = false;
  }
}

function captureOriginalStyles() {
  originalStyles.body = {
    fontFamily: document.body.style.fontFamily,
    fontSize: document.body.style.fontSize,
    fontSpacing: document.body.style.letterSpacing,
    fontWeight: document.body.style.fontWeight,
    filter: document.body.style.filter,
  };

  originalStyles.elements = [];
  const allElements = document.querySelectorAll("*:not(script):not(style)");
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== "none" && style.visibility !== "hidden";
    if (isVisible) {
      originalStyles.elements.push({
        element: el,
        fontFamily: style.fontFamily,
        fontSize: style.fontSize,
        fontSpacing: style.letterSpacing,
        fontWeight: style.fontWeight,
      });
    }
  });

  originalStyles.html = document.documentElement.innerHTML;
}

if (run_once == false) {
  captureOriginalStyles();
  run_once = true;
}

function applyColorblindMode(enabled) {
  colorblindModeEnabled = enabled;

  if (enabled) {
    document.body.style.filter = "contrast(105%) saturate(200%)";
  } else {
    document.body.style.filter = "none";
  }
}

function applyDyslexiaMode(enabled) {
  dyslexiaModeEnabled = enabled;

  if (enabled) {
    applyFontToAll("OpenDyslexic", 15, 2.5);
    const allElements = document.querySelectorAll("*:not(script):not(style)");
    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      if (style.display !== "none" && style.visibility !== "hidden") {
        el.style.fontWeight = "bold";
      }
    });
  } else {
    resetToOriginalStyles();
  }
}

function applySizeSpacingToAll(size, spacing) {
  document.body.style.fontSize = size + "px";
  document.body.style.letterSpacing = spacing + "px";

  const allElements = document.querySelectorAll("*:not(script):not(style)");
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== "none" && style.visibility !== "hidden";
    if (isVisible) {
      el.style.fontSize = size + "px";
      el.style.letterSpacing = spacing + "px";
    }
  });
}

function applyFontToAll(font, size, spacing) {
  document.body.style.fontFamily = font;
  document.body.style.fontSize = size + "px";
  document.body.style.letterSpacing = spacing + "px";

  const allElements = document.querySelectorAll("*:not(script):not(style)");
  allElements.forEach((el) => {
    const style = window.getComputedStyle(el);
    const isVisible = style.display !== "none" && style.visibility !== "hidden";
    if (isVisible) {
      el.style.fontFamily = font;
      el.style.fontSize = size + "px";
      el.style.letterSpacing = spacing + "px";
    }
  });
}

async function callCohere(prompt) {
  try {
    const loadingSpan = document.createElement("span");
    loadingSpan.textContent = "⌛ Processing...";
    loadingSpan.style.backgroundColor = "#fff3cd";
    loadingSpan.style.padding = "2px 5px";
    loadingSpan.style.borderRadius = "3px";
    document.body.appendChild(loadingSpan);

    const res = await fetch(
      "https://textsavvy-backend.onrender.com/api/modify",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        mode: "cors",
        credentials: "omit",
        body: JSON.stringify({
          text: prompt,
          prompt: prompt,
        }),
      },
    );

    loadingSpan.remove();

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    const data = await res.json();
    return { text: data.text };
  } catch (error) {
    console.error("API error:", error);
    const errorSpan = document.createElement("span");
    errorSpan.textContent =
      "❌ Error: Could not process text. Please try again.";
    errorSpan.style.backgroundColor = "#f8d7da";
    errorSpan.style.padding = "2px 5px";
    errorSpan.style.borderRadius = "3px";
    document.body.appendChild(errorSpan);
    setTimeout(() => errorSpan.remove(), 3000);
    return { error: error.message };
  }
}

function resetToOriginalStyles() {
  document.body.style.fontFamily = originalStyles.body.fontFamily;
  document.body.style.fontSize = originalStyles.body.fontSize;
  document.body.style.letterSpacing = originalStyles.body.fontSpacing;
  document.body.style.fontWeight = originalStyles.body.fontWeight;
  document.body.style.filter = originalStyles.body.filter;

  originalStyles.elements.forEach((item) => {
    try {
      if (item.element && item.element.style) {
        item.element.style.fontFamily = item.fontFamily;
        item.element.style.fontSize = item.fontSize;
        item.element.style.letterSpacing = item.fontSpacing;
        item.element.style.fontWeight = item.fontWeight;
      }
    } catch (e) {}
  });

  const allSpans = document.querySelectorAll("span[style*='background']");
  allSpans.forEach((span) => {
    span.outerHTML = span.innerHTML;
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.table(request);

  if (request.action === "modifyPageText") {
    const selection = window.getSelection().toString();
    if (!selection) return;

    const savedRange = saveSelection();
    const selectedText = selection;

    const prompt = request.prompt.replace("{{text}}", selectedText);
    callCohere(prompt).then((response) => {
      if (!response || !response.text) return;

      restoreSelection(savedRange);

      const newText = `<span style="background:rgba(132, 177, 132, 0.03);">${response.text}</span>`;
      const range = window.getSelection().getRangeAt(0);
      range.deleteContents();
      const temp = document.createElement("div");
      temp.innerHTML = newText;
      range.insertNode(temp.firstChild);
    });
  }

  if (request.action === "updateFont") {
    applyFontToAll(request.font, request.size, request.spacing);
  }

  if (request.action === "updateSizeSpacing") {
    applySizeSpacingToAll(request.size, request.spacing);
  }

  if (request.action === "speakText") {
    const selection = window.getSelection().toString().trim();
    if (selection) {
      speakText(selection);
    }
  }

  if (request.action === "resetToDefault") {
    stopSpeech();
    resetToOriginalStyles();
    colorblindModeEnabled = false;
    dyslexiaModeEnabled = false;
    document.body.style.filter = "none";
  }

  if (request.action === "toggleDyslexiaMode") {
    applyDyslexiaMode(!dyslexiaModeEnabled);
    sendResponse({ dyslexiaModeEnabled: dyslexiaModeEnabled });
    return true;
  }

  if (request.action === "toggleBold") {
    toggleBoldAll(request.bold);
  }

  function toggleBoldAll(applyBold) {
    const allElements = document.querySelectorAll("*:not(script):not(style)");

    allElements.forEach((el) => {
      const style = window.getComputedStyle(el);
      const isVisible =
        style.display !== "none" && style.visibility !== "hidden";
      if (isVisible) {
        el.style.fontWeight = applyBold ? "bold" : "normal";
      }
    });
  }

  if (request.action === "toggleColorblindMode") {
    applyColorblindMode(!colorblindModeEnabled);

    sendResponse({ colorblindModeEnabled: colorblindModeEnabled });
    return true;
  }
});
