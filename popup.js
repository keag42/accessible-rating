const dyslexiaBtn = document.getElementById("dyslexia");
const colorBlindBtn = document.getElementById("colorblindMode");
const resetBtn = document.getElementById("reset");
const simplifyBtn = document.getElementById("simplify");
const speakBtn = document.getElementById("speak");
const toggleRatingsBtn = document.getElementById("toggleRatings");

const fontSelect = document.getElementById("fontSelect");
const fontSizeSlider = document.getElementById("fontSizeSlider");
const fontSizeValue = document.getElementById("fontSizeValue");

const fontSpacingSlider = document.getElementById("fontSpacingSlider");
const fontSpacingValue = document.getElementById("fontSpacingValue");

const toggleBoldBtn = document.getElementById("toggleBold");

const voiceSelect = document.getElementById("voiceSelect");
const speechRateSlider = document.getElementById("speechRateSlider");
const speechRateValue = document.getElementById("speechRateValue");
const speechPitchSlider = document.getElementById("speechPitchSlider");
const speechPitchValue = document.getElementById("speechPitchValue");

window.onload = () => {
  populateVoiceOptions();

  chrome.storage.sync.get(["ratingsEnabled"], ({ ratingsEnabled }) => {
    const isEnabled = ratingsEnabled !== false;
    if (toggleRatingsBtn) {
      toggleRatingsBtn.textContent = isEnabled
        ? "hide ratings"
        : "show ratings";
    }
  });

  chrome.storage.sync.get(
    [
      "colorblindModeEnabled",
      "dyslexiaModeEnabled",
      "speechVoice",
      "speechRate",
      "speechPitch",
    ],
    ({
      colorblindModeEnabled,
      dyslexiaModeEnabled,
      speechVoice,
      speechRate,
      speechPitch,
    }) => {
      if (colorblindModeEnabled) {
        colorBlindBtn.textContent = "disable colorblind mode";
      } else {
        colorBlindBtn.textContent = "enable colorblind mode";
      }

      if (dyslexiaModeEnabled) {
        dyslexiaBtn.textContent = "disable dyslexia mode";
      } else {
        dyslexiaBtn.textContent = "enable dyslexia mode";
      }

      if (speechRate && speechRateSlider && speechRateValue) {
        speechRateSlider.value = speechRate;
        speechRateValue.textContent = speechRate.toFixed(1);
      }

      if (speechPitch && speechPitchSlider && speechPitchValue) {
        speechPitchSlider.value = speechPitch;
        speechPitchValue.textContent = speechPitch.toFixed(1);
      }

      if (speechVoice && voiceSelect) {
        setTimeout(() => {
          if (voiceSelect.querySelector(`option[value="${speechVoice}"]`)) {
            voiceSelect.value = speechVoice;
          }
        }, 100);
      }
    },
  );

  fontSizeValue.textContent = fontSizeSlider.value + "px";
  fontSpacingValue.textContent = fontSpacingSlider.value + "px";

  chrome.storage.sync.get(["font", "size", "spacing", "isBold"], (data) => {
    if (data.font) {
      fontSelect.value = data.font;
    } else {
      fontSelect.value = "Arial";
    }
    if (data.size) {
      fontSizeSlider.value = data.size;
      fontSizeValue.textContent = data.size + "px";
    } else {
      fontSizeSlider.value = 16;
      fontSizeValue.textContent = "16px";
    }
    if (data.spacing) {
      fontSpacingSlider.value = data.spacing;
      fontSpacingValue.textContent = data.spacing + "px";
    } else {
      fontSpacingSlider.value = 1;
      fontSpacingValue.textContent = "1px";
    }
    if (data.isBold) {
      isBold = data.isBold;
      toggleBoldBtn.textContent = isBold ? "unbold" : "bold";
    }
  });
};

function populateVoiceOptions() {
  if (!voiceSelect) return;

  while (voiceSelect.options.length > 1) {
    voiceSelect.remove(1);
  }

  let voices = speechSynthesis.getVoices();

  if (voices.length === 0) {
    speechSynthesis.onvoiceschanged = () => {
      voices = speechSynthesis.getVoices();
      populateVoiceList(voices);
    };
  } else {
    populateVoiceList(voices);
  }
}

function populateVoiceList(voices) {
  if (!voiceSelect) return;

  chrome.storage.sync.get(["speechVoice"], ({ speechVoice }) => {
    voices.forEach((voice) => {
      const option = document.createElement("option");
      option.textContent = `${voice.name} (${voice.lang})`;
      option.value = voice.name;
      voiceSelect.appendChild(option);

      if (speechVoice && voice.name === speechVoice) {
        option.selected = true;
      }
    });
  });
}

colorBlindBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.storage.sync.get(["colorblindModeEnabled"], (result) => {
      const currentState = result.colorblindModeEnabled || false;

      const newState = !currentState;

      chrome.storage.sync.set(
        { colorblindModeEnabled: newState, settingsApplied: true },
        () => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            {
              action: "toggleColorblindMode",
            },
            (response) => {
              if (response && response.colorblindModeEnabled !== undefined) {
                colorBlindBtn.textContent = response.colorblindModeEnabled
                  ? "disable colorblind mode"
                  : "enable colorblind mode";
              }
            },
          );
        },
      );
    });
  });
});

