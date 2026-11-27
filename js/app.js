(() => {
  const DATA_URL = "data/catalog.json";

  const $ = (id) => document.getElementById(id);

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }[c]));
  }

  function isFileProtocol() {
    return location.protocol === "file:";
  }

  function showError(message, extraHtml) {
    $("list").innerHTML =
      '<div class="error">' + escapeHtml(message) + (extraHtml || "") + "</div>";
  }

  function defBlock(item) {
    return (
      '<div class="def"><strong>' +
      escapeHtml(item.name) +
      '</strong><span class="id">' +
      escapeHtml(item.id) +
      "</span><p>" +
      escapeHtml(item.definition || "") +
      "</p></div>"
    );
  }

  function chipButton(filter, value, label, count, pressed) {
    const n =
      count == null
        ? ""
        : ' <span class="n">' + escapeHtml(String(count)) + "</span>";
    return (
      '<button type="button" class="chip" data-filter="' +
      escapeHtml(filter) +
      '" data-value="' +
      escapeHtml(value) +
      '" aria-pressed="' +
      (pressed ? "true" : "false") +
      '">' +
      escapeHtml(label) +
      n +
      "</button>"
    );
  }

  function haystack(it, formName, topicName) {
    return [
      it.title,
      it.summary,
      it.id,
      it.url,
      it.article_url,
      formName[it.form] || "",
      topicName[it.topic] || "",
      it.topic_secondary ? topicName[it.topic_secondary] || it.topic_secondary : "",
    ]
      .join("\n")
      .toLowerCase();
  }

  function applyFilters(list, query, formId, topicId) {
    const q = (query || "").trim().toLowerCase();
    return list.filter((it) => {
      if (formId && formId !== "all" && it.form !== formId) return false;
      if (
        topicId &&
        topicId !== "all" &&
        it.topic !== topicId &&
        it.topic_secondary !== topicId
      ) {
        return false;
      }
      if (q && !it._hay.includes(q)) return false;
      return true;
    });
  }

  function sortItems(list, mode) {
    const out = list.slice();
    const likes = (it) => Number(it.likes) || 0;
    const t = (it) => it.created_at_shanghai || "";
    if (mode === "date-asc") {
      out.sort((a, b) => t(a).localeCompare(t(b)) || a.id.localeCompare(b.id));
    } else if (mode === "likes-desc") {
      out.sort((a, b) => likes(b) - likes(a) || t(b).localeCompare(t(a)));
    } else {
      out.sort((a, b) => t(b).localeCompare(t(a)) || b.id.localeCompare(a.id));
    }
    return out;
  }

  function boot(data) {
    const forms = (data.taxonomy && data.taxonomy.forms) || [];
    const topics = (data.taxonomy && data.taxonomy.topics) || [];
    const formName = Object.fromEntries(forms.map((x) => [x.id, x.name]));
    const topicName = Object.fromEntries(topics.map((x) => [x.id, x.name]));
    const items = Array.isArray(data.items) ? data.items : [];
    const counts = data.counts || {};
    const total = counts.total != null ? counts.total : items.length;

    items.forEach((it) => {
      it._hay = haystack(it, formName, topicName);
    });

    $("subtitle").textContent =
      "来源 " +
      (data.source || "@Khazix0918") +
      " · 时间均为 " +
      (data.timezone || "Asia/Shanghai") +
      (data.checked_at ? " · 数据校对于 " + data.checked_at : "");

    const byForm = counts.by_form || {};
    $("stats").innerHTML =
      '<span class="stat">合计 <b>' +
      escapeHtml(String(total)) +
      "</b></span>" +
      forms
        .map(
          (f) =>
            '<span class="stat">' +
            escapeHtml(f.name) +
            " <b>" +
            escapeHtml(String(byForm[f.id] || 0)) +
            "</b></span>"
        )
        .join("");

    if (data.coverage_note) {
      $("coverage").hidden = false;
      $("coverage").textContent = data.coverage_note;
    }

    $("defs").innerHTML =
      "<div><h3>体裁</h3>" +
      forms.map(defBlock).join("") +
      "</div><div><h3>主题</h3>" +
      topics.map(defBlock).join("") +
      '<p class="note">主题筛选会匹配主分类或次要主题。列表里若有次要主题，会另外标出。</p></div>';
    $("taxonomy").hidden = false;

    const byTopic = counts.by_topic || {};
    $("forms").innerHTML =
      chipButton("form", "all", "全部", null, true) +
      forms
        .map((f) => chipButton("form", f.id, f.name, byForm[f.id] || 0, false))
        .join("");
    $("topics").innerHTML =
      chipButton("topic", "all", "全部", null, true) +
      topics
        .map((t) => chipButton("topic", t.id, t.name, byTopic[t.id] || 0, false))
        .join("");

    $("total").textContent = String(total);
    $("footer").textContent =
      "数据来自 data/catalog.json（" +
      total +
      " 条，长文 " +
      (counts.articles != null ? counts.articles : byForm.article || 0) +
      " 篇）。筛选在本地完成；打开原帖或 X Article 需要网络。";

    const qEl = $("q");
    const listEl = $("list");
    const shownEl = $("shown");
    const shownArtEl = $("shown-articles");
    const sortEl = $("sort");
    let form = "all";
    let topic = "all";

    function render() {
      const filtered = sortItems(applyFilters(items, qEl.value, form, topic), sortEl.value);
      const artCount = filtered.filter((it) => it.form === "article").length;
      shownEl.textContent = String(filtered.length);
      shownArtEl.textContent = String(artCount);
      if (!filtered.length) {
        listEl.innerHTML =
          '<div class="empty">没有符合条件的条目。试试清空关键词，或改选「全部」体裁/主题。</div>';
        return;
      }
      listEl.innerHTML = filtered
        .map((it) => {
          const sec = it.topic_secondary
            ? '<span class="tag">次要：' +
              escapeHtml(topicName[it.topic_secondary] || it.topic_secondary) +
              "</span>"
            : "";
          const articleLink = it.article_url
            ? '<a href="' +
              escapeHtml(it.article_url) +
              '" target="_blank" rel="noopener">X Article</a>'
            : "";
          const sum =
            it.summary && it.summary !== it.title
              ? '<p class="sum">' + escapeHtml(it.summary) + "</p>"
              : "";
          return (
            '<article class="card">' +
            '<div class="card-top"><span class="date">' +
            escapeHtml(it.created_at_shanghai || "") +
            " · " +
            escapeHtml(data.timezone || "Asia/Shanghai") +
            '</span><span class="likes">赞 ' +
            escapeHtml(String(it.likes ?? 0)) +
            "</span></div><h2>" +
            escapeHtml(it.title || "") +
            "</h2>" +
            sum +
            '<div class="tags"><span class="tag ' +
            escapeHtml(it.form || "") +
            '">' +
            escapeHtml(formName[it.form] || it.form || "") +
            '</span><span class="tag">' +
            escapeHtml(topicName[it.topic] || it.topic || "") +
            "</span>" +
            sec +
            '</div><div class="links"><a href="' +
            escapeHtml(it.url || "#") +
            '" target="_blank" rel="noopener">原帖</a>' +
            articleLink +
            "</div></article>"
          );
        })
        .join("");
    }

    function bindChips(root, key) {
      root.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button.chip");
        if (!btn) return;
        const value = btn.getAttribute("data-value");
        if (key === "form") form = value;
        else topic = value;
        root.querySelectorAll("button.chip").forEach((b) => {
          b.setAttribute("aria-pressed", b === btn ? "true" : "false");
        });
        render();
      });
    }

    bindChips($("forms"), "form");
    bindChips($("topics"), "topic");
    qEl.addEventListener("input", render);
    sortEl.addEventListener("change", render);
    render();

    window.__catalogFilter = { applyFilters, items, formName, topicName };
  }

  if (isFileProtocol()) {
    showError(
      "请不要直接用浏览器打开 index.html。本页需要通过本地服务器读取 data/catalog.json。",
      "<p>在项目根目录运行 <code>python3 -m http.server 4173</code>，然后打开 <a href=\"http://127.0.0.1:4173/\">http://127.0.0.1:4173/</a>。</p>"
    );
    $("subtitle").textContent = "需要本地预览服务器";
    return;
  }

  fetch(DATA_URL)
    .then((res) => {
      if (!res.ok) throw new Error("HTTP " + res.status);
      return res.json();
    })
    .then(boot)
    .catch((err) => {
      console.error(err);
      showError("目录数据加载失败：" + (err && err.message ? err.message : String(err)));
      $("subtitle").textContent = "目录加载失败";
    });
})();
