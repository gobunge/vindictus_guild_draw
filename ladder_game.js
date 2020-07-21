/**
 * *DB 저장을 위해 객체 필터링하는 함수
 * @Author : gobunge (dc.go.galler@gmail.com)
 * @param winnerNum :당첨자 수 
 * @param attendeeList : 추첨 참가자 리스트 (Array)
 */
function filterObject(arr, searchKey) {
  return arr.filter(obj =>
    Object.values(obj).includes(searchKey))[0];
}

/**
 * *랜덤 추첨 알고리즘
 * @Author : gobunge (dc.go.galler@gmail.com)
 * @param winnerNum :당첨자 수 
 * @param attendeeList : 추첨 참가자 리스트 (Array)
 */
function randomized(winnerNum, attendeeList) {
  let suffled = attendeeList.sort(function () {
    return 0.5 - Math.random();
  });

  let winner = suffled.slice(0, winnerNum);
  return winner;
}

/**
 * *현재 활성화된 탭 데이터 가져오는 함수
 * @Author : gobunge (dc.go.galler@gmail.com)
 * TODO : 활성화된 탭이 아닐 경우 사다리 시작 버튼 비활성화
 */
function getCurrentTabId() {
  chrome.storage.sync.get(['currentTabId'], function (result) {
    return result.key;
  });
}

/**
 * *길드 아지트 댓글 크롤링 함수
 * @Author : gobunge (dc.go.galler@gmail.com)
 */
function scrapeThePage() {
  let result = [];

  let guildName = document.querySelector('h4.tit');
  let element = document.getElementById('agit_post_comment');
  let commentList = element.getElementsByClassName('agit_view');

  for (var i = 0; i < commentList.length; i++) {
    let characterName = commentList[i].getElementsByClassName('writer');
    let replyDate = commentList[i].getElementsByClassName('date');

    let obj = {
      num: i,
      characterName: characterName[0].innerText.replace(" ", ""),
      guildName: guildName.innerText.replace(" ", ""),
      replyDate: replyDate[0].innerText,
    };

    result.push(obj);
  }
  return result;
}

/**
 * *HTML to PNG Download 함수 
 * @author : gobunge (dc.go.galler@gmail.com)
 */
function downloadImage() {
  const downloadBtn = ''
  let container = document.body;

  let downloadLink = html2canvas(container).then(canvas => {
    let link = document.createElement("a");
    let today = new Date();
    today = getYearDateDay(today);
    link.download = today + " " + "길다리결과.png";
    link.href = canvas.toDataURL("image/png");
    link.target = '_blank';
    link.text = '사다리 결과 저장';
    return link;
  });

  return downloadLink;
}

function getYearDateDay(date) {
  return String(date.getFullYear() + '-' + date.getMonth() + '-' + date.getDate());
}

/**
 * *사다리 실행 함수
 * @Author : gobunge (dc.go.galler@gmail.com)
 */
document.addEventListener('DOMContentLoaded', () => {
  const startBtn = document.querySelector('#start_btn');
  const minusBtn = document.querySelector('#minus_btn');
  const plusBtn = document.querySelector('#plus_btn');

  let winnerNum = document.getElementById("count");
  let count = 1;

  minusBtn.addEventListener('click', async () => {
    if (count > 1) {
      count--;
      winnerNum.value = count;
    }
  });

  plusBtn.addEventListener('click', async () => {
    count++;
    winnerNum.value = count;
  });

  chrome.runtime.sendMessage({ command: "get" }, function (resp) {
    let result = '';
    resp.data.some((element, index) => {
      if (index == 10) return true;
      result +=
        '<tr>' +
        '<th scope="row">' +
        element['characterName'] +
        '</th>' +
        '<td>' +
        element['guildName'] +
        '</td>' +
        '<td>' +
        element['winnerDate'] +
        '</td>' +
        '</tr>';
    });
    document.getElementById('recent-winner-list').innerHTML = result;
  });

  startBtn.addEventListener('click', async () => {
    const scriptToExec = `(${scrapeThePage})()`;
    const tabId = getCurrentTabId();

    const attendeeList = await chrome.tabs.executeScript(tabId, { code: scriptToExec });

    let result = '';
    let attendeeNameList = [];
    for (var i = 0; i < Object.keys(attendeeList[0]).length; i++) {
      result +=
        '<tr>' +
        '<th scope="row">' +
        attendeeList[0][i]['num'] +
        '</th>' +
        '<td>' +
        attendeeList[0][i]['characterName'] +
        '</td>' +
        '<td>' +
        attendeeList[0][i]['guildName'] +
        '</td>' +
        '<td>' +
        attendeeList[0][i]['replyDate'] +
        '</td>' +
        '</tr>';
      attendeeNameList.push(attendeeList[0][i]['characterName']);
    }

    startBtn.remove();
    let winnerDate = new Date();
    let winner = randomized(winnerNum.value, attendeeNameList);

    document.getElementById('attendee-list').innerHTML = result;
    document.querySelector('.total-attendee').append('총 참가자 수 : ' + attendeeNameList.length + '명');
    document.querySelector('.winner').append('사다리 당첨자 : ' + winner);

    console.log(winner);

    resultArr = [];

    winner.forEach(element => {
      let result = filterObject(attendeeList[0], element);
      result['rawDateData'] = winnerDate;
      result['winnerDate'] = winnerDate.getFullYear() + '/' + winnerDate.getMonth() + '/' + winnerDate.getDate() + " " + winnerDate.getHours() + ":" + winnerDate.getMinutes() + ":" + winnerDate.getSeconds();
      chrome.runtime.sendMessage({ command: "add", collection: "winner", data: result }, function (resp) {
        console.log(resp);
      });
    });

    let downloadLink = downloadImage();

    downloadLink.then(function (result) {
      document.querySelector('#download-btn').append(result);
    })
  });
});
