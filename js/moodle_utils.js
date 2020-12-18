
function extract_year_from_url(url){
    const m = /\/nu(\d+)\//.exec(url);
    return m?m[1]:null;
}

function replace_year_in_url(url, new_year) {
    const current_year = extract_year_from_url(url);
    return url.replace(current_year, new_year);
}


function create_download_button(element_id, download_callback, button_text) {
    if(!download_callback)
    {
        return null;
    }
    const inner_html =
        "<div class=\"activityinstance\">" +
        "<a class=\"\" onclick=\"\" href=\"\">" +
        "<img src=\"https://moodle2.cs.huji.ac.il/nu18/theme/image.php/huji/mod_page/1559461925/icon\" class=\"iconlarge activityicon\" alt=\" \" role=\"presentation\">" +
        "<span class=\"instancename\">" + button_text + "</span>" +
        "</a>" +
        "<span class=\"resourcelinkdetails\"> Smart Moodle Downloader</span>" +
        "</div>";
    const element = document.createElement("div");
    element.className = "activity resource modtype_resource smart_moodle_downloader";
    if (element_id){
        element.id = "smart_moodle_downloader_"+ element_id;
    }
    element.innerHTML = inner_html;

    element.onclick = function(event) {
        event.preventDefault(); //prevent redirect
        download_callback();
    };
    return element;
}
