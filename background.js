chrome.runtime.onInstalled.addListener(() => {
  console.log('Flex 근무 계산 확장 (by NARASPACE) Extension Installed!')

  setInterval(checkTabInfo, 10 * 1000) // 10s = 10 * 1000 ms
})

function checkTabInfo() {
  const targetUrl = 'https://flex.team/time-tracking/my-work-record'
  chrome.tabs.query({}, (tabs) => {
    // tabs 배열에서 조건을 만족하는 모든 탭을 필터링
    const matchingTabs = tabs.filter(
      (tab) => tab.url && tab.url.includes(targetUrl),
    )

    if (matchingTabs.length > 0) {
      // 조건을 만족하는 각 탭에 대해 작업 수행
      matchingTabs.forEach((tab) => {
        //console.log("탭을 찾았습니다:", tab);

        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        })
      })
    } else {
      console.log('해당 URL을 가진 탭이 없습니다.')
    }
  })
}
