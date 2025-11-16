// assets/js/index.js
document.addEventListener("DOMContentLoaded", function () {
  // ===== DOM 참조 =====
  const container       = document.getElementById("allCards");
  const loadMoreBtn     = document.getElementById("loadMoreBtn");
  const scrollTopBtn    = document.getElementById("scrollTopBtn");
  const searchInput     = document.getElementById("searchInput");
  const searchBtn       = document.getElementById("searchBtn");
  const cardCountEl     = document.getElementById("cardCount");
  const toggleSortBtn   = document.getElementById("toggleSortBtn");
  const hamburgerBtn    = document.getElementById("hamburgerBtn");
  const closeSidebarBtn = document.getElementById("closeSidebarBtn");
  const sidebar         = document.querySelector(".sidebar");
  const categoryTitleEl = document.getElementById("categoryTitle");

  // 필터 버튼
  const yearBtn = document.getElementById("yearFilter");
  const monthBtn = document.getElementById("monthFilter");
  const subtagBtn = document.getElementById("subTagFilter");


  // ===== 상태 =====
  let currentIndex = 0;
  let batchSize    = getBatchSize();
  let sortOrder    = "newest";
  let all = [];
  let filtered = [];

  // 활성 필터 상태
  const activeFilters = {
    year: null,      // number | 'predebut' | null
    month: null,     // 1~12 | null (아직 훅만)
    subtag: null     // string | null (아직 훅만)
  };

  // ===== 유틸 =====
  function getBatchSize() {
    if (window.innerWidth >= 2560) return 30; // 5열
    return 24;                                 // 4열
  }

  window.addEventListener("resize", () => {
    const newBatchSize = getBatchSize();
    if (newBatchSize !== batchSize) {
      batchSize = newBatchSize;
      sortAndRender();
    }
  });

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

  const categoryKorean = {
    null: "전체 영상",
    "Releases": "Releases",
    "Broadcast_Stage": "Broadcast Stage",
    "Official_Channel": "Official Channel",
    "Original_Variety": "Original Variety",
    "Recording_Behind": "Recording Behind",
    "Special_Releases": "Special Releases",
    "Festival_Stage": "Festival Stage",
    "Media_Performance": "Media Performance",
    "Media_Content": "Media Content",
    "Live_Streams": "Live Streams",
    "Radio_Podcast": "Radio & Podcast",
    "Interviews": "Interviews",
    "Commercials": "Commercials",
    "Etc": "Etc",
    "Shorts": "Shorts"
  };

  function getCurrentCategory() {
    const params = new URLSearchParams(window.location.search);
    return params.get("category") || null;
  }

  // 모든 데이터 미리 합치기 (전체 페이지용)
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

  // 카테고리별 스크립트 로드
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
        if (Array.isArray(cards)) resolve(cards);
        else reject(new Error(`데이터 로드 실패: ${category}`));
      };

      script.onerror = () => reject(new Error(`스크립트 로드 실패: ${category}`));
      document.body.appendChild(script);
    });
  }

  function updateCardCount(count) {
    cardCountEl.textContent = `총 ${count}개`;
  }

  function formatDateYYMMDD(dateStr) {
    if (!dateStr) return "";
    const onlyDate = dateStr.split(/[ T]/)[0];
    const [year, month, day] = onlyDate.includes("-")
      ? onlyDate.split("-")
      : [onlyDate.slice(0,4), onlyDate.slice(4,6), onlyDate.slice(6,8)];
    if (!year || !month || !day) return dateStr;
    return year.slice(2) + month + day;
  }

  // 날짜 파싱 유틸 (연/월)
  function extractYear(dateStr) {
    if (!dateStr) return null;
    const m = String(dateStr).match(/^(\d{4})|^(\d{2})(\d{2})(\d{2})/);
    if (m && m[1]) return parseInt(m[1], 10);
    // 20250823 같은 형식
    if (/^\d{8}$/.test(dateStr)) return parseInt(dateStr.slice(0, 4), 10);
    // 안전 fallback
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : d.getFullYear();
  }

  function extractMonth(dateStr) {
    if (!dateStr) return null;
    // 2025-08-23
    const mDash = String(dateStr).match(/^\d{4}-(\d{2})-/);
    if (mDash) return parseInt(mDash[1], 10);
    // 20250823
    if (/^\d{8}$/.test(dateStr)) return parseInt(dateStr.slice(4, 6), 10);
    // fallback
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? null : (d.getMonth() + 1);
  }

  // 검색 + 필터 결합
  function applySearch() {
    const normalize = (str) =>
      String(str || "")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}]+/gu, "")
        .replace(/\s+/g, "");

    const rawKeywords = String(searchInput.value || "")
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .split(/\s+/)
      .filter(Boolean);
    const keywords = rawKeywords.map((k) => normalize(k));

    filtered = all.filter((c) => {
      // 1) 필터 통과?
      if (!passesFilters(c)) return false;

      // 2) 검색어 체크
      if (keywords.length === 0) return true;
      const combinedText = normalize(
        (c.title || "") + (c.member || "") + (c.note || "") + (c.date || "")
      );
      return keywords.every((k) => combinedText.includes(k));
    });

    sortAndRender();
    
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function passesFilters(card) {
    const y = extractYear(card.date);
    const m = extractMonth(card.date);

// 연도
if (activeFilters.year !== null) {
  if (activeFilters.year === "predebut") {
    // 카드 날짜 Date 객체 생성
    const itemDate = new Date(card.date);
    const debutDate = new Date("2018-05-02T00:00:00");

    // 데뷔일 이전(=2018-05-01까지) 만 통과
    if (!(itemDate < debutDate)) return false;

  } else {
    if (y !== activeFilters.year) return false;
  }
}
    // 월 (아직 UI 미구현이지만 훅은 살림)
    if (activeFilters.month !== null) {
      if (m !== activeFilters.month) return false;
    }
    // 서브태그 (임시: subtag || note에서 포함 검사)
    if (activeFilters.subtag !== null) {
      const sub = String(card.subtag || card.note || "").toLowerCase();
      if (!sub.includes(String(activeFilters.subtag).toLowerCase())) return false;
    }

    return true;
  }
  
  function sortAndRender() {
    filtered.sort((a, b) => {
      const dateA = new Date(a.date || "2000-01-01");
      const dateB = new Date(b.date || "2000-01-01");
      return sortOrder === "oldest" ? dateA - dateB : dateB - dateA;
    });

    currentIndex = 0;
    renderCards(filtered);
  }

  function simplifyDuration(duration) {
  if (!duration) return "";
  // 00:04:40 → 4:40
  // 01:04:40 → 1:04:40 (그대로)
  // 04:40 → 4:40 (그대로)
  if (/^00:\d{2}:\d{2}$/.test(duration)) {
    return duration.slice(3); // "00:" 제거
  }
  return duration;
}

