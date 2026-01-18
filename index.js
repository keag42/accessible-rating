// Runs on Google search results page
// Extracts main result URLs for processing
console.log("Accessibility ranking extension running");

// Store results globally so we can show/hide them
let rankedResults = [];
let ratingsVisible = false;

function getSearchResultUrls() {
  //Note: 'div.g' is the standard class for Google results:HOWEVER it can change.
  const results = document.querySelectorAll("div.g");
  console.log(`Found ${results.length} results`);

  const urls = [];

  let elements = Array.from(document.querySelectorAll("div.g"));

  //Strategy 2 failed
  if (elements.length === 0) {
    //Get all the direct children of the result section
    elements = Array.from(document.querySelectorAll("#rso > div"));
    console.log("Strategy 1 failed. switching to #rso strategy.");
  }
  //Strategy 3
  if (elements.length === 0) {
    console.log("Strategy 2 failed. Searching by H3 Titles");
    const titles = document.querySelectorAll("#rso h3");

    elements = Array.from(titles).map((h3) => {
      return h3.closest("div").parentElement;
    });
  }

  console.log(`Found ${elements.length} potential result blocks`);

  elements.forEach((result) => {
    //Skips nulls or invisible elements
    if (!result || result.offsetParent === null) return;

    const link = result.querySelector("a");
    if (!link || !link.href) return;

    const url = link.href;

    //Filter out internal Google links, ads, or empty links
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

function addBadge(result, text, score){
    const badge = document.createElement("div");
        badge.className = "accessibility-rank";

        badge.textContent = text;

        badge.style.position = "absolute";
        badge.style.left= "-60px";
        badge.style.top = "12px";
        if(score > 70 && score <= 100){
            badge.style.background = "#24C939"; //
        }
        else if(score > 40 ){
            badge.style.background = "#B5A400";
        }
        else{
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

  // Remove existing badges first to avoid duplicates
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

  //ASKS the background.js to fetch the HTML for us
  const htmlText = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ action: "fetchUrl", url: url }, (response) => {
      if (response && response.success) {
        resolve(response.data);
      } else {
        resolve(""); //Return empty string if failed.
      }
    });
  });

    if (htmlText) {
        //If the text includes meta data then the point should apply. +10
        if (htmlText.includes('<meta name="viewport"')) score += 10;

        //If the text includes <meta data and the language of the html for users> it should be +10
        if (htmlText.includes("<html lang=>")) score += 10;

        //If the text has the correct semantic tags such as the header, footer and nav it should be +10 points
        if (htmlText.match(/<header>|<main>|<nav>|<footer>/)) score += 20;

        if (htmlText.match(/aria-|role=""/)) score += 20;

        if(htmlText.match(/mobile|responsive|@media/)) score += 30

        const [withAlt, total] = await ratingData(url);
        console.log(withAlt + '/' + total);
    }

  return score;
}

//rating
async function ratingData(pageLink) {
    let numberWithAlt = 0;
    let totalNumber = 0;

    // Ask background.js to fetch HTML
    const htmlText = await new Promise((resolve) => {
        chrome.runtime.sendMessage(
            { action: "fetchUrl", url: pageLink },
            (response) => {
                resolve(response?.success ? response.data : "");
            }
        );
    });

    if (!htmlText) {
        return [0, 0];
    }

    // Parse HTML safely in content script
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlText, "text/html");

    const images = doc.querySelectorAll("img");

    images.forEach(img => {
        totalNumber++;
        const alt = img.getAttribute("alt");
        if (alt && alt.trim() !== "") {
            numberWithAlt++;
        }
    });

    return [numberWithAlt, totalNumber];
}

//Score all results
async function scoreResults(items){
    for(const item of items){
        item.score = await analyzeAccessibility(item.url);
    }
}

//Sort by accessibility score:
function sortbyScore(items) {
  return items.sort((a, b) => b.score - a.score);
}

//Updating the UI with rankings
function applyRankings(items) {
  items.forEach((item, index) => {
    const rank = index + 1;
    addBadge(item.element, `#${rank} . ${item.score}`, item.score);
  });
}

// Listen for toggle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("index.js received message:", request);
  if (request.action === "toggleRatings") {
    if (request.enabled) {
      showBadges();
    } else {
      hideBadges();
    }
  }
});

// Also listen for storage changes (more reliable)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === "sync" && changes.ratingsEnabled) {
    console.log("Ratings setting changed:", changes.ratingsEnabled.newValue);
    if (changes.ratingsEnabled.newValue === false) {
      hideBadges();
    } else {
      showBadges();
    }
  }
});

async function main() {
  const results = getSearchResultUrls();

  if (results.length === 0) {
    console.log(
      "No results found. Google might have changed their CSS class names.",
    );
    return;
  }

  await scoreResults(results);
  rankedResults = sortbyScore(results);

  // Check if ratings should be shown based on stored setting
  chrome.storage.sync.get(["ratingsEnabled"], ({ ratingsEnabled }) => {
    console.log("ratingsEnabled value from storage:", ratingsEnabled);
    // Show ratings if ratingsEnabled is true OR if it's undefined/null (default to show)
    if (
      ratingsEnabled === true ||
      ratingsEnabled === undefined ||
      ratingsEnabled === null
    ) {
      console.log("Showing badges");
      showBadges();
    } else {
      console.log("Hiding badges - ratingsEnabled is", ratingsEnabled);
    }
  });

  console.log("Ranking complete");
}

main();
