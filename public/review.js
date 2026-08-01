(function () {
  "use strict";

  const archive = window.VIRETH_PUBLIC_READING;
  const storageKey = "vireth-start-reading-progress-v1";
  const scenarioList = document.getElementById("scenarioList");
  const scenarioView = document.getElementById("scenarioView");
  const saveStatus = document.getElementById("saveStatus");
  const overallProgressLabel = document.getElementById("overallProgressLabel");
  const overallProgressBar = document.getElementById("overallProgressBar");

  let activeFlowId = "";
  let activeDocumentId = "";
  let state = loadState();
  let saveTimer = null;

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function icon(name, className = "") {
    return `<img class="icon${className ? ` ${className}` : ""}" src="assets/icons/${escapeHtml(name)}.svg" alt="" aria-hidden="true">`;
  }

  function flowTypeLabel(type) {
    if (type === "기본 시작상황") return "자유 여행자로 시작";
    if (type === "완성형 시작상황") return "역할을 골라 시작";
    if (type === "확장 시작역할") return "생활 속 역할로 시작";
    return type;
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved && saved.schemaVersion === 1 && saved.readByFlow) return saved;
    } catch (error) {
      console.warn("읽음 표시를 불러오지 못했습니다.", error);
    }
    return {
      schemaVersion: 1,
      readByFlow: {}
    };
  }

  function flowById(id) {
    return archive.startReading.readingFlows.find((flow) => flow.id === id);
  }

  function documentById(id) {
    return archive.documents.find((document) => document.id === id);
  }

  function readIdsFor(flow) {
    if (!Array.isArray(state.readByFlow[flow.id])) state.readByFlow[flow.id] = [];
    return state.readByFlow[flow.id];
  }

  function isRead(flow, documentId) {
    return readIdsFor(flow).includes(documentId);
  }

  function flowIsComplete(flow) {
    return flow.documentIds.every((id) => isRead(flow, id));
  }

  function persistState(message) {
    localStorage.setItem(storageKey, JSON.stringify(state));
    saveStatus.textContent = message;
    window.clearTimeout(saveTimer);
    saveTimer = window.setTimeout(() => {
      saveStatus.textContent = "읽음 표시는 이 브라우저에 저장됩니다";
    }, 1600);
    renderScenarioList();
    renderOverallProgress();
  }

  function formatLength(value) {
    return new Intl.NumberFormat("ko-KR").format(value);
  }

  function placeIllustrations(article, illustrations) {
    const paragraphs = Array.from(article.querySelectorAll(":scope > p"));
    for (const illustration of illustrations || []) {
      const figure = document.createElement("figure");
      figure.className = "document-illustration";
      figure.dataset.aspectRatio = illustration.aspectRatio || "3:2";

      const image = document.createElement("img");
      image.src = illustration.asset;
      image.alt = illustration.alt || "";
      image.loading = "lazy";
      image.decoding = "async";
      figure.append(image);

      const paragraphIndex = Math.max(0, Number(illustration.afterParagraph || 1) - 1);
      const anchor = paragraphs[Math.min(paragraphIndex, paragraphs.length - 1)];
      if (anchor) anchor.insertAdjacentElement("afterend", figure);
      else article.append(figure);
    }
  }

  function renderOverallProgress() {
    const flows = archive.startReading.readingFlows;
    const completeCount = flows.filter(flowIsComplete).length;
    overallProgressLabel.textContent = `${completeCount} / ${flows.length} 장면 읽기 완료`;
    overallProgressBar.style.setProperty("--progress", `${(completeCount / flows.length) * 100}%`);
  }

  function renderScenarioList() {
    scenarioList.innerHTML = archive.startReading.readingFlows.map((flow, index) => {
      const readCount = flow.documentIds.filter((id) => isRead(flow, id)).length;
      const complete = readCount === flow.documentIds.length;
      const active = flow.id === activeFlowId;
      const stateLabel = complete ? "네 편 모두 읽음" : readCount ? `${readCount}편 읽음` : "읽기 전";
      return `
        <button
          id="flow-tab-${escapeHtml(flow.id)}"
          class="scenario-button${active ? " is-active" : ""}"
          type="button"
          role="tab"
          aria-selected="${active}"
          aria-controls="scenarioView"
          tabindex="${active ? "0" : "-1"}"
          data-flow-id="${escapeHtml(flow.id)}"
        >
          <img class="scenario-image" src="${escapeHtml(flow.image)}" alt="">
          <span class="scenario-overlay" aria-hidden="true"></span>
          <span class="scenario-content">
            <span class="scenario-meta">${String(index + 1).padStart(2, "0")} · ${escapeHtml(flowTypeLabel(flow.type))}</span>
            <strong>${escapeHtml(flow.title)}</strong>
            <span class="scenario-progress">${complete ? icon("circle-check-big") : icon("book-open")}${escapeHtml(stateLabel)}</span>
          </span>
        </button>
      `;
    }).join("");

    const buttons = Array.from(scenarioList.querySelectorAll("[data-flow-id]"));
    buttons.forEach((button, index) => {
      button.addEventListener("click", () => openFlow(button.dataset.flowId, true));
      button.addEventListener("keydown", (event) => {
        let nextIndex = index;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") nextIndex = (index + 1) % buttons.length;
        else if (event.key === "ArrowLeft" || event.key === "ArrowUp") nextIndex = (index - 1 + buttons.length) % buttons.length;
        else if (event.key === "Home") nextIndex = 0;
        else if (event.key === "End") nextIndex = buttons.length - 1;
        else return;
        event.preventDefault();
        buttons[nextIndex].focus();
        openFlow(buttons[nextIndex].dataset.flowId, true);
      });
    });
  }

  function renderScenario(flow) {
    const readCount = flow.documentIds.filter((id) => isRead(flow, id)).length;
    const documentRows = flow.documentIds.map((id, index) => {
      const sourceDocument = documentById(id);
      const read = isRead(flow, id);
      const isOpen = activeDocumentId === id;
      const buttonLabel = isOpen ? "읽는 중" : read ? "다시 읽기" : "읽어보기";
      return `
        <article class="document-row${read ? " is-read" : ""}${isOpen ? " is-open" : ""}" data-document-row="${escapeHtml(id)}">
          <span class="document-order">${String(index + 1).padStart(2, "0")}</span>
          <div class="document-info">
            <strong>${escapeHtml(sourceDocument.title)}</strong>
            <span>${escapeHtml(sourceDocument.form)} · 본문 ${formatLength(sourceDocument.characterCount)}자${read ? " · 읽음" : ""}</span>
          </div>
          <button class="open-document" type="button" data-open-document="${escapeHtml(id)}">
            ${icon(isOpen ? "book-open" : "eye")}
            <span>${buttonLabel}</span>
          </button>
        </article>
      `;
    }).join("");

    scenarioView.innerHTML = `
      <section class="scenario-detail" role="tabpanel" aria-labelledby="flow-tab-${escapeHtml(flow.id)}">
        <header class="scenario-header">
          <img src="${escapeHtml(flow.image)}" alt="${escapeHtml(flow.imageAlt)}">
          <div class="scenario-copy">
            <p class="scenario-type">${icon("map-pinned")}${escapeHtml(flowTypeLabel(flow.type))}</p>
            <h2>${escapeHtml(flow.title)}</h2>
            <p class="scenario-role">${escapeHtml(flow.role)}</p>
            <p class="scenario-problem">${escapeHtml(flow.problem)}</p>
            <p class="scenario-invitation">${escapeHtml(flow.invitation)}</p>
          </div>
        </header>

        <section class="document-section" aria-labelledby="documentSectionTitle">
          <div class="section-heading">
            <div>
              <p class="section-kicker">FOLLOW THE RECORDS</p>
              <h3 id="documentSectionTitle">이 장면에서 이어 읽기</h3>
              <p>편지와 장부, 사건 기록을 차례로 열어 상황의 단서를 찾아보세요.</p>
            </div>
            <p class="document-count">${readCount} / ${flow.documentIds.length} 읽음</p>
          </div>
          <div class="document-stack">${documentRows}</div>

          <section id="readerPanel" class="reader-panel" hidden aria-label="기록 읽기">
            <div class="reader-toolbar">
              <span id="readerPosition" class="reader-position"></span>
              <div class="reader-actions">
                <button id="previousDocument" type="button" aria-label="이전 기록" title="이전 기록">${icon("arrow-left")}</button>
                <button id="nextDocument" type="button" aria-label="다음 기록" title="다음 기록">${icon("arrow-right")}</button>
                <button id="closeDocument" type="button" aria-label="기록 닫기" title="기록 닫기">${icon("x")}</button>
              </div>
            </div>
            <article id="readerDocument" class="reader-document"></article>
            <aside id="readerReferences" class="reader-references" aria-labelledby="readerReferencesTitle">
              <div class="references-heading">
                ${icon("sparkles")}
                <div>
                  <p>AFTER READING</p>
                  <h2 id="readerReferencesTitle">읽고 나서 참고</h2>
                </div>
              </div>
              <section id="readerGuide" class="reader-guide" aria-labelledby="readerGuideName">
                <div class="reader-guide-portrait">
                  <img id="readerGuidePortrait" src="" alt="">
                </div>
                <div class="reader-guide-copy">
                  <p id="readerGuideLabel" class="reader-guide-label"></p>
                  <h3 id="readerGuideName"></h3>
                  <p id="readerGuideSummary" class="reader-guide-summary"></p>
                </div>
              </section>
              <div class="references-intro">
                <strong>낯선 말 찾아보기</strong>
                <span>시간, 돈, 절차처럼 처음 만나는 표현만 쉬운 말로 덧붙였습니다.</span>
              </div>
              <ul id="readerReferenceList"></ul>
            </aside>
            <div class="reader-complete">
              <p>읽음 표시는 현재 브라우저에만 남습니다.</p>
              <button id="markReadButton" class="primary-button" type="button"></button>
            </div>
          </section>
        </section>

        <footer class="closing-band">
          <strong>네 편을 읽은 뒤</strong>
          <p>어떤 기록이 지금의 선택에 가장 도움이 됐는지 떠올려 보세요. 장면을 바꾸면 다른 네 편으로 이어집니다.</p>
        </footer>
      </section>
    `;

    bindScenarioEvents(flow);
    if (activeDocumentId && flow.documentIds.includes(activeDocumentId)) {
      renderReader(flow, activeDocumentId, false);
    }
  }

  function bindScenarioEvents(flow) {
    scenarioView.querySelectorAll("[data-open-document]").forEach((button) => {
      button.addEventListener("click", () => renderReader(flow, button.dataset.openDocument, true));
    });
  }

  function renderReferences(sourceDocument) {
    const guide = sourceDocument.guide;
    const guideAssets = {
      ren: "assets/story-guides/ren-ending-guide.png",
      duran: "assets/story-guides/duran-ending-guide.png"
    };
    const references = document.getElementById("readerReferences");
    const guidePanel = document.getElementById("readerGuide");
    const guidePortrait = document.getElementById("readerGuidePortrait");
    references.dataset.guideId = guide.id;
    guidePanel.dataset.guideId = guide.id;
    guidePortrait.src = guideAssets[guide.id];
    guidePortrait.alt = `${guide.name}, ${guide.label}`;
    document.getElementById("readerGuideLabel").textContent = guide.label;
    document.getElementById("readerGuideName").textContent = guide.name;
    document.getElementById("readerGuideSummary").textContent = guide.summary;

    const referenceList = document.getElementById("readerReferenceList");
    referenceList.innerHTML = (sourceDocument.references || []).map((reference) => `
      <li>
        <strong>${escapeHtml(reference.term)}</strong>
        <p>${escapeHtml(reference.explanation)}</p>
      </li>
    `).join("");
  }

  function updateMarkButton(button, read) {
    button.innerHTML = `${icon(read ? "rotate-ccw" : "check")}<span>${read ? "읽음 취소" : "읽음으로 표시"}</span>`;
    button.setAttribute("aria-label", read ? "이 기록의 읽음 표시 취소" : "이 기록을 읽음으로 표시");
  }

  function renderReader(flow, documentId, shouldScroll) {
    const sourceDocument = documentById(documentId);
    if (!sourceDocument) return;
    activeDocumentId = documentId;
    const position = flow.documentIds.indexOf(documentId);
    const panel = document.getElementById("readerPanel");
    panel.hidden = false;
    document.getElementById("readerPosition").textContent = `${position + 1} / ${flow.documentIds.length} · ${sourceDocument.title}`;
    const readerDocument = document.getElementById("readerDocument");
    readerDocument.innerHTML = sourceDocument.html;
    readerDocument.dataset.frameId = sourceDocument.visual.frameId;
    readerDocument.style.setProperty("--document-frame", `url("${sourceDocument.visual.frame}")`);
    placeIllustrations(readerDocument, sourceDocument.visual.illustrations);
    renderReferences(sourceDocument);

    const markButton = document.getElementById("markReadButton");
    updateMarkButton(markButton, isRead(flow, documentId));
    document.getElementById("previousDocument").disabled = position === 0;
    document.getElementById("nextDocument").disabled = position === flow.documentIds.length - 1;
    document.getElementById("previousDocument").onclick = () => renderReader(flow, flow.documentIds[position - 1], true);
    document.getElementById("nextDocument").onclick = () => renderReader(flow, flow.documentIds[position + 1], true);
    document.getElementById("closeDocument").onclick = () => {
      activeDocumentId = "";
      renderScenario(flow);
      document.querySelector("[data-document-row]")?.scrollIntoView({ behavior: "smooth", block: "center" });
    };
    markButton.onclick = () => toggleRead(flow, documentId);

    scenarioView.querySelectorAll("[data-document-row]").forEach((row) => {
      const id = row.dataset.documentRow;
      const isOpen = id === documentId;
      row.classList.toggle("is-open", isOpen);
      const button = row.querySelector(".open-document");
      const label = isOpen ? "읽는 중" : isRead(flow, id) ? "다시 읽기" : "읽어보기";
      button.innerHTML = `${icon(isOpen ? "book-open" : "eye")}<span>${label}</span>`;
    });
    if (shouldScroll) readerDocument.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function toggleRead(flow, documentId) {
    const readIds = readIdsFor(flow);
    if (readIds.includes(documentId)) {
      state.readByFlow[flow.id] = readIds.filter((id) => id !== documentId);
      persistState("읽음 표시를 취소했습니다");
    } else {
      readIds.push(documentId);
      persistState("읽음으로 표시했습니다");
    }
    renderScenario(flow);
    renderReader(flow, documentId, false);
  }

  function openFlow(flowId, updateHash) {
    const flow = flowById(flowId);
    if (!flow) return;
    activeFlowId = flow.id;
    activeDocumentId = "";
    renderScenarioList();
    renderScenario(flow);
    renderOverallProgress();
    if (updateHash) history.replaceState(null, "", `#scenario=${encodeURIComponent(flow.id)}`);
  }

  function routeInitialFlow() {
    const match = window.location.hash.match(/^#scenario=(.+)$/);
    const requested = match ? decodeURIComponent(match[1]) : "";
    const flow = flowById(requested) || archive.startReading.readingFlows[0];
    openFlow(flow.id, !window.location.hash);
  }

  window.addEventListener("hashchange", () => {
    if (/^#scenario=/.test(window.location.hash)) routeInitialFlow();
  });

  if (!archive?.startReading?.readingFlows?.length) {
    scenarioView.innerHTML = "<p>읽을 이야기를 불러오지 못했습니다.</p>";
    return;
  }

  document.title = archive.project.name;
  saveStatus.textContent = "읽음 표시는 이 브라우저에 저장됩니다";
  renderOverallProgress();
  routeInitialFlow();
})();
