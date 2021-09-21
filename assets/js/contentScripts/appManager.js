/***********************************************************************
  
  https://github.com/VinodLiyanage/Click-Eater-Extension
  -------------------------------- (C) ---------------------------------
                           Author: Vinod Liyanage
                       
************************************************************************/

const log = console.log;

class Observer {
  constructor() {
    this.xpath = null;
    this.callbacksuccess = () => {};
    this.counter = 0;
  }
  init(xpath, callbacksuccess, observeCount) {
    this.xpath = xpath;
    this.observeCount = observeCount;
    this.callbacksuccess = callbacksuccess;

    this.config = { attributes: true, childList: true, subtree: true };
    this.staticElementObserver = new MutationObserver(
      (mutationsList, observer) => {
        if (this.countValidator()) {
          this.staticElementObserverCallback(mutationsList, observer);
        } else {
          observer.disconnect();
          this.callbacksuccess();
        }
      }
    );

    this.dynamicElementObserver = new MutationObserver(
      (mutationsList, observer) => {
        if (this.countValidator()) {
          this.dynamicElementObserverCallback(mutationsList, observer);
        } else {
          observer.disconnect();
          this.callbacksuccess();
        }
      }
    );
  }
  countValidator() {
    if (this.observeCount === null || typeof this.observeCount !== "number") {
      return true;
    }
    if (this.observeCount === 0) return false;

    if (this.counter < this.observeCount) {
      return true;
    } else {
      this.counter = 0;
      return false;
    }
  }
  getElement(contextNode = document) {
    return document.evaluate(
      this.xpath,
      contextNode,
      null,
      XPathResult.FIRST_ORDERED_NODE_TYPE,
      null
    ).singleNodeValue;
  }
  click(element) {
    if (element && element instanceof HTMLElement) {
      element.click();
      this.counter++;
    }
  }
  observe() {
    this.disconnect();

    const element = this.getElement();
    if (element) {
      this.staticElementObserver.observe(element, this.config);
    } else {
      this.dynamicElementObserver.observe(document.body, this.config);
    }
  }
  disconnect() {
    try {
      this.staticElementObserver.disconnect();
      this.dynamicElementObserver.disconnect();
    } finally {
      null;
    }
  }
  staticElementObserverCallback(mutationsList, observer) {
    log("static elment observer called");
    const element = this.getElement();
    observer.disconnect();
    this.click(element);
    observer.observe(element, this.config);
  }
  dynamicElementObserverCallback(mutationsList, observer) {
    log("dynamic elment observer called");

    for (let mutation of mutationsList) {
      if (mutation.addedNodes.length && mutation.target) {
        const findElem = this.getElement(mutation.target);

        if (findElem) {
          observer.disconnect();
          this.click(findElem);
          observer.observe(document.body, this.config);
          return;
        }
      } else continue;
    }
  }
}

class ObserverMainUi {
  constructor(observer, id, windowElement) {
    this.observer = observer;
    this.id = id;
    this.windowElement = windowElement;
  }
  create() {
    const htmlText = `<div id="observer-mainui-container-wrapper-${this.id}" class="mainui-container-wrapper container container-fluid border rounded p-2">
          <form>
            <div class="row mb-3">
              <label for="inputXpath-${this.id}" class="col-sm-2 col-form-label"
                >xPath</label
              >
              <div class="col-sm-10">
                <input type="text"  class="form-control" id="inputXpath-${this.id}" value="" placeholder="xpath"/>
              </div>
            </div>
            <div class="row mb-3">
              <label for="inputObserveCount-${this.id}" class="col-sm-2 col-form-label"
                >Count</label
              >
              <div class="col-sm-10">
                <input type="number"  class="form-control" id="inputObserveCount-${this.id}" value="" placeholder="infinity"/>
              </div>
            </div>
            <div class="row mb-3">
              <div class="col-sm-10 offset-sm-2"></div>
            </div>
            <div id="observer-draggableContainer-click-bot-${this.id}" class="container container-fluid d-flex flex-rows justify-content-end flex-nowrap align-items-center">
            <button id="disconnect-click-bot-${this.id}" class="btn btn-sm btn-outline-danger m-2">
            Disconnect
            </button>
            <button id="observe-click-bot-${this.id}" disabled class="btn btn-sm btn-outline-success m-2">
              Observe
            </button>
            </div>
          </form>
        </div>`;

    const div = document.createElement("div");
    div.setAttribute("id", `observer-mainui-container-${this.id}`);
    div.insertAdjacentHTML("beforeend", htmlText);

    this.windowElement.append(div);
  }