function renderCards(cards) {
  container.innerHTML = "";
  cards.slice(0, currentIndex + batchSize).forEach((data) => {
    const card = document.createElement("a");
    card.className = "card";
    card.innerHTML = `
      <div class="thumbnail-wrapper">
        <img src="${data.thumbnail || ""}" alt="${data.alt || data.title}" loading="lazy">
        <div class="duration-overlay">${simplifyDuration(data.duration)}</div>
      </div>
      <div class="card-title">${data.title}</div>
      <div class="card-meta">
        ${[
          data.date ? formatDateYYMMDD(data.date) : "",
          data.member || "",
          data.note || "",
        ].filter(Boolean).join(" ")}
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
        if (u.startsWith("http://")) { img.src = u.replace("http://", "https://"); return; }
        if (u.includes("/maxresdefault.jpg")) { img.src = u.replace("/maxresdefault.jpg", "/sddefault.jpg"); return; }
        if (u.includes("/sddefault.jpg")) { img.src = u.replace("/sddefault.jpg", "/hqdefault.jpg"); return; }
        if (u.includes("/hqdefault.jpg")) { img.src = u.replace("/hqdefault.jpg", "/mqdefault.jpg"); return; }
        if (u.includes("/mqdefault.jpg")) { img.src = u.replace("/mqdefault.jpg", "/default.jpg"); return; }
        img.src = "images/placeholder-thumb.jpg";
      };
    });

    currentIndex += batchSize;
    loadMoreBtn.style.display = currentIndex >= cards.length ? "none" : "block";
    updateCardCount(cards.length);
  }

  // ===== 정렬 & 검색 =====
  toggleSortBtn.addEventListener("click", () => {
    sortOrder = sortOrder === "newest" ? "oldest" : "newest";
    toggleSortBtn.textContent = sortOrder === "newest" ? "최신순" : "오래된순";
    sortAndRender();
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  loadMoreBtn.addEventListener("click", () => {
    renderCards(filtered);
  });

  searchBtn.addEventListener("click", applySearch);
  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applySearch();
  });

  // ===== 스크롤 탑 =====
  scrollTopBtn.addEventListener("touchend", (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: "auto" });
  }, { passive: false });

  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "auto" });
  });

  // ===== 사이드바 =====
  hamburgerBtn.addEventListener("click", () => {
    sidebar.classList.add("open");
    hamburgerBtn.style.display = "none";
  });

  closeSidebarBtn.addEventListener("click", () => {
    sidebar.classList.remove("open");
    hamburgerBtn.style.display = "flex";
  });

  // 카테고리 클릭 시 라우팅 & 닫기
  document.querySelectorAll(".sidebar a").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      const category = new URL(link.href).searchParams.get("category");
      sidebar.classList.remove("open");
      hamburgerBtn.style.display = "flex";
      history.pushState({ category }, "", `?category=${category}`);
      initCategory(category);
      window.scrollTo(0, 0); // ← 카테고리 변경 후 즉시 최상단
    });
  });

  window.addEventListener("popstate", () => {
    initCategory(getCurrentCategory());
    window.scrollTo(0, 0); // ← 히스토리 이동 시에도 즉시 최상단
  });

  // ===== 필터 메뉴(공용) 구성 =====
  const filterMenu = document.createElement("div");
  filterMenu.style.position = "absolute";
  filterMenu.style.minWidth = "160px";
  filterMenu.style.background = "#222";
  filterMenu.style.border = "1px solid #333";
  filterMenu.style.borderRadius = "10px";
  filterMenu.style.padding = "8px";
  filterMenu.style.boxShadow = "0 8px 20px rgba(0,0,0,0.35)";
  filterMenu.style.zIndex = "2000";
  filterMenu.style.display = "none";
  document.body.appendChild(filterMenu);

  function openFilterMenu(anchorBtn, type) {
    // 내용 생성
    filterMenu.innerHTML = "";
    const makeItem = (label, value) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.textContent = label;
      btn.style.display = "block";
      btn.style.width = "100%";
      btn.style.textAlign = "left";
      btn.style.padding = "8px 10px";
      btn.style.margin = "2px 0";
      btn.style.background = "#2a2a2a";
      btn.style.border = "none";
      btn.style.borderRadius = "6px";
      btn.style.color = "#fff";
      btn.style.cursor = "pointer";
      btn.onmouseenter = () => (btn.style.background = "#404040");
      btn.onmouseleave = () => (btn.style.background = "#2a2a2a");
      btn.onclick = () => {
        applyFilterSelection(type, label, value);
        closeFilterMenu();
      };
      return btn;
    };

    if (type === "year") {
      const years = ["전체", "2025","2024","2023","2022","2021","2020","2019","2018","Pre-debut"];
      years.forEach((y) => {
        let val = null;
        if (y === "전체") val = null;
        else if (y === "Pre-debut") val = "predebut";
        else val = parseInt(y, 10);
        filterMenu.appendChild(makeItem(y, val));
      });
    } else if (type === "month") {
      // 훅만 제공 (원하면 나중에 옵션 구성)
      const months = ["전체",1,2,3,4,5,6,7,8,9,10,11,12];
      months.forEach((m)=> {
        filterMenu.appendChild(makeItem(String(m), m==="전체"?null:m));
      });
    } else if (type === "subtag") {
      const subtagOptionsMap = {
      "Releases": ["전체", "MV", "Special Clip", "Audio Track"],
      "Broadcast_Stage": ["전체", "음악방송", "쇼케이스", "특집"],
      "Official_Channel": ["전체", "아이톡 | I-TALK", "해시톡 | HASHTALK", "아이로그 | I-LOG", "라이브 H/L | I-LIVE H/L", "비하인드 외전 | Extra Behind", "프로모션 | Comeback Promotion",
      "퍼포먼스 | Performance", "커버곡 | Cover", "스페셜컨텐츠 | Special Content", "응원법 | Fan Chant", "기타 | Etc"],
      "Original_Variety": ["전체", "음악방송", "쇼케이스", "특집"],
      "Recording_Behind": ["전체", "음악방송", "쇼케이스", "특집"],
      "Special_Releases": ["전체", "음악방송", "쇼케이스", "특집"],
      "Festival_Stage": ["전체", "음악방송", "쇼케이스", "특집"],
      "Media_Performance": ["전체", "음악방송", "쇼케이스", "특집"],
      "Media_Content": ["전체", "음악방송", "쇼케이스", "특집"],
      "Live_Streams": ["전체", "음악방송", "쇼케이스", "특집"],
      "Radio_Podcast": ["전체", "음악방송", "쇼케이스", "특집"],
      "Interviews": ["전체", "음악방송", "쇼케이스", "특집"],
      "Commercials": ["전체", "음악방송", "쇼케이스", "특집"],
      "Etc": ["전체", "음악방송", "쇼케이스", "특집"],
      "Shorts": ["전체", "음악방송", "쇼케이스", "특집"]
  };

  let currentCategory = getCurrentCategory() || "";
  currentCategory = currentCategory.trim();

  // 대소문자 불일치 방지
  const matchedKey = Object.keys(subtagOptionsMap).find(
    key => key.toLowerCase() === currentCategory.toLowerCase()
  );

  const subtagList = matchedKey ? subtagOptionsMap[matchedKey] : ["전체"];

  subtagList.forEach((s) => {
    filterMenu.appendChild(makeItem(s, s === "전체" ? null : s));
  });
}
    // 위치
    const rect = anchorBtn.getBoundingClientRect();
    const top = window.scrollY + rect.bottom + 8;
    const left = window.scrollX + rect.left;
    filterMenu.style.top = `${top}px`;
    filterMenu.style.left = `${left}px`;

    filterMenu.style.display = "block";
  }

  function closeFilterMenu() {
    filterMenu.style.display = "none";
  }

  document.addEventListener("click", (e) => {
    if (filterMenu.style.display === "none") return;
    if (!filterMenu.contains(e.target) &&
        e.target !== yearBtn && e.target !== monthBtn && e.target !== subtagBtn) {
      closeFilterMenu();
    }
  });

  function applyFilterSelection(type, label, value) {
    if (type === "year") {
      activeFilters.year = value;
      yearBtn.textContent = value === null ? "연도" : `${label}`;
    } else if (type === "month") {
      activeFilters.month = value;
      monthBtn.textContent = value === null ? "월" : `${label}`;
    } else if (type === "subtag") {
      activeFilters.subtag = value;
      subtagBtn.textContent = value === null ? "전체" : `${label}`;
    }
    applySearch();
  }

  // 버튼 열기
  yearBtn?.addEventListener("click", (e) => openFilterMenu(e.currentTarget, "year"));
  monthBtn?.addEventListener("click", (e) => openFilterMenu(e.currentTarget, "month"));
  subtagBtn?.addEventListener("click", (e) => openFilterMenu(e.currentTarget, "subtag"));

function initCategory(category) {

  // 🔹 placeholder 문구 동적 변경 추가
  if (searchInput) {
    if (!category) {
      searchInput.placeholder = "전체 영상에서 검색";
    } else {
      searchInput.placeholder = `${categoryKorean[category] ?? category} 내에서 검색`;
    }
  }

  // 타이틀
  if (categoryTitleEl) {
    categoryTitleEl.textContent = categoryKorean[category] ?? "전체 영상";
  }

    // 필터 초기화
    activeFilters.year   = null;
    activeFilters.month  = null;
    activeFilters.subtag = null;
    if (yearBtn)   yearBtn.textContent   = "연도";
    if (monthBtn)  monthBtn.textContent  = "월";
    if (subtagBtn) subtagBtn.textContent = "서브태그";

  // 🔹 검색어 및 정렬 초기화 (추가)
  if (searchInput) searchInput.value = "";
  sortOrder = "newest";
  toggleSortBtn.textContent = "최신순";

    if (!category) {
      all = loadAllData();
      filtered = [...all];
      sortAndRender();
    } else {
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

const homeBtn = document.getElementById("homeBtn");
homeBtn?.addEventListener("click", () => {
  window.location.href = window.location.origin; // 메인 URL로 이동
});


document.getElementById("homeBtn").addEventListener("click", function () {
  window.location.href = "/index.html";
  window.scrollTo({ top: 0, behavior: "auto" });
});


document.querySelectorAll(".sidebar nav a").forEach(a => {
  a.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "auto" });
  });
});

