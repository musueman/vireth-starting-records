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
      saveStatus.textContent = "읽음 표시는 이 브라우저에만 저장됩니다";
    }, 1600);
    renderScenarioList();
    renderOverallProgress();
  }

  function formatLength(value) {
    return new Intl.NumberFormat("ko-KR").format(value);
  }

  function renderOverallProgress() {
    const flows = archive.startReading.readingFlows;
    const completeCount = flows.filter(flowIsComplete).length;
    overallProgressLabel.textContent = `${completeCount} / ${flows.length} 상황 읽기 완료`;
    overallProgressBar.style.setProperty("--progress", `${(completeCount / flows.length) * 100}%`);
  }

  function renderScenarioList() {
    scenarioList.innerHTML = archive.startReading.readingFlows.map((flow, index) => {
      const readCount = flow.documentIds.filter((id) => isRead(flow, id)).length;
      const complete = readCount === flow.documentIds.length;
      const started = readCount > 0;
      return `
        <button class="scenario-button${flow.id === activeFlowId ? " is-active" : ""}" type="button" data-flow-id="${escapeHtml(flow.id)}">
          <span class="scenario-number">${index + 1}</span>
          <span class="scenario-name">${escapeHtml(flow.title)}</span>
          <span class="scenario-state${complete || started ? "" : " is-empty"}" title="${complete ? "모두 읽음" : started ? `${readCount}편 읽음` : "읽기 전"}">${complete ? "✓" : started ? readCount : "·"}</span>
        </button>
      `;
    }).join("");

    scenarioList.querySelectorAll("[data-flow-id]").forEach((button) => {
      button.addEventListener("click", () => openFlow(button.dataset.flowId, true));
    });
  }

  function renderScenario(flow) {
    const readCount = flow.documentIds.filter((id) => isRead(flow, id)).length;
    const documentRows = flow.documentIds.map((id, index) => {
      const sourceDocument = documentById(id);
      const read = isRead(flow, id);
      return `
        <div class="document-row${read ? " is-read" : ""}${activeDocumentId === id ? " is-open" : ""}" data-document-row="${escapeHtml(id)}">
          <span class="document-order">${index + 1}</span>
          <div class="document-info">
            <strong>${escapeHtml(sourceDocument.title)}</strong>
            <span>${escapeHtml(sourceDocument.form)} · 본문 ${formatLength(sourceDocument.characterCount)}자${read ? " · 읽음" : ""}</span>
          </div>
          <button class="open-document" type="button" data-open-document="${escapeHtml(id)}">${activeDocumentId === id ? "읽는 중" : read ? "다시 읽기" : "읽기"}</button>
        </div>
      `;
    }).join("");

    scenarioView.innerHTML = `
      <header class="scenario-header">
        <img src="${escapeHtml(flow.image)}" alt="${escapeHtml(flow.imageAlt)}">
        <div class="scenario-copy">
          <p class="scenario-type">${escapeHtml(flow.type)}</p>
          <h2>${escapeHtml(flow.title)}</h2>
          <p class="scenario-role">${escapeHtml(flow.role)}</p>
          <p class="scenario-problem">${escapeHtml(flow.problem)}</p>
          <p class="scenario-invitation">${escapeHtml(flow.invitation)}</p>
        </div>
      </header>

      <section class="section-band" aria-labelledby="documentSectionTitle">
        <div class="section-heading">
          <div>
            <h3 id="documentSectionTitle">이 상황과 맞닿은 기록</h3>
            <p>시작 시 열람 가능한 기록 가운데, 상황을 이해하는 데 도움이 될 네 편을 골랐습니다.</p>
          </div>
          <p>${readCount} / ${flow.documentIds.length} 읽음</p>
        </div>
        <div class="document-stack">${documentRows}</div>

        <section id="readerPanel" class="reader-panel" hidden>
          <div class="reader-toolbar">
            <span id="readerPosition" class="reader-position"></span>
            <div class="reader-actions">
              <button id="previousDocument" type="button" aria-label="이전 기록" title="이전 기록">←</button>
              <button id="nextDocument" type="button" aria-label="다음 기록" title="다음 기록">→</button>
              <button id="closeDocument" type="button" aria-label="기록 닫기" title="기록 닫기">×</button>
            </div>
          </div>
          <article id="readerDocument" class="reader-document"></article>
          <div class="reader-complete">
            <p>읽음 표시는 현재 브라우저에만 남습니다.</p>
            <button id="markReadButton" class="primary-button" type="button">읽음으로 표시</button>
          </div>
        </section>
      </section>

      <section class="closing-band">
        <strong>네 편을 읽은 뒤</strong>
        <p>인상 깊었던 대목이나 이해하기 어려웠던 부분은 이 페이지를 전해 준 사람에게 편하게 이야기해 주세요.</p>
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

  function renderReader(flow, documentId, shouldScroll) {
    const sourceDocument = documentById(documentId);
    if (!sourceDocument) return;
    activeDocumentId = documentId;
    const position = flow.documentIds.indexOf(documentId);
    const panel = document.getElementById("readerPanel");
    panel.hidden = false;
    document.getElementById("readerPosition").textContent = `${position + 1} / ${flow.documentIds.length} · ${sourceDocument.title}`;
    document.getElementById("readerDocument").innerHTML = sourceDocument.html;
    const markButton = document.getElementById("markReadButton");
    markButton.textContent = isRead(flow, documentId) ? "읽음 취소" : "읽음으로 표시";
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
      row.classList.toggle("is-open", row.dataset.documentRow === documentId);
      const button = row.querySelector(".open-document");
      const id = row.dataset.documentRow;
      button.textContent = id === documentId ? "읽는 중" : isRead(flow, id) ? "다시 읽기" : "읽기";
    });
    if (shouldScroll) panel.scrollIntoView({ behavior: "smooth", block: "start" });
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
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function routeInitialFlow() {
    const match = window.location.hash.match(/^#scenario=(.+)$/);
    const requested = match ? decodeURIComponent(match[1]) : "";
    const flow = flowById(requested) || archive.startReading.readingFlows[0];
    openFlow(flow.id, !match);
  }

  if (!archive?.startReading?.readingFlows?.length) {
    scenarioView.innerHTML = "<p>읽을 기록을 불러오지 못했습니다.</p>";
    return;
  }

  document.title = `비레스 시작상황별 기록 · ${archive.project.world}`;
  saveStatus.textContent = "읽음 표시는 이 브라우저에만 저장됩니다";
  renderOverallProgress();
  routeInitialFlow();
})();
