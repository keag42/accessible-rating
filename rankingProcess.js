const functions = require('@google-cloud/functions-framework');
const cheerio = require('cheerio');

// --- HELPER LOGIC ---

async function ratingData(pageLink) {
  const res = await fetch(pageLink);
  const html = await res.text();
  const $ = cheerio.load(html);

  let numberWithAlt = 0;
  let totalNumber = 0;

  $("img").each((_, img) => {
    const alt = $(img).attr("alt");
    const hasAlt = alt !== undefined && alt.trim() !== "";
    totalNumber++;
    if (hasAlt) numberWithAlt++;
  });

  return { numberWithAlt, totalNumber };
}

async function getImgData(pageLink) {
  const res = await fetch(pageLink);
  const html = await res.text();
  const $ = cheerio.load(html);

  const results = [];
  $("img").each((_, img) => {
    const src = $(img).attr("src");
    const alt = $(img).attr("alt");

    results.push({
      hasAlt: alt !== undefined && alt.trim() !== "",
      alt: alt ?? null,
      src,
    });
  });

  return results;
}

// --- CLOUD FUNCTION ENTRY POINTS ---

functions.http('handleRating', async (req, res) => {
  try {
    const targetUrl = req.query.url || req.body?.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Please provide a "url" query parameter' });
    }

    const data = await ratingData(targetUrl);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});

functions.http('handleImages', async (req, res) => {
  try {
    const targetUrl = req.query.url || req.body?.url;
    if (!targetUrl) {
      return res.status(400).json({ error: 'Please provide a "url" query parameter' });
    }

    const data = await getImgData(targetUrl);
    return res.status(200).json(data);
  } catch (err) {
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
});