  eventHandler() {
    const observeBtn = document.getElementById(`observe-click-bot-${this.id}`);
    const disconnectBtn = document.getElementById(
      `disconnect-click-bot-${this.id}`
    );

    const inputXpath = document.getElementById(`inputXpath-${this.id}`);
    const inputObserveCount = document.getElementById(
      `inputObserveCount-${this.id}`
    );

    if (!(inputXpath instanceof HTMLElement)) return;
    if (!(inputObserveCount instanceof HTMLElement)) return;
    if (!(observeBtn instanceof HTMLElement)) return;
    if (!(disconnectBtn instanceof HTMLElement)) return;

    const handleInput = (e) => {
      e.preventDefault();
      inputXpath.setAttribute("value", inputXpath.value);
      observeBtn.toggleAttribute("disabled", !inputXpath.value.length);
    };
    const handleObserveCount = (e) => {
      e.preventDefault();
      inputObserveCount.setAttribute("value", inputObserveCount.value);
    };

    const handleObserve = (e) => {
      e.preventDefault();
      observeBtn.innerText = "Observing...";
      observeBtn.setAttribute("disabled", "true");

      const callbacksuccess = () => {
        observeBtn.innerText = "Observe";
        observeBtn.removeAttribute("disabled");
      };
      const xpath = inputXpath.value;
      let observeCount = null;
      if (
        typeof inputObserveCount.value === "string" &&
        !isNaN(inputObserveCount.value) &&
        !isNaN(parseInt(inputObserveCount.value))
      ) {
        observeCount = Math.abs(parseInt(inputObserveCount.value || 0));
      }
      if (xpath) {
        this.observer.init(xpath, callbacksuccess, observeCount);
        this.observer.observe();
      }
    };
    const handleDisconnect = (e) => {
      e.preventDefault();
      try {
        this.windowElement.remove();
        this.observer.disconnect();
        inputXpath.removeEventListener("click", handleInput);
        inputObserveCount.removeEventListener("input", handleObserveCount);
        observeBtn.removeEventListener("click", handleObserve);
      } finally {
        disconnectBtn.removeEventListener("click", handleDisconnect);
      }
    };

    if (inputXpath && inputXpath instanceof HTMLElement) {
      inputXpath.addEventListener("input", handleInput);
    }
    if (inputObserveCount && inputObserveCount instanceof HTMLElement) {
      inputObserveCount.addEventListener("input", handleObserveCount);
    }
    if (observeBtn && observeBtn instanceof HTMLElement) {
      observeBtn.addEventListener("click", handleObserve);
    }
    if (disconnectBtn && disconnectBtn instanceof HTMLElement) {
      disconnectBtn.addEventListener("click", handleDisconnect);
    }
  }
}

class Clicker {
  constructor() {
    this.timer = null;
    this.delay = null;
    this.count = null;
    this.element = null;
    this.interval = null;
  }
  init(element, timer, delay, count) {
    this.element = element;
    this.timer = timer;
    this.delay = delay;
    this.count = count;
  }

  click() {
    if (!(this.element && this.element instanceof HTMLElement)) return;
    this.element.click();
  }

