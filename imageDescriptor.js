import {
    GoogleGenAI,
    createUserContent,
    createPartFromUri,
} from "@google/genai";

const ai = new GoogleGenAI({
    apiKey: "put the secret here....",
});


async function main() {
    const myfile = await ai.files.upload({
        file: "images/imageTest.JPG",
        config: {mimeType: "image/jpeg"},
    });

    const start = performance.now();

    const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-lite",
        contents: createUserContent([
            createPartFromUri(myfile.uri, myfile.mimeType),
            "Caption this image with a physical description, with 1-2 sentences",
        ]),
    });
    const end = performance.now();

    console.log("\n" + response.text);
    console.log(`\x1b[32mgemini-2.5-flash-lite response time: ${(end - start).toFixed(2)} ms\x1b[0m  \n`);

}

await main();
