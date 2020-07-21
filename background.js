/**
 * *FireBase 설정
 * @Author : gobunge (dc.go.galler@gmail.com)
 */
import DBConfig from './model/dbconfig.js';
firebase.initializeApp(DBConfig);

var db = firebase.firestore();
db.settings({ timestampsInSnapshots: true });


/**
 * *FireBase 조회 및 추가 기능
 * @Author : gobunge (dc.go.galler@gmail.com)
 */
chrome.runtime.onMessage.addListener((msg, sender, response) => {
	if (msg.command == "add") {
		db.collection(msg.collection).add(msg.data).then((result) => {
			response({ type: "result", status: "success", data: result, request: msg });
		}).catch((result) => {
			response({ type: "result", status: "error", data: result, request: msg });
		});

	} else if (msg.command == "get") {
		db.collection('winner').get()
			.then(snapshot => {
				let resultArr = [];
				snapshot.forEach(doc => {
					resultArr.push(doc.data());
				});
				response({ type: "result", status: "success", data: resultArr, request: msg });
			}).catch(err => {
				response({ type: "result", status: "error", data: err, request: msg });
			});
	}
	return true;
});

const getOnActiveTabData = activeInfo => {
	chrome.tabs.get(activeInfo.tabId, function (tab) {
		chrome.storage.sync.set({ currentTabUrl: tab.url, currentTabId: tab.id });
	});
};

chrome.tabs.onActivated.addListener(getOnActiveTabData);
