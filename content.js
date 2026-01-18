(() => {
    const FUNCTION_URL =
        "https://us-central1-gen-lang-client-0652690556.cloudfunctions.net/scraper-rating";

    function injectRating(linkElement, text) {
        console.log("injecting rating", linkElement);
        if (linkElement.dataset.ratingInjected === "true") return;
        linkElement.dataset.ratingInjected = "true";

        const container = document.createElement("div");
        container.style.marginTop = "6px";
        container.style.fontSize = "12px";
        container.style.color = "#0b8043";
        container.textContent = text;

        linkElement.parentElement.appendChild(container);
    }

    async function getRatingForUrl(url) {
        const res = await fetch(FUNCTION_URL + "?url=" + encodeURIComponent(url));
        const data = await res.json();

        return `${data.numberWithAlt}/${data.totalNumber} images have alt text`;
    }

    async function processResults() {
        console.log("processing results");
        const results = document.querySelectorAll("a");
        let processedCount = 0;

        for (const link of results) {

            if (processedCount >= 3) break;

            console.log("bigger than 3");

            if (!link.href) continue;

            console.log("href is not null");

            if (link.href.includes("google.com")) continue;

            console.log("google.com is working");

            if (!link.closest("div.g")) continue; //BREAKING HERE
            console.log("closest is working");

            processedCount++;

            const ratingText = await getRatingForUrl(link.href);
            injectRating(link, ratingText);
        }
    }

    void processResults();

    const observer = new MutationObserver(() => {
        void processResults();
    });
    observer.observe(document.body, { childList: true, subtree: true });
})();