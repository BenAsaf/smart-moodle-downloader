
chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    const msg_type = request.type;
    console.debug("content_streamitup.js: Received message: " + msg_type + "\n");
    if (msg_type === "popup_download_current_video")
    {
        download_current_video(callback);
        return false;
    }
    else if (msg_type === "popup_download_all_video"){
        _scroll_down_to_reveal_all(function () {
            download_all_video(callback);
        });
        return false;
    }
});

chrome.runtime.sendMessage({type: "streamitup_init"}, init_content_script);


function init_content_script() {

}



function _get_all_sources_video(raw_text){
    const source_tag_open = "<source";
    const source_tag_close = ">";
    let all_sources = [];
    while (raw_text !== "") {
        const start = raw_text.indexOf(source_tag_open);
        if (start === -1){
            break;
        }
        const end = raw_text.indexOf(source_tag_close, start+1);
        if (end === -1){
            console.error("Critical error! could not find ending tag for \"source\" in: " + raw_text);
            return
        }
        const s = raw_text.substring(start, end+1);
        if (!s.includes("video_not_available.mp4")){
            all_sources.push(s);
            console.debug("Adding " + s);
        }
        else{
            // console.debug("Skipping. Current source contains 'video_not_available.mp4': " + s)
        }
        raw_text = raw_text.substring(end+1);
        // console.debug("Raw text is now " + raw_text);
    }
    return all_sources;
}

function _extract_download_link(all_sources){
    const src_regex = /src="(.*?)"/;
    let download_links = [];
    for (let i = 0; i < all_sources.length; i++) {
        const s = all_sources[i];
        const result = src_regex.exec(s);
        if (result){
            download_links.push(result[1])  // First group match
        }
        else{
            console.error("Critical error. Somehow an invalid download link reached here.")
        }
    }
    return download_links;
}


function _get_download_links(){
    const session_player_iframe = document.getElementById('video_player').contentWindow.document;
    const iframe_body = session_player_iframe.getElementsByTagName("body")[0];
    const isPlayerOn = (iframe_body.innerHTML !== "");
    if (isPlayerOn){
        const video_raw_text = session_player_iframe.getElementById("two").innerHTML;  // TODO Another rare crush can occur here
        const all_sources = _get_all_sources_video(video_raw_text);
        return _extract_download_link(all_sources);
    }
    return null;
}

function _scroll_down_to_reveal_all(callback) {
    const delay = 1000;  // a second delay
    const num_max_attempts = 3;
    const f = (previous_y, num_attempt) => {
        const current_y = window.scrollY;
        if (num_attempt < num_max_attempts){
            if (current_y === previous_y){
                num_attempt += 1;
            }
            window.scrollBy(0, 1000);
            setTimeout(f, delay, current_y, num_attempt);
        }
        else{
            callback()
        }
    };
    setTimeout(f, delay, window.scrollY, 0)
}



function _create_download_record_from_links(download_links){

    const timestamp = get_time_stamp();  // TODO Get course name from one of the thumbnails in 'streamitup'
    let download_records = [];
    console.debug("Smart Moodle Downloader: '_create_download_record_from_links' on links:", download_links);
    for (let i = 0; i < download_links.length; i++) {
        const link = download_links[i];
        console.debug("Smart Moodle Downloader: '_create_download_record_from_links' processing: " + link);
        const result = _parse_video_name(link);
        const file_name = result.year+"."+result.month+"."+result.day+"-"+result.hour+"."+result.min+"."+result.sec+" - Part "+result.part;
        const dr = {
            url: link,
            save_path: pathJoin("SmartMoodleDownloader", "Videos", timestamp),
            name: file_name,
        };
        download_records.push(dr)
    }
    return download_records
}

function download_current_video(callback, verbose=true){

    const session_player_iframe = document.getElementById('video_player').contentWindow.document;
    const iframe_body = session_player_iframe.getElementsByTagName("body")[0];
    const isPlayerOn = (iframe_body.innerHTML !== "");
    if (isPlayerOn)
    {
        const video_raw_text = session_player_iframe.getElementById("two").innerHTML;
        const all_sources = _get_all_sources_video(video_raw_text);
        const download_links = _extract_download_link(all_sources);
        const download_records = _create_download_record_from_links(download_links);
        console.debug(download_links);
        chrome.runtime.sendMessage({type: "download_videos", url: download_records}, function (id) {});
        callback();
        return true;
    }
    else{
        if (verbose) alert("You need to click on a video and wait for it to start playing.");
        return false;
    }
}

function _query_iframe_body() {
    const session_player_iframe = document.getElementById('video_player').contentWindow.document;
    return session_player_iframe.getElementsByTagName("body")[0];
}


function download_all_video(callback){

    const all_clip_links = document.getElementsByClassName("clip-link");
    if (all_clip_links.length > 0){
        const DELAY = 5000;  // 5 sec delay
        let download_links = [];
        const f = (previous_body, j) => {

            const iframe_body = _query_iframe_body();
            if (!iframe_body){  // To be safe from querying it during load, it might be null
                setTimeout(f, DELAY, previous_body, j, download_links);
            }
            const current_body = iframe_body.innerHTML;

            // ////////////////////////////////////////////////////////////////////////////////////////////////////////////
            // // TEMPPPPP DEBUG
            // if (j === 5){
            //     console.debug("Starting download. Got all download links: ");
            //     console.debug(download_links);
            //     const download_records = _create_download_record_from_links(download_links);
            //     chrome.runtime.sendMessage({type: "download_videos", url: download_records}, function () {});
            //     const closePlayerBtn = document.getElementById("minimize_video_player");
            //     if (closePlayerBtn){
            //         closePlayerBtn.click()
            //     }
            //     callback();
            //     return;
            // }
            ////////////////////////////////////////////////////////////////////////////////////////////////////////
            ////////////////////////////////////////////////////////////////////////////////////////////////////////

            if (j < all_clip_links.length){
                if (current_body === previous_body){
                    setTimeout(f, DELAY, previous_body, j);
                }
                else {
                    // download_current_video(null, false);
                    const more_links = _get_download_links();
                    console.debug("Smart Moodle Downloader: Adding links: " + more_links);

                    if (more_links){
                        download_links = download_links.concat(more_links);
                        console.debug("Smart Moodle Downloader: Number of links so far: " + download_links);
                    }
                    else {
                        console.error("Smart Moodle Downloader: got 'null' from '_get_download_links'");
                    }
                    setTimeout(f, DELAY, current_body, j+1);
                    all_clip_links[j+1].click();
                }
            }
            else{
                console.debug("Starting download. Got all download links: ");
                console.debug(download_links);
                const download_records = _create_download_record_from_links(download_links);
                chrome.runtime.sendMessage({type: "download_videos", url: download_records}, function () {});
                const closePlayerBtn = document.getElementById("minimize_video_player");
                if (closePlayerBtn){
                    closePlayerBtn.click()
                }
                callback();
            }
        };
        setTimeout(f, DELAY, _query_iframe_body().innerHTML, 0, []);
        all_clip_links[0].click();
    }
}
