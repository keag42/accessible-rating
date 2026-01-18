//This is the background.ks 
chrome.runtime.onMessage.addListener((request, sender, sendResponse) =>{
    if(request.action === "fetchUrl"){

        //A log for the requets 
        console.log("Recieved request to fetch:", request.url);

        fetch(request.url)
        .then(response => {
            //Confirming the fetch 
            console.log("Sucessfully fetched: ", request.url);
            return response.text()
        })
        .then(text => sendResponse({ success: true, data: text}))
        .catch(error => {
            //Logging: to see why it has failed: 
            console.error("Fetch error for: ", request.url, error);
            sendResponse({success: false, error: error.message});
        });

        return true; //Keeps the message channel open for async response.
 }
})

//For testing 
setInterval(() => {
    console.log("I am alive! Waiting for messages...");
}, 3000);