if (speakBtn) {
  speakBtn.addEventListener("click", () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, {
        action: "speakText",
      });
    });
  });
}

if (toggleRatingsBtn) {
  toggleRatingsBtn.addEventListener("click", () => {
    chrome.storage.sync.get(["ratingsEnabled"], (result) => {
      const currentState = result.ratingsEnabled !== false;
      const newState = !currentState;

      chrome.storage.sync.set({ ratingsEnabled: newState }, () => {
        toggleRatingsBtn.textContent = newState
          ? "hide ratings"
          : "show ratings";

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          chrome.tabs.sendMessage(tabs[0].id, {
            action: "toggleRatings",
            enabled: newState,
          });
        });
      });
    });
  });
}

if (simplifyBtn) {
  simplifyBtn.addEventListener("click", () => {
    sendPrompt(
      "IMPORTANT FORMATTING INSTRUCTIONS: You must ONLY output the simplified version of the text, with NO additional text, NO explanations, NO introductions like 'Here is the simplified text', and NO comments of any kind. Your entire response must contain ONLY the simplified text.\n\nSimplify this text making it easier to read and understand while preserving all meaning:\n\n{{text}}",
    );
  });
}

if (voiceSelect) {
  voiceSelect.addEventListener("change", () => {
    chrome.storage.sync.set({ speechVoice: voiceSelect.value });
  });
}

if (speechRateSlider && speechRateValue) {
  speechRateSlider.addEventListener("input", () => {
    const rate = parseFloat(speechRateSlider.value);
    speechRateValue.textContent = rate.toFixed(1);
    chrome.storage.sync.set({ speechRate: rate });
  });
}

if (speechPitchSlider && speechPitchValue) {
  speechPitchSlider.addEventListener("input", () => {
    const pitch = parseFloat(speechPitchSlider.value);
    speechPitchValue.textContent = pitch.toFixed(1);
    chrome.storage.sync.set({ speechPitch: pitch });
  });
}

dyslexiaBtn.addEventListener("click", () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.storage.sync.get(["dyslexiaModeEnabled"], (result) => {
      const currentState = result.dyslexiaModeEnabled || false;
      const newState = !currentState;

      chrome.storage.sync.set(
        { dyslexiaModeEnabled: newState, settingsApplied: true },
        () => {
          chrome.tabs.sendMessage(
            tabs[0].id,
            { action: "toggleDyslexiaMode" },
            (response) => {
              if (response && response.dyslexiaModeEnabled !== undefined) {
                dyslexiaBtn.textContent = response.dyslexiaModeEnabled
                  ? "disable dyslexia mode"
                  : "enable dyslexia mode";
              }
            },
          );
        },
      );
    });
  });
});

let isBold = false;

resetBtn.addEventListener("click", () => {
  chrome.storage.sync.remove([
    "font",
    "size",
    "spacing",
    "isBold",
    "colorblindModeEnabled",
    "dyslexiaModeEnabled",
    "settingsApplied",
  ]);

  fontSelect.value = "Arial";
  fontSizeSlider.value = 16;
  fontSizeValue.textContent = "16px";
  fontSpacingSlider.value = 1;
  fontSpacingValue.textContent = "1px";
  colorBlindBtn.textContent = "enable colorblind mode";
  dyslexiaBtn.textContent = "enable dyslexia mode";

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "resetToDefault",
    });
  });
  isBold = false;
  toggleBoldBtn.textContent = isBold ? "unbold" : "bold";
});

function applyBoldState() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "toggleBold",
      bold: isBold,
    });
  });
}

toggleBoldBtn.addEventListener("click", () => {
  isBold = !isBold;

  chrome.storage.sync.set({ isBold, settingsApplied: true });

  applyBoldState();

  toggleBoldBtn.textContent = isBold ? "unbold" : "bold";
});

fontSizeSlider.addEventListener("input", () => {
  fontSizeValue.textContent = fontSizeSlider.value + "px";
  applySizeSpacingChanges();
});

fontSelect.addEventListener("change", applyFontChanges);

fontSpacingSlider.addEventListener("input", () => {
  fontSpacingValue.textContent = fontSpacingSlider.value + "px";
  applySizeSpacingChanges();
});

function applySizeSpacingChanges() {
  const size = fontSizeSlider.value;
  const spacing = fontSpacingSlider.value;

  chrome.storage.sync.set({ size, spacing, settingsApplied: true });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "updateSizeSpacing",
      size,
      spacing,
    });
  });
}

function applyFontChanges() {
  const font = fontSelect.value;
  const size = fontSizeSlider.value;
  const spacing = fontSpacingSlider.value;

  chrome.storage.sync.set({ font, size, spacing, settingsApplied: true });

  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "updateFont",
      font,
      size,
      spacing,
    });
  });
}

function sendPrompt(promptText) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    chrome.tabs.sendMessage(tabs[0].id, {
      action: "modifyPageText",
      prompt: promptText,
    });
  });
}
