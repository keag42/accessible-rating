const functions = require("@google-cloud/functions-framework");
const cheerio = require("cheerio");

functions.http("handleRating", async (req, res) => {
    const url = req.query.url || req.body?.url;
    if (!url) return res.status(400).json({ error: "Missing url" });

    const html = await fetch(url).then(r => r.text());
    const $ = cheerio.load(html);

    let hasAlt = 0, total = 0;
    $("img").each((_, img) => {
        const alt = $(img).attr("alt");
        total++;
        if (alt && alt.trim()) hasAlt++;
    });

    res.json({ numberWithAlt: hasAlt, totalNumber: total });
});