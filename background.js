
// This will keep all the 'download_records' in 'downloadId' as key and the object itself as value.
// This is to enable overwriting the file name with more informative one like it appears in Moodle.
let download_records = {};

chrome.downloads.onDeterminingFilename.addListener(suggest_file_name);


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
            case "main_moodle_init":  // Received from: content2.js
                return false;
            case "moodle_course_init":  // Received from: content.js
                return false;
            case "streamitup_init":  // Received from: content_streamitup.js
                return false;
            case "download":
                download_file(request, callback);
                return true;
            case "download_videos":
                download_videos(request, callback);
                return true;
        }
});

function _get_status_on_downloads(download_ids, callback){
    download_ids = download_ids.sort();
    chrome.downloads.search({state: "in_progress"}, function (results) {
        let active_downloads = [];
        // console.debug("Smart Moodle Downloader: '_get_status_on_downloads' got all active downloads: " + results.length);
        for (let i = 0; i < results.length; i++) {
            const r = results[i];
            // If it is active && download by our extension && it is in the download_ids
            if (r.byExtensionId === chrome.runtime.id && download_ids.includes(r.id)){
                active_downloads.push(r.id);
            }
        }
        console.debug("Smart Moodle Downloader: '_get_status_on_downloads' all our active downloads: " + active_downloads);
        callback(active_downloads);
    });
}


function download_videos(request, callback) {
    Array.from(request.url).forEach((dr)=>{
        console.debug("Smart Moodle Downloader: 'download_videos' registering ", dr);
       _register_dl_object(dr)
    });
    const DELAY = 10000;  // 10 sec between checking again and downloading if slot available
    const DL_URLS = request.url;  // All the download urls that obtained from 'streamitup' script
    const MAX_CONCURRENT_DOWNLOADS = 3;  // TODO Maybe get this from 'options'?

    let active_downloads = [];  // Will hold the downloadIDs to query 'chrome.downloads'
    const new_download_started = (downloadId) => {  // As soon as a new download starts it adds it's integer id to 'active_downloads'
        console.debug("Smart Moodle Downloader: 'download_videos' started new download: id " + downloadId);
        active_downloads.push(downloadId);
        console.debug("Smart Moodle Downloader: 'download_videos' active download ids so far: " + active_downloads);
    };
    const update_active_downloads = (updated_active_downloads) => {
        if (updated_active_downloads.length !== active_downloads.length) {
            console.debug("Smart Moodle Downloader: 'update_active_downloads' before: " + active_downloads);
            active_downloads = updated_active_downloads;
            console.debug("Smart Moodle Downloader: 'update_active_downloads' after: " + updated_active_downloads);
        }
        else{
            console.debug("Smart Moodle Downloader: 'update_active_downloads' no change in downloads.");
        }
    };
    const f = (current_url_idx) => {
        if (current_url_idx < DL_URLS.length){  // Stop condition.
            // TODO Add a for-loop to maybe start all the possible downloads immediately and then delay setTimeout
            if (active_downloads.length < MAX_CONCURRENT_DOWNLOADS){
                chrome.downloads.download({url: DL_URLS[current_url_idx].url}, new_download_started);
                current_url_idx += 1;
            }
            _get_status_on_downloads(active_downloads, update_active_downloads);
            setTimeout(f, DELAY, current_url_idx)
        }
        else{
            console.debug("Smart Moodle Downloader: 'download_videos' last downloads are now in-progress. I'm done here.");
            callback();
        }
    };
    setTimeout(f, 0, 0)  // Start downloading URLS from index 0
}


function simple_download(request, callback) {
    chrome.downloads.download({
            url: request.url,
            conflictAction: chrome.downloads.FilenameConflictAction.overwrite  //TODO: add options
        },
        callback);
}


function download_file(request, callback) {
    _register_dl_object(request);
    chrome.downloads.download({
        url: request.url,
        conflictAction: chrome.downloads.FilenameConflictAction.overwrite//TODO: add options
    },
        function (downloadId) {
            callback(request.url);
        });
}


function _register_dl_object(dl_object) {
    const id = _extract_id(dl_object.url);
    download_records[id] = dl_object;
}


function _extract_id(url){
    const match = /id=(\d+)/g.exec(url);
    return match?match[1]:url;
}


function _get_dl_object(url)
{
    const id = _extract_id(url);
    console.debug("Smart Moodle Downloader: '_get_dl_object' id of existing dr is: "+ id + " from "+ url);
    return download_records[id];
}


function suggest_file_name(download_suggestion, suggest) {
    // let download_record = {  // A reminder.
    //     url: null,
    //     save_path: null,
    //     name: null,
    // };
    const dr = _get_dl_object(download_suggestion.url);
    console.debug("Smart Moodle Downloader: 'suggest_file_name' suggested name is: " + download_suggestion.filename + " and it's url is: " + download_suggestion.url);
    const file_ext = download_suggestion.filename.split('.').pop();  // Extract the file extension
    const final_name = qualify_str_for_filename_or_dir(dr.name);  // To make sure name is valid for a file name.
    console.debug("Smart Moodle Downloader: 'suggest_file_name' final name is: " + final_name);
    download_suggestion.filename = pathJoin(dr.save_path, final_name + "." + file_ext);
    download_suggestion.conflictAction = 'overwrite';
    suggest(download_suggestion);
}
