chrome.runtime.onInstalled.addListener(() => {
  console.log('Flex 근무 계산 확장, Installed!')
  calculateStart()
})

chrome.runtime.onStartup.addListener(() => {
  console.log('Flex 근무 계산 확장, Chrome restarted, reinitializing background!')
  calculateStart()
});

function calculateStart() {
  checkTabInfo()
  setInterval(checkTabInfo, 5 * 1000) // 1s = 1 * 1000 ms
}

function checkTabInfo() {
  const targetUrl = 'https://flex.team/time-tracking/my-work-record'
  chrome.tabs.query({}, (tabs) => {
    const matchingTabs = tabs.filter(
      (tab) => tab.url && tab.url.includes(targetUrl),
    )
    if (matchingTabs.length > 0) {
      matchingTabs.forEach((tab) => {
        chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ['content.js'],
        })
      })
    } 
  })
}
