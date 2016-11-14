var connections = {};

function see(info, tab) {
  chrome.tabs.sendRequest(tab.id, {
      "method": "see",
      "text": info.selectionText
  });
}

function click(info, tab) {
  chrome.tabs.sendRequest(tab.id, {
      "method": "click"
  });
}

function amOnPage(info, tab) {
  chrome.tabs.sendRequest(tab.id, {
      "method": "amOnPage"
  });
}

function seeCurrentURLEquals(info, tab) {
  chrome.tabs.sendRequest(tab.id, {
      "method": "seeCurrentURLEquals"
  });
}

function fake(info, tab, type) {
  chrome.tabs.sendRequest(tab.id, {
      "method": "fake",
      "type": type
  });
}

function loadMenu() {
  chrome.contextMenus.removeAll(function() {
    // Create menu items
    var parent = chrome.contextMenus.create({"title": "Codeception TestTools", "contexts":["all"]});

    chrome.contextMenus.create({
      "title": "Am on page",
      "parentId": parent,
      "contexts":["all"],
      "onclick": amOnPage
    });
    chrome.contextMenus.create({
      "title": "See current URL equals...",
      "parentId": parent,
      "contexts":["all"],
      "onclick": seeCurrentURLEquals
    });
    chrome.contextMenus.create({
      "title": "See",
      "parentId": parent,
      "contexts":["selection"],
      "onclick": see
    });
    chrome.contextMenus.create({
      "title": "Click",
      "parentId": parent,
      "contexts":["all"],
      "onclick": click
    });

    var fakerMenu = chrome.contextMenus.create({
      "title": "Faker",
      "parentId": parent,
      "contexts":["all"]
    });

    var availableFaker = [
      { type: "email", name: "Email" },
      { type: "name", name: "Name" },
      { type: "firstname", name: "Firstname" },
      { type: "word", name: "Word" },
      { type: "url", name: "URL" },
    ];

    availableFaker.forEach(function(fakerData){
      chrome.contextMenus.create({
        "title": fakerData.name,
        "parentId": fakerMenu,
        "contexts": ["all"],
        "onclick": (function(type){
          return function(info, tab) {
            fake(info,tab,type);
          };
        }(fakerData.type))
      });
    });

  });
}


loadMenu();

chrome.runtime.onConnect.addListener(function (port) {

    var extensionListener = function (message, sender, sendResponse) {
        // The original connection event doesn't include the tab ID of the
        // DevTools page, so we need to send it explicitly.
        if (message.name === "init") {
          connections[message.tabId] = port;
          return;
        }

        if (message.name === "postMessage") {
          chrome.tabs.sendRequest(message.tabId, message.object);
        }
    };

    // Listen to messages sent from the DevTools page
    port.onMessage.addListener(extensionListener);

    port.onDisconnect.addListener(function(port) {
        port.onMessage.removeListener(extensionListener);
        // Disconnect means -> Dev tools closed. Set recording to false.
        var tabs = Object.keys(connections);
        for (var i=0, len=tabs.length; i < len; i++) {
          if (connections[tabs[i]] === port) {
            loadMenu();
            chrome.tabs.sendRequest(parseInt(tabs[i]), {
                "method": "recording",
                "value": false
            });
            delete connections[tabs[i]];
            break;
          }
        }
    });
});

// Receive message from content script and relay to the devTools page for the
// current tab
chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
    // Messages from content scripts should have sender.tab set
    if (sender.tab) {
      var tabId = sender.tab.id;
      if (tabId in connections) {
        connections[tabId].postMessage(request);
      } else {
        console.log("Tab not found in connection list.");
      }
    } else {
      console.log("sender.tab not defined.");
    }
    return true;
});