  setTimer() {
    if (!(this.timer || this.count || this.delay)) return;

    if (typeof this.count === "number" && this.count === 0) return;

    if (typeof this.delay !== "number") {
      this.delay = 0;
    }

    let timeout;
    if (typeof this.timer === "object" && this.timer !== null) {
      const { hours, minutes, seconds, miliseconds } = this.timer;
      timeout =
        hours * 3600 + minutes * 60 + seconds + miliseconds / 1000 + this.delay;
    } else {
      timeout = this.delay;
    }

    this.click(); //first click, when start the clicker.

    if (typeof this.count === "number") {
      let counter = 1;
      this.interval = setInterval(() => {
        if (this.count > counter) {
          this.click();
        } else {
          clearInterval(this.interval);
          return;
        }
        counter++;
      }, timeout * 1000);
    } else {
      this.interval = setInterval(() => {
        this.click();
      }, timeout * 1000);
    }
  }

  start() {
    this.stop();
    this.setTimer();
  }

  stop() {
    try {
      clearTimeout(this.interval);
    } finally {
      return null;
    }
  }
}

class ElementFinder {
  constructor(clickerCallback, observerCallback) {
    this.clickerCallback = clickerCallback;
    this.observerCallback = observerCallback;
  }
  disabledButtonFix(element, clickEvent) {
    if (!(element && element instanceof HTMLElement)) return;

    if (element.querySelector("[disabled]")) {
      const disabledElmArray = [];
      Array.from(element.querySelectorAll("[disabled]") || []).forEach(
        (elem) => {
          if (elem instanceof HTMLElement) {
            disabledElmArray.push(elem);
            elem.removeAttribute("disabled");
          } else return;
        }
      );
      const x = clickEvent.clientX,
        y = clickEvent.clientY;
      const realElment = document.elementFromPoint(x, y);
      disabledElmArray.forEach((elem) => elem.setAttribute("disabled", "true"));
      return realElment;
    } else {
      return element;
    }
  }
  keyboardListener() {
    if (!window) return;
    const handleMouseClick = (clickEvent) => {
      if (clickEvent.altKey) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        this.findElement(clickEvent);
      }
      if (clickEvent.ctrlKey) {
        clickEvent.preventDefault();
        clickEvent.stopPropagation();
        this.observerCallback(clickEvent.pageX, clickEvent.pageY);
      }
      return false;
    };
    window.addEventListener("contextmenu", handleMouseClick, false);
  }
  findElement(clickEvent) {
    const x = clickEvent.clientX,
      y = clickEvent.clientY;
    let elementMouseIsOver = document.elementFromPoint(x, y);

    let element = this.disabledButtonFix(elementMouseIsOver, clickEvent);
    //*test
    log("pure element", element);
    this.clickerCallback(element);
  }
}

class DragManager {
  constructor(container, draggableContainer) {
    this.container = container;
    this.draggableContainer = draggableContainer;
  }
  dragManager() {
    // Make the DIV element draggable:
    const draggableContainer = this.draggableContainer;
    dragElement(this.container);

    //? experimental
    // this.container.addEventListener("click", (e) => {
    //   e.stopPropagation();
    //   e.stopImmediatePropagation();
    //   e.preventDefault();
    // });
    //?experimental

    function dragElement(elmnt) {
      let pos1 = 0,
        pos2 = 0,
        pos3 = 0,
        pos4 = 0;
      if (draggableContainer) {
        // if present, the header is where you move the DIV from:
        draggableContainer.onmousedown = dragMouseDown;
      } else {
        // otherwise, move the DIV from anywhere inside the DIV:
        elmnt.onmousedown = dragMouseDown;
      }

      function dragMouseDown(e) {
        e = e || window.event;
        // e.preventDefault();
        // e.stopPropagation();
        // get the mouse cursor position at startup:
        pos3 = e.clientX;
        pos4 = e.clientY;
        document.onmouseup = closeDragElement;
        // call a function whenever the cursor moves:
        document.onmousemove = elementDrag;
      }

      function elementDrag(e) {
        e = e || window.event;
        e.preventDefault();
        // calculate the new cursor position:
        pos1 = pos3 - e.clientX;
        pos2 = pos4 - e.clientY;
        pos3 = e.clientX;
        pos4 = e.clientY;
        // set the element's new position:

        elmnt.style.botom = "unset";
        elmnt.style.top = elmnt.offsetTop - pos2 + "px";

        elmnt.style.right = "unset";
        elmnt.style.left = elmnt.offsetLeft - pos1 + "px";
      }

      function closeDragElement() {
        // stop moving when mouse button is released:
        document.onmouseup = null;
        document.onmousemove = null;
      }
    }
  }
}

