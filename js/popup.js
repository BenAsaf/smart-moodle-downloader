

$(document).ready( function () {
	$("#btn_download_all_course").click(function () {
		handle_download_moodle("popup_download_entire_course");
	});
	$("#btn_download_current_video").click(function () {
		handle_download_streamitup("popup_download_current_video");
	});
	$("#btn_download_all_video").click(function () {
		handle_download_streamitup("popup_download_all_video");
	});
});

function handle_download_moodle(msg_type){
	chrome.tabs.query({active: true}, function (tab) {
		const currentTab = tab[0];
		if (!currentTab.url.includes("moodle")) {
			alert("The current active tab is not 'moodle'.");
			return;
		}
		chrome.tabs.sendMessage(currentTab.id, {type: msg_type}, function () {
			if (chrome.runtime.lastError){
				// console.error(lastError);
			}
		});
	});
}


function handle_download_streamitup(msg_type) {
	chrome.tabs.query({active: true}, function (tab) {
		const currentTab = tab[0];
		if (!currentTab.url.includes("www.streamitupcdn.net")) {
			alert("The current active tab is not 'streamitup'.");
			return;
		}
		chrome.tabs.sendMessage(currentTab.id, {type: msg_type}, function () {
			if (chrome.runtime.lastError){
				// console.error(lastError);
			}
		});
	});
}