/*
* From the documentation on 'addListener':
*   This function (callback) becomes invalid when the event listener returns, unless you return true from the
*   event listener to indicate you wish to send a response asynchronously (this will keep the message channel open
*   to the other end until sendResponse is called).
*
*
* TL;DR If you return 'false' the callback is automatically called.
*       If you return 'true' you need to call 'callback' yourself.
* */
chrome.runtime.onMessage.addListener(
    function (request, sender, callback) {
        const msg_type = request.type;
        console.debug("background.js: Received message: " + msg_type);
        switch (msg_type) {
            case "open_new_tab":
                handle_open_new_tab(request, callback);
                return true;
            case "send_message_to_tab":
                chrome.tabs.sendMessage(request.tabId, {type: request.message}, callback);
                return true;
            case "remove_tab":
                chrome.tabs.remove(request.tabId, callback);
                return true;
        }
    });


function handle_open_new_tab(request, callback) {
    /**
     * This functions opens a new tab and waits until it is finished loading.
     */
    chrome.tabs.create(request.createProperties, function (tab) {
        const f = function(){
            chrome.tabs.query({status: "complete"}, function (tabs) {
                const isActive = tabs.filter((t)=> t.id === tab.id).length;  // Should be equal to 0/1
                if (isActive){
                    callback(tab)
                }
                else{
                    setTimeout(f, 1000);
                }
            })
        };
        setTimeout(f, 1000)
    });
}
