/***********************************************************************
  
  https://github.com/VinodLiyanage/click-eater-chrome-extension
  -------------------------------- (C) ---------------------------------
                           Author: Vinod Liyanage
                         <vinodsliyanage@gmail.com>
************************************************************************/



chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if(msg.command === 'HTMLElement') {
   
    const newState = {
        [sender.tab.id]: msg.state
    }
    chrome.storage.local.set({state: newState}, ()=> {
        console.log('state is succefully saved!')
    })
  }
  if (msg.command === "what is my tab_id?") {
    sendResponse({ tab: sender.tab.id });
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    console.log(tabId, changeInfo, tab)
    chrome.tabs.sendMessage(tabId, {changeInfo, tabId}, function(response) {
        console.log('done!');
      });
})

chrome.tabs.onRemoved.addListener((tabId, removeInfo) => {
    chrome.storage.local.remove('state')
})