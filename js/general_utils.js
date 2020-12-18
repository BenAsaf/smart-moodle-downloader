
function _parse_video_name(raw_name){
    const re = /cam_(\d+)_(\d+)_(\d+)_(\d+)_(\d+)_(\d+)_(\d+)\.mp4/.exec(raw_name);
    console.debug("Smart Moodle Downloader: '_parse_video_name' attempt to parse: " + raw_name);
    if (re){
        console.debug("Smart Moodle Downloader: '_parse_video_name' match: ", re);
        return {
            part: re[1],
            hour: re[2],
            min: re[3].length===2?re[3]:"0"+re[3],  // pad if necessary,
            sec: re[4].length===2?re[4]:"0"+re[4],  // pad if necessary,
            day: re[5].length===2?re[5]:"0"+re[5],  // pad if necessary
            month: re[6].length===2?re[6]:"0"+re[6],  // pad if necessary
            year: re[7],
        }
    }
    else{
        console.error("Smart Moodle Downloader: '_create_download_record_from_links' could not parse name: " + raw_name);
        return null;
    }
}


function get_time_stamp(){
    const today = new Date();
    const date = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();
    const time = today.getHours() + "-" + today.getMinutes() + "-" + today.getSeconds();
    const dateTime = date+'-'+time;
    return dateTime
}

function pathJoin(...args) {
    const replace_slash_with_dash = string => string.replace(/\//g,'-');
    return args.reduce((a, b) => replace_slash_with_dash(a) + '\\' + replace_slash_with_dash(b)); //TODO: linux support (\\\\ makes "file path too long")
}

function qualify_str_for_filename_or_dir(s){
    return s.replace(/[/\\,?%*:|"<>]/g, '-');
}