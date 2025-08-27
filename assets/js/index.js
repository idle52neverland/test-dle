// index.js
document.addEventListener("DOMContentLoaded", function () {
  const container = document.getElementById("allCards");
  const loadMoreBtn = document.getElementById("loadMoreBtn");
  const scrollTopBtn = document.getElementById("scrollTopBtn");
  const searchInput = document.getElementById("searchInput");
  const searchBtn = document.getElementById("searchBtn");
  const cardCountEl = document.getElementById("cardCount");
  const toggleSortBtn = document.getElementById("toggleSortBtn");
  const hamburgerBtn = document.getElementById("hamburgerBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const sidebar = document.querySelector(".sidebar");

  let currentIndex = 0;
  const batchSize = 18;
  let sortOrder = "newest";
  let all = [];
  let filtered = [];

  // 카테고리명 → 변수명 매핑 테이블
  const categoryMap = {
    "Releases": "releasesCards",
    "Broadcast_Stage": "broadcastStageCards",
    "Official_Channel": "officialChannelCards",
    "Original_Variety": "originalVarietyCards",
    "Recording_Behind": "recordingBehindCards",
    "Special_Releases": "specialReleasesCards",
    "Festival_Stage": "festivalStageCards",
    "Media_Performance": "mediaPerformanceCards",
    "Media_Content": "mediaContentCards",
    "Live_Streams": "liveStreamsCards",
    "Radio_Podcast": "radioPodcastCards",
    "Interviews": "interviewsCards",
    "Commercials": "commercialsCards",
    "Etc": "etcCards",
    "Shorts": "shortsCards"
  };

  // URL에서 카테고리 가져오기
  function getCurrentCategory() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || null;
  }

  // 모든 데이터 합치기 (전체 모드)
  function loadAllData() {
    return [].concat(
      typeof releasesCards !== 'undefined' ? releasesCards : [],
      typeof broadcastStageCards !== 'undefined' ? broadcastStageCards : [],
      typeof officialChannelCards !== 'undefined' ? officialChannelCards : [],
      typeof originalVarietyCards !== 'undefined' ? originalVarietyCards : [],
      typeof recordingBehindCards !== 'undefined' ? recordingBehindCards : [],
      typeof specialReleasesCards !== 'undefined' ? specialReleasesCards : [],
      typeof festivalStageCards !== 'undefined' ? festivalStageCards : [],
      typeof mediaPerformanceCards !== 'undefined' ? mediaPerformanceCards : [],
      typeof mediaContentCards !== 'undefined' ? mediaContentCards : [],
      typeof liveStreamsCards !== 'undefined' ? liveStreamsCards : [],
      typeof radioPodcastCards !== 'undefined' ? radioPodcastCards : [],
      typeof interviewsCards !== 'undefined' ? interviewsCards : [],
      typeof commercialsCards !== 'undefined' ? commercialsCards : [],
      typeof etcCards !== 'undefined' ? etcCards : [],
      typeof shortsCards !== 'undefined' ? shortsCards : []
    );
  }

  // 특정 카테고리 데이터 로드
  function loadCategoryData(category) {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = `data/cards-${category}.js`;

      script.onload = () => {
        const varName = categoryMap[category];
        if (!varName) {
          reject(new Error(`매핑되지 않은 카테고리: ${category}`));
          return;
        }
        const cards = window[varName];
        if (Array.isArray(cards)) {
          resolve(cards);
        } else {
          reject(new Error(`데이터 로드 실패: ${category}`));
        }
      };

      script.onerror = () => reject(new Error(`스크립트 로드 실패: ${category}`));
      document.body.appendChild(script);
    });
  }

  // 카드 개수 표시
  function updateCardCount(count) {
    cardCountEl.textContent = `총 ${count}개 영상`;
  }

  // 날짜 변환 (YYMMDD)
  function formatDateYYMMDD(dateStr) {
    if (!dateStr) return "";
    const onlyDate = dateStr.split(/[ T]/)[0];
    const [year, month, day] = onlyDate.split("-");
    if (!year || !month || !day) return dateStr;
    return year.slice(2) + month + day;
  }

  // 검색
  function applySearch() {
    const normalize = (str) =>
      str.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "").replace(/\s+/g, "");
    const rawKeywords = searchInput.value
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
    const keywords = rawKeywords.map((k) => normalize(k));

    filtered = all.filter((c) => {
      const combinedText = normalize(
        (c.title || "") + (c.member || "") + (c.note || "") + (c.date || "")
      );
      return keywords.every((k) => combinedText.includes(k));
    });

    sortAndRender();
  }

  // 정렬 후 렌더
  function sortAndRender() {
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || "2000-01-01");
      const dateB = new Date(b.date || "2000-01-01");
      return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
    });

    currentIndex = 0;
    renderCards(filtered);
  }

  // 카드 렌더링
  function renderCards(cards) {
    container.innerHTML = "";
    cards.slice(0, currentIndex + batchSize).forEach((data) => {
      const card = document.createElement("a");
      card.className = "card";
      card.innerHTML = `
        <div class="thumbnail-wrapper">
          <img src="${data.thumbnail || ""}" alt="${data.alt || data.title}" loading="lazy">
          <div class="duration-overlay">${data.duration || ""}</div>
        </div>
        <div class="card-title">${data.title}</div>
        <div class="card-meta">
          ${[
            data.date ? formatDateYYMMDD(data.date) : "",
            data.member || "",
            data.note || "",
          ]
            .filter(Boolean)
            .join(" ")}
        </div>
      `;
      card.addEventListener("click", (e) => {
        e.preventDefault();
        window.open(data.link, "_blank");
      });
      container.appendChild(card);

      const img = card.querySelector("img");
      img.onload = function () {
        const isVertical = img.naturalHeight > img.naturalWidth;
        img.style.objectFit = isVertical ? "contain" : "cover";
        img.style.backgroundColor = "#000";
      };
      img.onerror = function () {
        const u = img.src || "";
        if (u.startsWith("http://")) {
          img.src = u.replace("http://", "https://");
          return;
        }
        if (u.includes("/maxresdefault.jpg")) {
          img.src = u.replace("/maxresdefault.jpg", "/sddefault.jpg");
          return;
        }
        if (u.includes("/sddefault.jpg")) {
          img.src = u.replace("/sddefault.jpg", "/hqdefault.jpg");
          return;
        }
        if (u.includes("/hqdefault.jpg")) {
          img.src = u.replace("/hqdefault.jpg", "/mqdefault.jpg");
          return;
        }
        if (u.includes("/mqdefault.jpg")) {
          img.src = u.replace("/mqdefault.jpg", "/default.jpg");
          return;
        }
        img.src = "images/placeholder-thumb.jpg";
      };
    });

    currentIndex += batchSize;
    loadMoreBtn.style.display =
      currentIndex >= cards.length ? "none" : "block";
    updateCardCount(cards.length);
  }

  // 정렬 버튼
  toggleSortBtn.addEventListener("click", () => {
    sortOrder = sortOrder === "newest" ? "oldest" : "newest";
    toggleSortBtn.textContent =
      sortOrder === "newest" ? "최신순" : "오래된순";
    sortAndRender();
  });

  // 로드 모어
  loadMoreBtn.addEventListener("click", () => {
    renderCards(filtered);
  });

  // 검색 버튼
  searchBtn.addEventListener("click", applySearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applySearch();
  });

  // 맨 위로 이동
  scrollTopBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, { passive: false });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // 햄버거 & 사이드바
  hamburgerBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    hamburgerBtn.style.display = "none";
  });

  closeSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    hamburgerBtn.style.display = "flex";
  });

  // 사이드바 링크 SPA 처리
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = new URL(link.href).searchParams.get("category");
      history.pushState({ category }, "", `?category=${category}`);
      initCategory(category);
    });
  });

  // 뒤로가기/앞으로가기
  window.addEventListener("popstate", () => {
    initCategory(getCurrentCategory());
  });

  // 초기 로드
  function initCategory(category) {
    if (!category) {
      // 전체 모드
      all = loadAllData();
      filtered = [...all];
      sortAndRender();
    } else {
      // 특정 카테고리 모드
      loadCategoryData(category)
        .then((cards) => {
          all = cards;
          filtered = [...all];
          sortAndRender();
        })
        .catch((err) => {
          console.error(err);
          container.innerHTML = `<p>데이터를 불러오지 못했습니다: ${category}</p>`;
        });
    }
  }

  initCategory(getCurrentCategory());
});
