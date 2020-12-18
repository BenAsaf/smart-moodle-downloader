
chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    const msg_type = request.type;
    console.debug("content2.js: Received message: " + msg_type);
    if (msg_type === "popup_download_all_courses" || msg_type === "download_all_courses")
    {
        download_all_courses();
        return true;
    }
});

chrome.runtime.sendMessage({type: "main_moodle_init"}, init_content_script);


function init_content_script() {
    create_buttons();
}


function create_buttons()
{
    const section = document.getElementsByClassName("span8")[0];

    const container_for_buttons = document.createElement("div");
    container_for_buttons.style = "text-align: center";
    section.insertBefore(container_for_buttons, section.children[2]);

    const download_all_courses_button = create_download_button("download_all_courses", download_all_courses, "Download all courses");
    const download_all_moodles_button = create_download_button("download_all_moodles", download_all_moodles, "Download all Moodles");

    container_for_buttons.appendChild(download_all_courses_button);
    container_for_buttons.appendChild(download_all_moodles_button);
}

function download_all_courses()
{
    const course_search_filter = document.URL + "course/view.php?id=";
    const all_a_tags = document.getElementsByTagName("a");
    const course_links = Array.from(all_a_tags).filter(link => link.href.includes(course_search_filter) &&
                                                                 link.id != "" &&
                                                                 !link.className.includes("dimmed_text"));
    console.debug("Downloading! number of links " + course_links.length, course_links);
    let finished = [];
    course_links.forEach((link) => {
        chrome.runtime.sendMessage({type: "open_new_tab", createProperties: {active: false, url: link.href}}, function(tab){
            console.debug("Smart Moodle Downloader: opened a new tab with id: " + tab.id);
            chrome.runtime.sendMessage({type: "send_message_to_tab", tabId: tab.id, message: "download_entire_course"}, function (){
                console.debug("Smart Moodle Downloader: sent a message to: " + tab.id + " to download entire course.");
                finished.push(tab.id)
            });
        });
    });
    const g = ()=> {  // To close the moodle tabs
        if (finished.length === course_links.length){
            chrome.runtime.sendMessage({type: "remove_tab", tabId: finished}, function () {
            });
        }
        else{
            setTimeout(g, 5000)
        }
    };
    setTimeout(g, 10000);
}

function download_all_moodles()
{
    const num_of_years = 5;
    const current_year = parseInt(extract_year_from_url(document.URL));
    let moodle_links = [document.URL];
    for (let i = 1; i <= num_of_years; i++) {
        moodle_links.push(replace_year_in_url(document.URL, String(current_year-i)))
    }
    console.debug("Downloading! number of links " + moodle_links.length, moodle_links);

    const DELAY_BETWEEN_MOODLES = 30000;
    const DELAY_REMOVE_TABS = 60000;
    const finished = [];
    const f = (idx)=>{
        chrome.runtime.sendMessage({type: "open_new_tab", createProperties: {active: false, url: moodle_links[idx]}}, function(tab){
            console.debug("Smart Moodle Downloader: opened a new tab with id: " + tab.id);
            chrome.runtime.sendMessage({type: "send_message_to_tab", tabId: tab.id, message: "download_all_courses"}, function (){
                console.debug("Smart Moodle Downloader: sent a message to: " + tab.id + ": \"download_all_courses\"");
                finished.push(tab.id);
                if (idx < moodle_links.length)
                {
                    setTimeout(f, DELAY_BETWEEN_MOODLES, idx+1)
                }
            });
        });
    };
    const g = ()=> {  // To close the moodle tabs
        if (finished.length === moodle_links.length){
            chrome.runtime.sendMessage({type: "remove_tab", tabId: finished}, function () {
            });
        }
        else{
            setTimeout(g, 1000)
        }
    };
    setTimeout(f, 0, 0);
    setTimeout(g, DELAY_REMOVE_TABS)
}
