/*
* The 'content.js' runs at every website that it's URL matches: "*://*.ac.il/*course/*"
* The purpose of 'content.js' is to inject the new custom buttons.
*
*
*
* */

chrome.runtime.onMessage.addListener(function (request, sender, callback) {
    const msg_type = request.type;
    console.debug("content.js: Received message: " + msg_type);
    if (msg_type === "popup_download_entire_course" || msg_type === "download_entire_course")
    {
        download_course();
        return true;
    }
});


//Wake up the background script and do stuff there if needed and then calls 'init_content_script'
chrome.runtime.sendMessage({type: "moodle_course_init"}, init_content_script);

// $(document).ready(init_content_script);


function init_content_script() {
    create_buttons();
}




function create_buttons() {
    const course_name = _get_course_name();
    const all_sections_objs = _get_all_sections();
    for (let i = 0; i < all_sections_objs.length; i++) {
        const s = all_sections_objs[i];
        // const section_name = s.name;
        // const section_content = s.content;

        const download_file_button = create_section_files_dl_button(s, course_name);//undefined if section is empty of files
        if(download_file_button){
            s.summary.appendChild(download_file_button);
        }
    }
    const course_download_button = create_course_dl_button(all_sections_objs[0]);
    all_sections_objs[0].summary.appendChild(course_download_button);
}

function create_section_files_dl_button(section_obj, course_name) {
    const section_download_callback = make_section_files_download_callback(section_obj, course_name);
    const button_text = "Download section files";
    const button_id = "section_"+section_obj.index;
    return create_download_button(button_id, section_download_callback, button_text);
}

function create_course_dl_button(section_obj) {
    const button_function = download_course;
    const button_text = "Download the entire course";
    const button_id = "download_course";
    return create_download_button(button_id, button_function, button_text);
}

function _get_course_name() {
    /**
     * Returns the course name
     */
    return document.title.replace("Course: ", "");
}


function _get_all_sections(){
    /**
     * Returns all the sections in the moodle course page
     * @type {m.fn.init|jQuery|HTMLElement}
     */
    const topics_container = $("ul.topics");
    const sections = topics_container.children();
    let section_objects = [];
    for (let i = 0; i < sections.length; i++) {
        const is_available = sections[i].getElementsByClassName("section_availability")[0].innerText !== "Not available";
        if (!is_available){
            continue;
        }
        const s = {
            name: sections[i].getElementsByClassName("sectionname")[0].innerText,
            summary: sections[i].getElementsByClassName("summary")[0],
            content: sections[i].getElementsByClassName("content")[0],
            index: i,
        };
        section_objects.push(s);
    }
    return section_objects;
}


function _create_section_download_callback(resource_links, section_obj, dl_callback)
{
    if (resource_links.length === 0) {
        return undefined;
    }
    function _extract_url_from_anchor(anchor){
        const redirect_link = anchor.attributes.onclick.textContent;
        const match = /window.open\('(.+)'/g.exec(redirect_link); //in case the link opens a page it will have onclick=window.open(<LINK>)
        return match?match[1]:anchor.href;
    }
    return function (){
        let download_record = {
            url: null,
            save_path: null,
            name: null,
        };
        for (let i = 0; i < resource_links.length; i++){
            const link = resource_links[i];
            let prefix = i.toString();
            // TODO Make this work for any number of files in a section; padding
            if (i < 10){  // Padding with '0', there will probably around 10<num_files<100 in a section
                prefix = '0'+prefix;
            }
            const course_name = qualify_str_for_filename_or_dir(_get_course_name());
            const section_name_with_idx = section_obj.index + " " + qualify_str_for_filename_or_dir(section_obj.name);

            const year = "20"+extract_year_from_url(document.URL);
            const save_path = pathJoin("SmartMoodleDownloader", year, course_name, section_name_with_idx);


            const displayed_name = link.getElementsByClassName("instancename")[0].childNodes[0].nodeValue;  //File names as displayed on moodle (issue #10)

            const name = prefix + ' ' + displayed_name;

            download_record.url = _extract_url_from_anchor(link);
            download_record.save_path = save_path;
            download_record.name = name;
            console.debug("Smart Moodle Downloader: '_create_section_download_callback' created 'download_record'", download_record);
            dl_callback(download_record)
        }
        return false;//don't follow href
    };
}


function make_section_files_download_callback(section_obj) {
    const content = section_obj.content;
    const resource_links = Array.from(content.getElementsByTagName("a")).filter(link => link.href.includes("resource"));
    if (resource_links.length === 0){  // If no file resources in the section..
        return null;
    }
    else{  // If there are file resources
        function _dl_cb(download_record) {
            download_record = Object.assign({type: "download"}, download_record);
            chrome.runtime.sendMessage(download_record, function (response) {});
        }
        return _create_section_download_callback(resource_links, section_obj, _dl_cb);
    }
}



function download_course() {
    const all_sections = _get_all_sections();
    all_sections.forEach((section, index)=>{
        if (index > 0){  // Setion_0 is to download
            const element = document.getElementById("smart_moodle_downloader_section_"+section.index);
            if (element){  // The first section (0'th index) does not always include files. relevant for others section too
                element.click();
            }
        }
    });
}