class MainUi {
  constructor(element, clicker, id, windowElement) {
    this.clicker = clicker;
    this.element = element;
    this.windowElement = windowElement;
    this.id = id;
  }
  create() {
    const htmlText = `<div id="mainui-container-wrapper-${this.id}" class="mainui-container-wrapper container container-fluid border rounded">
    <div class="xpath-container mt-1 mb-3">
      <div class="row mb-3">
        <label for="inputXpath-${this.id}" class="col-sm-2 col-form-label">Xpath</label>
        <div class="col-sm-10">
          <input type="text" class="form-control" id="inputXpath-${this.id}" value="" placeholder="xPath">
        </div>
      </div>
    </div>
    <div class="timer-container mb-3">
      <label>Timer</label>
      <div class="row g-3">
        <div class="col">
          <input type="number" id="hours-${this.id}" class="form-control form-control-sm" value="" placeholder="hh" >
        </div>
        <div class="col">
          <input type="number" id="minutes-${this.id}" class="form-control form-control-sm" value="" placeholder="mm">
        </div>
        <div class="col">
          <input type="number" id="seconds-${this.id}" class="form-control form-control-sm" value="" placeholder="ss">
        </div>
        <div class="col">
          <input type="number" id="miliseconds-${this.id}" class="form-control form-control-sm" value="" placeholder="ms">
        </div>
        <div class="col">
          <button id="timer-reset-${this.id}" class="btn btn-sm btn-outline-secondary" value="" placeholder="ms">Reset</button>
        </div>
        
      </div>
    </div>
    <div class="other-container">
      <div class="row mb-3">
        <label for="inputDelay-${this.id}" class="col-sm-2 col-form-label">Delay</label>
        <div class="col-sm-10">
          <input type="number" class="form-control" id="inputDelay-${this.id}" value="" placeholder="0 seconds">
        </div>
      </div>
      <div class="row mb-3">
        <label for="inputCount-${this.id}" class="col-sm-2 col-form-label">Count</label>
        <div class="col-sm-10">
          <input type="number" class="form-control" id="inputCount-${this.id}" value="" placeholder="1" placeholder="infinity">
        </div>
      </div>
    </div>
    <div id="draggableContainer-click-bot-${this.id}" class="control-panel-container d-flex flex-rows justify-content-between align-items-center mb-2">

      <div>
        <button id="cancel-click-bot-${this.id}" class="btn btn-sm btn-danger">Cancel</button>
        </div>
        
      <div>
        <button id="reset-all-${this.id}" class="btn btn-sm btn-outline-secondary">Reset All</button>
        <button id="save-click-bot-${this.id}" disabled="true" class="btn btn-sm btn-outline-success">Save</button>
        <button id="save-and-start-click-bot-${this.id}" disabled="true" class="btn btn-sm btn-success">Save & Start</button>
      </div>
    </div>
  </div>`;
    const div = document.createElement("div");
    div.setAttribute("id", `mainui-container-${this.id}`);
    div.classList.add("mainui-container", "hide");
    div.style.position = "absolute";
    div.style.top = "45px";
    div.insertAdjacentHTML("beforeend", htmlText);
    this.windowElement.append(div);
  }
  show() {
    const mainUicontainer = document.getElementById(
      `mainui-container-${this.id}`
    );
    mainUicontainer.classList.toggle("hide");
  }
  eventHandler() {
    const mainUicontainer = document.getElementById(
      `mainui-container-${this.id}`
    );

    const saveBot = document.getElementById(`save-click-bot-${this.id}`);
    const saveAndStartBot = document.getElementById(
      `save-and-start-click-bot-${this.id}`
    );
    const resetAllBot = document.getElementById(`reset-all-${this.id}`);
    const cancelBot = document.getElementById(`cancel-click-bot-${this.id}`);

    const timerHours = document.getElementById(`hours-${this.id}`);
    const timerMinutes = document.getElementById(`minutes-${this.id}`);
    const timerSeconds = document.getElementById(`seconds-${this.id}`);
    const timerMiliseconds = document.getElementById(`miliseconds-${this.id}`);
    const timerReset = document.getElementById(`timer-reset-${this.id}`);

    const inputXpath = document.getElementById(`inputXpath-${this.id}`);
    const inputDelay = document.getElementById(`inputDelay-${this.id}`);
    const inputCount = document.getElementById(`inputCount-${this.id}`);

    const getElementFromXpath = (xpath) => {
      return document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      ).singleNodeValue;
    };
    const handleSave = (e) => {
      e.preventDefault();

      timerHours.setAttribute("value", timerHours.value);
      timerMinutes.setAttribute("value", timerMinutes.value);
      timerSeconds.setAttribute("value", timerSeconds.value);
      timerMiliseconds.setAttribute("value", timerMiliseconds.value);
      inputXpath.setAttribute("value", inputXpath.value);
      inputDelay.setAttribute("value", inputDelay.value);
      inputCount.setAttribute("value", inputCount.value);

      let timer = null;
      if (
        timerHours.value.length ||
        timerMinutes.value.length ||
        timerSeconds.value.length ||
        timerMiliseconds.value.length
      ) {
        timer = {
          hours: Math.abs(parseInt(timerHours.value || 0)),
          minutes: Math.abs(parseInt(timerMinutes.value || 0)),
          seconds: Math.abs(parseInt(timerSeconds.value || 0)),
          miliseconds: Math.abs(parseInt(timerMiliseconds.value || 0)),
        };
      }
      const delay = inputDelay.value.length
        ? Math.abs(parseFloat(inputDelay.value))
        : null;
      const count = inputCount.value.length
        ? Math.abs(parseFloat(inputCount.value))
        : null;

      let element;
      if (inputXpath.value && inputXpath.value.length) {
        element = getElementFromXpath(inputXpath.value);
      } else {
        element = this.element;
      }
      this.clicker.init(element, timer, delay, count);
    };

