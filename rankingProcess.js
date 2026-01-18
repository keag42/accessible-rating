import fetch from "node-fetch";
import * as cheerio from "cheerio";
// . "https://www.geeksforgeeks.org/dsa/merge-sort/"
// https://dufferinpark.ca/home/wiki/wiki.php

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
        if (hasAlt) { numberWithAlt++; }
    });
    return [numberWithAlt, totalNumber];
}

async function getImgData(pageLink) {
    const res = await fetch(pageLink);
    const html = await res.text();
    const $ = cheerio.load(html);
    const results = [];

    $("img").each((_, img) => {
        const src = $(img).attr("src");
        const alt = $(img).attr("alt");
        const hasAlt = alt !== undefined && alt.trim() !== "";

        results.push({
            hasAlt: alt !== undefined && alt.trim() !== "",
            alt: alt ?? null,
            src,
        });
    });
    return results
}

//console.log(numberWithAlt + "/" + totalNumber + " img tags have a alternative text choice.");
console.table(await getImgData("https://dufferinpark.ca/home/wiki/wiki.php"));

/*
console.log(results.map(item => {
        if(item.hasAlt !== "" || item.hasAlt !== null){
            return item.hasAlt;
        }
    }
));*/
