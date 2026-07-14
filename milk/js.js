(function () {
  var DRAFT_KEY = "milk-draft";
  var SAVE_DELAY = 400;

  var CHAR_LABELS = {
    en: "chars",
    ru: "симв.",
    uk: "симв.",
    de: "Zeichen",
    fr: "car.",
    es: "car.",
    it: "car.",
    pt: "car.",
    pl: "znaki",
    nl: "tek.",
    sv: "tkn",
    tr: "krk",
    vi: "ký tự",
    zh: "字",
    ja: "字",
    ko: "자"
  };

  function getLocale() {
    var raw = localStorage.getItem("memos-locale") || "en";
    try {
      raw = JSON.parse(raw);
    } catch (e) {}
    return String(raw).replace(/["']/g, "").split(/[-_]/)[0].toLowerCase();
  }

  function charLabel() {
    return CHAR_LABELS[getLocale()] || CHAR_LABELS.en;
  }

  function forceMenuVisible(el) {
    el.style.setProperty("opacity", "1", "important");
    el.style.setProperty("visibility", "visible", "important");
    el.style.setProperty("pointer-events", "auto", "important");
  }

  function whenElementExists(selector, onFound, root) {
    root = root || document.body;
    function scan() {
      root.querySelectorAll(selector).forEach(function (el) {
        if (!el.dataset.milkBound) {
          el.dataset.milkBound = "1";
          onFound(el);
        }
      });
    }
    scan();
    new MutationObserver(scan).observe(root, { childList: true, subtree: true });
  }

  function setReactValue(el, value) {
    var proto = el.tagName === "TEXTAREA" ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype;
    var setter = Object.getOwnPropertyDescriptor(proto, "value").set;
    setter.call(el, value);
    el.dispatchEvent(new Event("input", { bubbles: true }));
  }

  function setupEditor(textarea) {
    var card = textarea.closest(".bg-card");
    var toolbarRow = card ? card.querySelector(".justify-end.items-center.gap-2") : null;

    var counter = document.createElement("span");
    counter.className = "milk-char-count";
    counter.style.fontFamily = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
    counter.style.fontSize = "0.7rem";
    counter.style.opacity = "0.5";
    counter.style.marginRight = "0.5rem";
    counter.style.alignSelf = "center";
    if (toolbarRow) toolbarRow.insertBefore(counter, toolbarRow.firstChild);

    var saveBtn = card
      ? Array.prototype.find.call(card.querySelectorAll("button"), function (b) {
          return b.textContent.trim() === "Сохранить";
        })
      : null;

    function updateCounter() {
      counter.textContent = textarea.value.length ? textarea.value.length + " " + charLabel() : "";
    }

    var saveTimer = null;
    function persistDraft() {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(function () {
        if (textarea.value) {
          localStorage.setItem(DRAFT_KEY, textarea.value);
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      }, SAVE_DELAY);
    }

    textarea.addEventListener("input", function () {
      updateCounter();
      persistDraft();
    });

    if (saveBtn) {
      saveBtn.addEventListener("click", function () {
        localStorage.removeItem(DRAFT_KEY);
      });
    }

    var draft = localStorage.getItem(DRAFT_KEY);
    if (draft && !textarea.value) {
      setReactValue(textarea, draft);
      updateCounter();
    } else {
      updateCounter();
    }
  }

  function setupSearchShortcut(input) {
    input.dataset.milkSearch = "1";
  }

  function setupShortcuts() {
    var lastKey = "";
    var lastKeyTime = 0;

    document.addEventListener("keydown", function (e) {
      var target = e.target;
      var isTyping = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;

      if (e.key === "/" && !isTyping) {
        var search = document.querySelector('input[data-milk-search="1"]');
        if (search) {
          e.preventDefault();
          search.focus();
        }
        return;
      }

      if (e.key.toLowerCase() === "n" && !isTyping) {
        var editor = document.querySelector(".memo-editor-content textarea");
        if (editor) {
          e.preventDefault();
          editor.focus();
        }
        return;
      }

      if (e.key === "Escape" && isTyping) {
        target.blur();
        return;
      }

      var now = Date.now();
      if (lastKey === "g" && e.key.toLowerCase() === "i" && now - lastKeyTime < 600 && !isTyping) {
        var inbox = document.getElementById("header-inbox");
        if (inbox) inbox.click();
        lastKey = "";
        return;
      }
      lastKey = e.key.toLowerCase();
      lastKeyTime = now;
    });
  }

  function init() {
    whenElementExists(".memo-editor-content textarea", setupEditor);
    whenElementExists("aside input.bg-sidebar", setupSearchShortcut);
    whenElementExists('[data-slot="dropdown-menu-content"], [data-slot="dropdown-menu-sub-content"]', forceMenuVisible);
    setupShortcuts();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