    const handleSaveStart = (e) => {
      handleSave(e);
      this.clicker.start();
      try {
        mainUicontainer.classList.remove("show");
        mainUicontainer.classList.add("hide");
      } finally {
        null;
      }
    };

    const handleInputEvents = (e) => {
      e.preventDefault();
      if (
        timerHours.value.length ||
        timerMinutes.value.length ||
        timerSeconds.value.length ||
        timerMiliseconds.value.length ||
        inputDelay.value.length ||
        inputCount.value.length
      ) {
        saveBot.removeAttribute("disabled");
        saveAndStartBot.removeAttribute("disabled");
      } else {
        saveBot.setAttribute("disabled", "true");
        saveAndStartBot.setAttribute("disabled", "true");
      }
    };

    const handleTimerReset = (e) => {
      e.preventDefault();
      timerHours.value = "";
      timerMinutes.value = "";
      timerSeconds.value = "";
      timerMiliseconds.value = "";
    };

    const handleResetAll = (e) => {
      e.preventDefault();
      try {
        timerHours.value = "";
        timerMinutes.value = "";
        timerSeconds.value = "";
        timerMiliseconds.value = "";
        inputDelay.value = "";
        inputCount.value = "";
      } finally {
        saveBot.setAttribute("disabled", "true");
        saveAndStartBot.setAttribute("disabled", "true");
      }
    };

