(function () {
  var localeAliases = {
    ja: "jp",
    jp: "jp",
    en: "en",
    ko: "ko"
  };

  var htmlElement = document.documentElement;
  var defaultLocale = htmlElement.dataset.defaultLocale || "ko";
  var localeSource = htmlElement.dataset.localeSrc || "./locale.json";

  function normalizeLocale(locale) {
    return localeAliases[String(locale || "").toLowerCase()] || "";
  }

  function getLocaleFromQuery() {
    var params = new URLSearchParams(window.location.search);

    return normalizeLocale(params.get("locale") || params.get("lang"));
  }

  function getLocaleFromPath() {
    var pathSegments = window.location.pathname.split("/");

    for (var index = 0; index < pathSegments.length; index += 1) {
      var locale = normalizeLocale(pathSegments[index]);

      if (locale) {
        return locale;
      }
    }

    return "";
  }

  function setText(id, value) {
    var element = document.getElementById(id);

    if (element && typeof value === "string" && value.trim()) {
      element.textContent = value.trim();
    }
  }

  function parseUtcDate(value) {
    if (typeof value !== "string" || !value.trim()) {
      return null;
    }

    var date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  }

  function formatMaintenanceWindow(maintenanceWindow, content) {
    var start = parseUtcDate(maintenanceWindow && (maintenanceWindow.start || maintenanceWindow.startUtc));
    var end = parseUtcDate(maintenanceWindow && (maintenanceWindow.end || maintenanceWindow.endUtc));

    if (!start || !end) {
      return "";
    }

    if (end.getTime() < start.getTime()) {
      return "";
    }

    var formatLocale = content.intlLocale || content.htmlLang || defaultLocale;
    var options = {
      month: "long",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    };
    var timeZone = content.timeZone || "client";

    if (timeZone !== "client") {
      options.timeZone = timeZone;
    }

    try {
      var formatter = new Intl.DateTimeFormat(formatLocale, options);
      var formattedWindow = "";

      if (typeof formatter.formatRange === "function") {
        formattedWindow = formatter.formatRange(start, end);
      } else {
        formattedWindow = formatter.format(start) + " - " + formatter.format(end);
      }

      if (String(formatLocale).toLowerCase().indexOf("ko") === 0) {
        return formattedWindow.replace(/\bAM\b/g, "오전").replace(/\bPM\b/g, "오후");
      }

      return formattedWindow;
    } catch (error) {
      return "";
    }
  }

  function applyLocale(locale, content, maintenanceWindow) {
    if (!content) {
      return;
    }

    if (typeof content.htmlLang === "string" && content.htmlLang.trim()) {
      htmlElement.lang = content.htmlLang.trim();
    }

    if (typeof content.documentTitle === "string" && content.documentTitle.trim()) {
      document.title = content.documentTitle.trim();
    }

    htmlElement.dataset.locale = locale;
    setText("maintenance-title", content.title);
    setText("maintenance-description", content.description);
    setText("maintenance-period", formatMaintenanceWindow(maintenanceWindow, content));
    setText("maintenance-notice-text", content.notice);
    setText("maintenance-refresh", content.refreshLabel);
  }

  var activeLocale =
    getLocaleFromQuery() ||
    getLocaleFromPath() ||
    normalizeLocale(htmlElement.dataset.locale) ||
    normalizeLocale(defaultLocale) ||
    "ko";

  fetch(localeSource, { cache: "no-store" })
    .then(function (response) {
      if (!response.ok) {
        throw new Error("Failed to load locale content.");
      }

      return response.json();
    })
    .then(function (localeData) {
      var contentByLocale = localeData && (localeData.locales || localeData);
      var content =
        contentByLocale && (contentByLocale[activeLocale] || contentByLocale[defaultLocale]);

      applyLocale(activeLocale, content, localeData && localeData.maintenanceWindow);
    })
    .catch(function () {
      // Keep the inline fallback text when locale.json is unavailable.
    });
})();
