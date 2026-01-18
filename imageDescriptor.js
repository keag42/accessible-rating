import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: "",
});

async function uploadImageFromUrl(ai, url) {
    const res = await fetch(url);
    if (!res.ok) {
        throw new Error(`Failed to fetch image: ${res.status}`);
    }

    const mimeType = res.headers.get("content-type");
    if (!mimeType?.startsWith("image/")) {
        throw new Error(`Not an image: ${mimeType}`);
    }

    const buffer = Buffer.from(await res.arrayBuffer());
    console.log({
        mimeType,
        size: buffer.length,
    });

    return await ai.files.upload({
        file: buffer,
        config: {
            mimeType,
            sizeBytes: buffer.length, // 👈 REQUIRED
        },
    });
}


async function main() {

    let imageUrl= "https://media.geeksforgeeks.org/wp-content/uploads/20250923102849709166/arr_.webp";
    const start = performance.now();

    const uploaded = await uploadImageFromUrl(ai, imageUrl);


    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: createUserContent([
            createPartFromUri(uploaded.uri, uploaded.mimeType),
            "Caption this image with a physical description, with 1-2 sentences",
        ]),
    });
    const end = performance.now();

    console.log("\n" + response.text);
    console.log(`\x1b[32mgemini-2.5-flash-lite response time: ${(end - start).toFixed(2)} ms\x1b[0m  \n`);

}


await main();