    const handleCancel = (e) => {
      e.preventDefault();
      try {
        this.clicker.stop();
        mainUicontainer.classList.remove("show");
        mainUicontainer.classList.add("hide");

        saveBot.removeEventListener("click", handleSave);
        saveAndStartBot.removeEventListener("click", handleSaveStart);
        timerReset.removeEventListener("click", handleTimerReset);
        resetAllBot.removeEventListener("click", handleResetAll);

        for (let inputElement of [
          inputCount,
          inputDelay,
          timerHours,
          timerMinutes,
          timerSeconds,
          timerMiliseconds,
        ]) {
          if (inputElement instanceof HTMLElement) {
            inputElement.removeEventListener("input", handleInputEvents);
          }
        }
      } finally {
        cancelBot.removeEventListener("click", handleCancel);
      }
    };

    if (saveAndStartBot && saveAndStartBot instanceof HTMLElement) {
      saveAndStartBot.addEventListener("click", handleSaveStart);
    }
    if (saveBot && saveBot instanceof HTMLElement) {
      saveBot.addEventListener("click", handleSave);
    }
    if (timerReset && timerReset instanceof HTMLElement) {
      timerReset.addEventListener("click", handleTimerReset);
    }
    if (resetAllBot && resetAllBot instanceof HTMLElement) {
      resetAllBot.addEventListener("click", handleResetAll);
    }

    if (cancelBot && cancelBot instanceof HTMLElement) {
      cancelBot.addEventListener("click", handleCancel);
    }
    for (let inputElement of [
      inputCount,
      inputDelay,
      timerHours,
      timerMinutes,
      timerSeconds,
      timerMiliseconds,
    ]) {
      if (inputElement instanceof HTMLElement) {
        inputElement.addEventListener("input", handleInputEvents);
      }
    }
  }
}

class MiniUi {
  constructor(element, clicker, id, windowElement) {
    this.element = element;
    this.clicker = clicker;
    this.id = id;
    this.windowElement = windowElement;
    this.mainUi = null;
  }
  create() {
    const htmlText = `
            <div id="miniui-container-wrapper-${this.id}" class="container container-fluid d-flex justify-content-center align-items-center border rounded">
                <button id="edit-bot-btn-${this.id}" class="btn btn-sm btn-outline-primary m-1">Edit</button>
                <button id="start-bot-btn-${this.id}" class="btn btn-sm btn-success m-1">Start</button>
                <button id="stop-bot-btn-${this.id}" class="btn btn-sm btn-danger m-1">Stop</button>
                <button id="remove-bot-btn-${this.id}" class="btn-close btn-danger m-1"></button>
            </div>`;

    const div = document.createElement("div");
    div.style.position = "reletive";
    div.classList.add("miniui-container");
    div.setAttribute("id", `miniui-container-${this.id}`);
    div.insertAdjacentHTML("beforeend", htmlText);

    this.windowElement.append(div);
  }
  init(create = true) {
    this.mainUi = new MainUi(
      this.element,
      this.clicker,
      this.id,
      this.windowElement
    );
    if (create) {
      this.create();
      this.mainUi.create();
    }
    this.mainUi.eventHandler();
    this.eventHandler();
  }
  eventHandler() {
    const editbtn = document.getElementById(`edit-bot-btn-${this.id}`);
    const startbtn = document.getElementById(`start-bot-btn-${this.id}`);
    const stopbtn = document.getElementById(`stop-bot-btn-${this.id}`);
    const removebtn = document.getElementById(`remove-bot-btn-${this.id}`);

    const handleEdit = () => {
      this.mainUi.show();
    };
    const handleStart = (e) => {
      this.clicker.start();
    };
    const handleStop = () => {
      try {
        this.clicker.stop();
      } finally {
        null;
      }
    };
    const handleRemove = (e) => {
      try {
        this.windowElement.remove();
        this.clicker.stop();
        editbtn.removeEventListener("click", handleEdit);
        startbtn.removeEventListener("click", handleStart);
        stopbtn.removeEventListener("click", handleStop);
      } finally {
        removebtn.removeEventListener("click", handleRemove);
      }
    };
    if (editbtn && editbtn instanceof HTMLElement) {
      editbtn.addEventListener("click", handleEdit);
    }
    if (startbtn && startbtn instanceof HTMLElement) {
      startbtn.addEventListener("click", handleStart);
    }
    if (stopbtn && stopbtn instanceof HTMLElement) {
      stopbtn.addEventListener("click", handleStop);
    }
    if (removebtn && removebtn instanceof HTMLElement) {
      removebtn.addEventListener("click", handleRemove);
    }
  }
}

