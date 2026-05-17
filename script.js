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

menuToggle.addEventListener("click", openDrawer);
closeBtn.addEventListener("click", closeDrawer);
backdrop.addEventListener("click", closeDrawer);

drawerLinks.forEach((link) => {
  link.addEventListener("click", closeDrawer);
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
