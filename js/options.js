
const KEY_LANGUAGE = "language";
const KEY_B_INJECT_CUSTOM_BUTTONS = "bInjectCustomButtons";
const KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS = "num_concurrent_video_downloads";

$(document).ready( function () {  // When the document is ready firstly loaded:
    load_options();  // Load previous settings that are saved
    $("#btnSaveOptions").click(save_options);  // Set a listener for the button to save the current options.
});


function load_options() {
    chrome.storage.sync.get("language", function (items) {
        if (KEY_LANGUAGE in items){
            const language = items[KEY_LANGUAGE];
            console.debug("Chrome.Storage.Get Language: " + language);
            $("#inputSelectedLanguage").val(language);
        }
        else{
            $("#inputSelectedLanguage").val("Hebrew");  // Default value
        }
    });

    chrome.storage.sync.get(KEY_B_INJECT_CUSTOM_BUTTONS, function (items) {
        if (KEY_B_INJECT_CUSTOM_BUTTONS in items){
            const b_inject_custom_btns = items[KEY_B_INJECT_CUSTOM_BUTTONS];
            console.debug("Chrome.Storage.Get bInjectCustomButtons: " + b_inject_custom_btns);
            $("#inputInjectCustomButtons").prop("checked", b_inject_custom_btns)
        }
        else{
            $("#inputInjectCustomButtons").prop("checked", true);  // Default value
        }
    });

    chrome.storage.sync.get(KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS, function (items) {
        if (KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS in items){
            const val = items[KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS];
            console.debug("Chrome.Storage.Get Concurrent num videos: " + val);
            $("#inputNumOfConcurrentVideoDownloads").val(val);
        }
        else{
            $("#inputNumOfConcurrentVideoDownloads").val(3);  // Default value
        }
    });
}

function save_options() {
    let obj = {};
    console.debug("--------------------\nSaving options:");

    // Save the language the user desires.
    obj[KEY_LANGUAGE] = $("#inputSelectedLanguage").val();
    console.debug("Setting '"+ KEY_LANGUAGE + "': " + obj[KEY_LANGUAGE]);

    // Save whether or not to inject the custom buttons in a Moodle page
    obj[KEY_B_INJECT_CUSTOM_BUTTONS] = $("#inputInjectCustomButtons").prop("checked");
    console.debug("Setting '"+ KEY_B_INJECT_CUSTOM_BUTTONS + "': " + obj[KEY_B_INJECT_CUSTOM_BUTTONS]);

    obj[KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS] = parseInt($("#inputNumOfConcurrentVideoDownloads").val());
    console.debug("Setting '"+ KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS + "': " + obj[KEY_NUM_CONCURRENT_VIDEO_DOWNLOADS]);
    //


    ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
    // Saving the final object:
    chrome.storage.sync.set(obj, function () {
        // console.log(chrome.runtime.lastError.message)
    });
}