class Tools {
  getTabId() {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ command: "what is my tab_id?" }, (tabId) => {
        resolve(tabId.tab);
      });
    });
  }
  getCssSelector(element) {
    var names = [];
    while (element.parentNode) {
      if (element.id) {
        names.unshift("#" + element.id);
        break;
      } else {
        if (element == element.ownerDocument.documentElement)
          names.unshift(element.tagName);
        else {
          for (
            var c = 1, e = element;
            e.previousElementSibling;
            e = e.previousElementSibling, c++
          );
          names.unshift(element.tagName + ":nth-child(" + c + ")");
        }
        element = element.parentNode;
      }
    }
    return names.join(" > ");
  }
  getCoords(elem) {
    try {
      let box = elem.getBoundingClientRect();

      return {
        top: box.top + window.pageYOffset,
        right: box.right + window.pageXOffset,
        bottom: box.bottom + window.pageYOffset,
        left: box.left + window.pageXOffset,
      };
    } catch (e) {
      return {
        top: 0,
        right: 0,
        left: 0,
        botto: 0,
      };
    }
  }
  getClickEaterId() {
    const clickEaterContainerTemp = document.getElementById(
      "clickEaterContainerTemp"
    );
    if (
      clickEaterContainerTemp &&
      clickEaterContainerTemp instanceof HTMLElement
    ) {
      if (clickEaterContainerTemp.hasChildNodes) {
        return clickEaterContainerTemp.childElementCount + 1;
      } else {
        return 0;
      }
    } else {
      console.error("parent element not found!");
    }
  }
}

class StateManager {
  getClickEaterContainerTempHTML() {
    const clickEaterContainerTemp = document.getElementById(
      "clickEaterContainerTemp"
    );
    if (
      !(
        clickEaterContainerTemp &&
        clickEaterContainerTemp instanceof HTMLElement
      )
    ) {
      return null;
    }
    return clickEaterContainerTemp.innerHTML;
  }
  saveState() {
    window.addEventListener("beforeunload", () => {
      chrome.runtime.sendMessage(
        {
          state: this.getClickEaterContainerTempHTML(),
          command: "HTMLElement",
        },
        (tabId) => {
          return null;
        }
      );
    });
  }
  restoreState() {
    chrome.storage.local.get("state", async (result) => {
      if (result["state"]) {
        const tabId = await new Tools().getTabId();
        const element = result["state"][tabId];

        if (element && typeof element === "string") {
          const clickEaterContainerTemp = document.getElementById(
            "clickEaterContainerTemp"
          );

          if (
            clickEaterContainerTemp &&
            clickEaterContainerTemp instanceof HTMLElement
          ) {
            clickEaterContainerTemp.insertAdjacentHTML("beforeend", element);

            if (clickEaterContainerTemp.hasChildNodes()) {
              Array.from(clickEaterContainerTemp.children).forEach(
                (children) => {
                  const clickerId = children.dataset.id;
                  const target = children.dataset.target;
                  const btype = children.dataset.btype;

                  if (btype === "clicker") {
                    const targetElement = document.querySelector(target);
                    //console.log('targetElement', targetElement, children)

                    // if (
                    //   !(targetElement && targetElement instanceof HTMLElement)
                    // )
                    //   return;

                    const clicker = new Clicker();

                    const miniUi = new MiniUi(
                      targetElement,
                      clicker,
                      clickerId,
                      children
                    );
                    miniUi.init(false);
                  } else if (btype === "observer") {
                    const observer = new Observer();
                    const observerMainUi = new ObserverMainUi(
                      observer,
                      clickerId,
                      children
                    );
                    observerMainUi.eventHandler();
                  }
                  new DragManager(children, children).dragManager();
                }
              );
            }
          }
        }
      }
    });
  }
}

