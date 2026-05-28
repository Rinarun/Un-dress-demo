const root = document.documentElement;
const menuToggle = document.querySelector(".menu-toggle");
const drawer = document.querySelector(".drawer");
const closeBtn = document.querySelector(".drawer-close");
const backdrop = document.querySelector(".backdrop");
const drawerLinks = document.querySelectorAll(".drawer a");

function openDrawer() {
  root.classList.add("menu-open");
  menuToggle.setAttribute("aria-expanded", "true");
  drawer.setAttribute("aria-hidden", "false");
}

function closeDrawer() {
  root.classList.remove("menu-open");
  menuToggle.setAttribute("aria-expanded", "false");
  drawer.setAttribute("aria-hidden", "true");
}

function scrollToSectionFromHash(hash) {
  if (!hash || !hash.startsWith("#")) {
    return;
  }
  const target = document.querySelector(hash);
  if (!target) {
    return;
  }
  const headerHeight = document.querySelector(".site-header")?.offsetHeight ?? 0;
  const top = target.getBoundingClientRect().top + window.scrollY - headerHeight - 12;
  window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
}

menuToggle.addEventListener("click", openDrawer);
closeBtn.addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);

drawerLinks.forEach((link) => {
  link.addEventListener("click", (event) => {
    const hash = link.getAttribute("href");
    if (!hash || !hash.startsWith("#")) {
      closeDrawer();
      return;
    }
    event.preventDefault();
    closeDrawer();
    window.setTimeout(() => {
      scrollToSectionFromHash(hash);
    }, 120);
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeDrawer();
  }
});

function initLoopCarousel(carousel) {
  const viewport = carousel.querySelector(".cast-viewport");
  const track = carousel.querySelector(".cast-track");
  const section = carousel.closest(".section");
  const dots = Array.from(section?.querySelectorAll(".cast-dot") ?? []);
  const prevButton = carousel.querySelector(".cast-nav.prev");
  const nextButton = carousel.querySelector(".cast-nav.next");
  const originalSlides = Array.from(track.querySelectorAll(".cast-slide"));

  if (!viewport || !track || originalSlides.length === 0) {
    return;
  }

  if (originalSlides.length > 1) {
    const firstClone = originalSlides[0].cloneNode(true);
    const lastClone = originalSlides[originalSlides.length - 1].cloneNode(true);
    firstClone.dataset.clone = "true";
    lastClone.dataset.clone = "true";
    track.appendChild(firstClone);
    track.insertBefore(lastClone, originalSlides[0]);
  }

  const slides = Array.from(track.querySelectorAll(".cast-slide"));
  let current = originalSlides.length > 1 ? 1 : 0;
  let snapTimer = null;
  let autoTimer = null;
  let isCarouselVisible = true;

  function getCenteredLeft(slide) {
    return slide.offsetLeft - (viewport.clientWidth - slide.clientWidth) / 2;
  }

  function toRealIndex(slideIndex) {
    if (originalSlides.length <= 1) {
      return 0;
    }
    if (slideIndex === 0) {
      return originalSlides.length - 1;
    }
    if (slideIndex === slides.length - 1) {
      return 0;
    }
    return slideIndex - 1;
  }

  function updateDots(activeSlideIndex) {
    const realIndex = toRealIndex(activeSlideIndex);
    dots.forEach((dot, dotIndex) => {
      dot.classList.toggle("is-active", dotIndex === realIndex);
    });
    slides.forEach((slide, slideIndex) => {
      slide.classList.toggle("is-current", slideIndex === activeSlideIndex);
    });
  }

  function scrollToCurrent(behavior = "smooth") {
    viewport.scrollTo({ left: getCenteredLeft(slides[current]), behavior });
    updateDots(current);
  }

  function normalizeLoop() {
    if (originalSlides.length <= 1) {
      return;
    }
    if (current === 0) {
      current = slides.length - 2;
      scrollToCurrent("auto");
    } else if (current === slides.length - 1) {
      current = 1;
      scrollToCurrent("auto");
    }
  }

  function goTo(index, behavior = "smooth") {
    if (index < 0) {
      current = slides.length - 1;
    } else if (index > slides.length - 1) {
      current = 0;
    } else {
      current = index;
    }
    scrollToCurrent(behavior);
  }

  function syncCurrentFromScroll() {
    const center = viewport.scrollLeft + viewport.clientWidth / 2;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;

    slides.forEach((slide, index) => {
      const slideCenter = slide.offsetLeft + slide.clientWidth / 2;
      const distance = Math.abs(slideCenter - center);
      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestIndex = index;
      }
    });

    if (nearestIndex !== current) {
      current = nearestIndex;
      updateDots(current);
    }

    if (snapTimer) {
      clearTimeout(snapTimer);
    }
    snapTimer = setTimeout(() => {
      if (current === 0 || current === slides.length - 1) {
        normalizeLoop();
      } else {
        scrollToCurrent("smooth");
      }
    }, 120);
  }

  function startAuto() {
    if (originalSlides.length <= 1 || !isCarouselVisible) {
      return;
    }
    if (autoTimer) {
      clearInterval(autoTimer);
    }
    autoTimer = setInterval(() => {
      goTo(current + 1);
    }, 3400);
  }

  function stopAuto() {
    if (autoTimer) {
      clearInterval(autoTimer);
      autoTimer = null;
    }
  }

  prevButton?.addEventListener("click", () => goTo(current - 1));
  nextButton?.addEventListener("click", () => goTo(current + 1));

  dots.forEach((dot, index) => {
    dot.addEventListener("click", () => {
      const target = originalSlides.length > 1 ? index + 1 : index;
      goTo(target);
    });
  });

  viewport.addEventListener("scroll", syncCurrentFromScroll, { passive: true });
  viewport.addEventListener("touchstart", stopAuto, { passive: true });
  viewport.addEventListener("touchend", startAuto, { passive: true });
  carousel.addEventListener("mouseenter", stopAuto);
  carousel.addEventListener("mouseleave", startAuto);
  window.addEventListener("resize", () => scrollToCurrent("auto"));

  if ("IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.target !== carousel) {
            return;
          }
          isCarouselVisible = entry.isIntersecting;
          if (isCarouselVisible) {
            startAuto();
          } else {
            stopAuto();
          }
        });
      },
      { threshold: 0.35 }
    );
    observer.observe(carousel);
  }

  scrollToCurrent("auto");
  updateDots(current);
  startAuto();
}

