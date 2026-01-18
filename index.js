console.log("Accessibility ranking extension running");

let rankedResults = [];
let ratingsVisible = false;

function getSearchResultUrls() {
  const results = document.querySelectorAll("div.g");
  console.log(`Found ${results.length} results`);

  const urls = [];

  let elements = Array.from(document.querySelectorAll("div.g"));

  if (elements.length === 0) {
    elements = Array.from(document.querySelectorAll("#rso > div"));
  }

  if (elements.length === 0) {
    const titles = document.querySelectorAll("#rso h3");

    elements = Array.from(titles).map((h3) => {
      return h3.closest("div").parentElement;
    });
  }

  console.log(`Found ${elements.length} potential result blocks`);

  elements.forEach((result) => {
    if (!result || result.offsetParent === null) return;

    const link = result.querySelector("a");
    if (!link || !link.href) return;

    const url = link.href;

    if (
      url.startsWith("http") &&
      !url.includes("google.com") &&
      !url.includes("googleadservices")
    ) {
      urls.push({
        element: result,
        url: url,
        score: 0,
      });
    }
  });

  return urls;
}

function addBadge(result, text, score) {
  const badge = document.createElement("div");
  badge.className = "accessibility-rank";

  badge.textContent = text;

  badge.style.position = "absolute";
  badge.style.left = "-60px";
  badge.style.top = "12px";
  if (score > 70 && score <= 100) {
    badge.style.background = "#24C939";
  } else if (score > 40) {
    badge.style.background = "#B5A400";
  } else {
    badge.style.background = "#F50505";
  }
  badge.style.color = "#fff";
  badge.style.padding = "4px 8px";
  badge.style.paddingLeft = "0px";
  badge.style.borderRadius = "6px";
  badge.style.fontSize = "12px";
  badge.style.fontWeight = "bold";
  badge.style.zIndex = "1000";

  result.style.position = "relative";
  result.prepend(badge);
}

function removeBadges() {
  const badges = document.querySelectorAll(".accessibility-rank");
  badges.forEach((badge) => badge.remove());
}

function showBadges() {
  if (rankedResults.length === 0) return;

  removeBadges();

  rankedResults.forEach((item, index) => {
    const rank = index + 1;
    addBadge(item.element, `#${rank} . ${item.score}`, item.score);
  });
  ratingsVisible = true;
}

function hideBadges() {
  removeBadges();
  ratingsVisible = false;
}

async function analyzeAccessibility(url) {
  let score = 0;
  if (url.startsWith("https")) score += 10;

  const htmlText = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "fetchUrl", url: url }, (response) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        resolve("");
      }
    });
  });

  if (htmlText) {
    if (htmlText.includes('<meta name="viewport"')) score += 10;
    if (htmlText.match(/<html[^>]*lang=/)) score += 10;
    if (htmlText.match(/<header>|<main>|<nav>|<footer>/)) score += 20;

    if (htmlText.match(/aria-|role="/)) score += 20;

    if (htmlText.match(/mobile|responsive|@media/)) score += 30;

    const [withAlt, total] = await ratingData(url);
    console.log(withAlt + "/" + total);
  }

  return score;
}

async function ratingData(pageLink) {
  let numberWithAlt = 0;
  let totalNumber = 0;

  const htmlText = await new Promise((resolve) => {
    chrome.runtime.sendMessage(
      { action: "fetchUrl", url: pageLink },
      (response) => {
        resolve(response?.success ? response.data : "");
      },
    );
  });

  if (!htmlText) {
    return [0, 0];
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlText, "text/html");

  const images = doc.querySelectorAll("img");

  images.forEach((img) => {
    totalNumber++;
    const alt = img.getAttribute("alt");
    if (alt && alt.trim() !== "") {
      numberWithAlt++;
    }
  });

  return [numberWithAlt, totalNumber];
}

async function scoreResults(items) {
  for (const item of items) {
    item.score = await analyzeAccessibility(item.url);
  }
}

function sortbyScore(items) {
  return items.sort((a, b) => b.score - a.score);
}

function applyRankings(items) {
  items.forEach((item, index) => {
    const rank = index + 1;
    addBadge(item.element, `#${rank} . ${item.score}`, item.score);
  });
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === "toggleRatings") {
    if (request.enabled) {
      showBadges();
    } else {
      hideBadges();
    }
  }
});

chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.ratingsEnabled) {
    if (changes.ratingsEnabled.newValue === false) {
      hideBadges();
    } else {
      showBadges();
    }
  }
});

async function main() {
  const results = getSearchResultUrls();
  if (results.length === 0) return;

  await scoreResults(results);
  rankedResults = sortbyScore(results);

  chrome.storage.sync.get(["ratingsEnabled"], ({ ratingsEnabled }) => {
    if (ratingsEnabled !== false) {
      showBadges();
    }
  });
}

main();