function observerCallback(x, y) {
  const observerId = new Tools().getClickEaterId();

  const observerWindowContainer = document.createElement(
    "observerWindowContainer"
  );
  observerWindowContainer.setAttribute(
    "id",
    `observerWindowContainer-${observerId}`
  );

  observerWindowContainer.dataset["id"] = observerId;
  observerWindowContainer.dataset["btype"] = "observer";

  observerWindowContainer.style.position = "absolute";
  observerWindowContainer.style.top = y + "px";
  observerWindowContainer.style.left = x + "px";

  observerWindowContainer.classList.add("observer-mainui-container");

  const clickEaterContainerTemp = document.getElementById(
    "clickEaterContainerTemp"
  );

  if (
    clickEaterContainerTemp &&
    clickEaterContainerTemp instanceof HTMLElement
  ) {
    clickEaterContainerTemp.append(observerWindowContainer);

    const windowElement = clickEaterContainerTemp.lastElementChild;

    if (!windowElement) {
      console.log("window element not found!");
      return;
    }

    const observer = new Observer();
    const observerMainUi = new ObserverMainUi(
      observer,
      observerId,
      windowElement
    );
    observerMainUi.create(x, y);
    observerMainUi.eventHandler();
    new DragManager(windowElement, windowElement).dragManager();
  }
}

async function clickerCallback(elementMouseIsOver) {
  if (!(elementMouseIsOver && elementMouseIsOver instanceof HTMLElement))
    return;

  const clickerId = new Tools().getClickEaterId();

  const CssSelector = new Tools().getCssSelector(elementMouseIsOver);

  const coords = new Tools().getCoords(elementMouseIsOver);
  const clickerWindowContainer = document.createElement(
    "clickerWindowContainer"
  );
  clickerWindowContainer.setAttribute(
    "id",
    `clickerWindowContainer-${clickerId}`
  );

  clickerWindowContainer.dataset["target"] = CssSelector;
  clickerWindowContainer.dataset["id"] = clickerId;
  clickerWindowContainer.dataset["btype"] = "clicker";

  clickerWindowContainer.style.position = "absolute";
  clickerWindowContainer.style.zIndex = "99999999";
  clickerWindowContainer.style.top = coords.top + "px";
  clickerWindowContainer.style.left = coords.left + "px";

  const clickEaterContainerTemp = document.getElementById(
    "clickEaterContainerTemp"
  );

  if (
    clickEaterContainerTemp &&
    clickEaterContainerTemp instanceof HTMLElement
  ) {
    clickEaterContainerTemp.append(clickerWindowContainer);
    const windowElement = clickEaterContainerTemp.lastElementChild;
    if (!windowElement) {
      console.log("window element not found!");
      return;
    }

    const clicker = new Clicker();

    const miniUi = new MiniUi(
      elementMouseIsOver,
      clicker,
      clickerId,
      windowElement
    );
    miniUi.init();
    new DragManager(windowElement, windowElement).dragManager();
  } else {
    console.error("an Error occured!");
  }
}

function createElementContainer() {
  const clickEaterContainer = document.createElement("clickEaterContainerTemp");
  clickEaterContainer.setAttribute("id", "clickEaterContainerTemp");
  document.body.insertAdjacentElement("beforeend", clickEaterContainer);
}

(() => {
  chrome.runtime.onMessage.addListener(
    ({ changeInfo, tabId }, sender, sendResponse) => {
      if (changeInfo.status === "complete") {
        if (!(chrome.runtime && chrome.runtime.id)) {
          console.log("please refresh the page!");
          return;
        }
      }
    }
  );
  const stateManager = new StateManager();

  createElementContainer();
  stateManager.restoreState();

  const elementFinder = new ElementFinder(clickerCallback, observerCallback);
  elementFinder.keyboardListener();

  stateManager.saveState();
})();