document.querySelectorAll("[data-loop-carousel]").forEach((carousel) => {
  initLoopCarousel(carousel);
});

function initTabSwitcher(container) {
  const tabs = Array.from(container.querySelectorAll("[role='tab'][data-tab-target]"));
  const panels = Array.from(container.querySelectorAll("[role='tabpanel']"));

  if (tabs.length === 0 || panels.length === 0) {
    return;
  }

  function activateTab(nextTab) {
    const targetId = nextTab.dataset.tabTarget;
    if (!targetId) {
      return;
    }

    tabs.forEach((tab) => {
      const isActive = tab === nextTab;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", String(isActive));
    });

    panels.forEach((panel) => {
      const isActive = panel.id === targetId;
      panel.classList.toggle("is-active", isActive);
      panel.hidden = !isActive;
    });
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      activateTab(tab);
    });
  });
}

document.querySelectorAll("[data-tab-switcher]").forEach((container) => {
  initTabSwitcher(container);
});

function initCastProfile() {
  const profileRoot = document.querySelector("[data-cast-profile]");
  if (!profileRoot) {
    return;
  }

  const castData = {
    "1": {
      name: "CAST 01",
      tag: "Sweet Smile",
      image: "assets/cast-1.jpeg",
      birthday: "3月1日",
      height: "158cm",
      like: "カフェラテ / アニメ",
      message: "はじめまして。会いに来てくれたらうれしいです。"
    },
    "2": {
      name: "CAST 02",
      tag: "Cool Beauty",
      image: "assets/cast-2.jpeg",
      birthday: "7月12日",
      height: "162cm",
      like: "紅茶 / ゲーム",
      message: "一緒に楽しい時間を過ごしましょう。"
    },
    "3": {
      name: "CAST 03",
      tag: "Playful Mood",
      image: "assets/cast-3.jpeg",
      birthday: "11月23日",
      height: "155cm",
      like: "音楽 / スイーツ",
      message: "初めての方も気軽にログインしてね。"
    },
    "4": {
      name: "CAST 04",
      tag: "Elegant Charm",
      image: "assets/cast-4.jpeg",
      birthday: "5月9日",
      height: "160cm",
      like: "映画 / コスメ",
      message: "特別な夜になるようにお手伝いします。"
    }
  };

  const castId = new URLSearchParams(window.location.search).get("cast") || "1";
  const profile = castData[castId] || castData["1"];

  const image = profileRoot.querySelector("[data-cast-image]");
  const name = profileRoot.querySelector("[data-cast-name]");
  const tag = profileRoot.querySelector("[data-cast-tag]");
  const birthday = profileRoot.querySelector("[data-cast-birthday]");
  const height = profileRoot.querySelector("[data-cast-height]");
  const like = profileRoot.querySelector("[data-cast-like]");
  const message = profileRoot.querySelector("[data-cast-message]");

  if (image) {
    image.src = profile.image;
    image.alt = `${profile.name} プロフィール画像`;
  }
  if (name) {
    name.textContent = profile.name;
  }
  if (tag) {
    tag.textContent = profile.tag;
  }
  if (birthday) {
    birthday.textContent = profile.birthday;
  }
  if (height) {
    height.textContent = profile.height;
  }
  if (like) {
    like.textContent = profile.like;
  }
  if (message) {
    message.textContent = profile.message;
  }

  document.title = `Un:dress ${profile.name} Profile`;
}

initCastProfile();
