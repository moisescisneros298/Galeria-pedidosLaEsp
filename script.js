const FILTERS_COLLAPSED_COUNT = 10;

let cakesData = [];
let filteredCakes = [];
let activeFilters = new Set();
let searchTerm = "";
let currentModalCake = null;
let currentImageIndex = 0;
let filtersExpanded = false;

const gallery = document.getElementById("gallery");
const filtersContainer = document.getElementById("filters");
const searchInput = document.getElementById("searchInput");
const clearFiltersBtn = document.getElementById("clearFilters");
const resultsSummary = document.getElementById("resultsSummary");
const emptyState = document.getElementById("emptyState");
const heroTotal = document.getElementById("heroTotal");
const toggleFiltersBtn = document.getElementById("toggleFiltersBtn");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("cakeTitle");
const modalDesc = document.getElementById("cakeDesc");
const modalImg = document.getElementById("modalImg");
const modalTags = document.getElementById("modalTags");
const modalInfo = document.getElementById("modalInfo");
const thumbs = document.getElementById("thumbs");
const prevImgBtn = document.getElementById("prevImgBtn");
const nextImgBtn = document.getElementById("nextImgBtn");
const toggleDetailsBtn = document.getElementById("toggleDetailsBtn");

fetch("/db/pasteles.json")
  .then((res) => res.json())
  .then((data) => {
    cakesData = data.pasteles || [];
    filteredCakes = [...cakesData];
    createFilters();
    updateHeaderStats();
    applyFilters();
  })
  .catch(() => {
    resultsSummary.textContent = "No se pudo cargar el catálogo en este momento.";
    emptyState.hidden = false;
  });

function normalizeText(text) {
  return (text || "")
    .toString()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

function getSearchableText(cake) {
  return normalizeText([
    cake.nombre,
    cake.descripcion,
    ...(cake.etiquetas || []),
  ].join(" "));
}

function getUniqueTags() {
  const tags = new Set();

  cakesData.forEach((cake) => {
    (cake.etiquetas || []).filter(Boolean).forEach((tag) => tags.add(tag));
  });

  return [...tags].sort((a, b) => a.localeCompare(b, "es"));
}

function updateHeaderStats() {
  heroTotal.textContent = cakesData.length;
}

function printCakes(cakes) {
  gallery.innerHTML = "";
  emptyState.hidden = cakes.length > 0;

  cakes.forEach((cake, index) => {
    const card = document.createElement("article");
    card.className = "cake";
    card.tabIndex = 0;

    const tagsHTML = (cake.etiquetas || [])
      .filter(Boolean)
      .slice(0, 3)
      .map((tag) => `<span class="tag">${tag}</span>`)
      .join("");

    card.innerHTML = `
      <img loading="lazy" src="${cake.imagenes?.[0] || ""}" alt="${cake.nombre}">
      <div class="cake-overlay">
        <div class="cake-copy">
          <h3>${cake.nombre}</h3>
          <div class="tags">${tagsHTML}</div>
        </div>
      </div>
    `;

    card.onclick = () => openModal(cake);
    card.onkeydown = (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openModal(cake);
      }
    };

    gallery.appendChild(card);

    requestAnimationFrame(() => {
      setTimeout(() => card.classList.add("show"), index * 30);
    });
  });
}

function createFilters() {
  filtersContainer.innerHTML = "";

  const allBtn = document.createElement("button");
  allBtn.textContent = "Todos";
  allBtn.className = "filter-btn active";
  allBtn.dataset.filter = "all";
  allBtn.onclick = clearAllFilters;
  filtersContainer.appendChild(allBtn);

  getUniqueTags().forEach((tag, index) => {
    const btn = document.createElement("button");
    btn.textContent = tag;
    btn.className = "filter-btn";
    btn.dataset.filter = tag;
    btn.onclick = () => toggleFilter(tag);

    if (index >= FILTERS_COLLAPSED_COUNT) {
      btn.classList.add("is-extra");
      btn.hidden = !filtersExpanded;
    }

    filtersContainer.appendChild(btn);
  });

  updateFiltersToggle();
}

function updateFiltersToggle() {
  const extraFilters = filtersContainer.querySelectorAll(".is-extra");
  const shouldShowToggle = extraFilters.length > 0;

  toggleFiltersBtn.hidden = !shouldShowToggle;
  toggleFiltersBtn.textContent = filtersExpanded ? "Ver menos filtros" : "Ver más filtros";

  extraFilters.forEach((btn) => {
    btn.hidden = !filtersExpanded;
  });
}

function clearAllFilters() {
  activeFilters.clear();
  searchTerm = "";
  searchInput.value = "";
  applyFilters();
}

function toggleFilter(tag) {
  if (activeFilters.has(tag)) {
    activeFilters.delete(tag);
  } else {
    activeFilters.add(tag);
  }

  applyFilters();
}

function applyFilters() {
  filteredCakes = cakesData.filter((cake) => {
    const matchesSearch = !searchTerm || getSearchableText(cake).includes(searchTerm);
    const matchesTags = [...activeFilters].every((tag) => (cake.etiquetas || []).includes(tag));
    return matchesSearch && matchesTags;
  });

  updateFiltersUI();
  updateResultsSummary();
  printCakes(filteredCakes);
}

function updateFiltersUI() {
  document.querySelectorAll(".filter-btn").forEach((btn) => {
    const value = btn.dataset.filter;
    const isAll = value === "all";
    btn.classList.toggle("active", isAll ? activeFilters.size === 0 : activeFilters.has(value));
  });
}

function updateResultsSummary() {
  const total = cakesData.length;
  const visible = filteredCakes.length;
  const filtersText = activeFilters.size > 0 ? ` · ${activeFilters.size} filtro(s)` : "";
  const searchText = searchTerm ? ` · “${searchInput.value.trim()}”` : "";

  resultsSummary.textContent = `${visible} de ${total} resultados${filtersText}${searchText}`;
}

function openModal(cake) {
  currentModalCake = cake;
  currentImageIndex = 0;

  modal.classList.add("active");
  modal.setAttribute("aria-hidden", "false");
  modalInfo.classList.remove("show-details");
  document.body.classList.add("modal-open");
  updateDetailsButton();

  modalTitle.innerText = cake.nombre;
  modalDesc.innerText = cake.descripcion || "Diseño personalizado disponible.";

  modalTags.innerHTML = (cake.etiquetas || [])
    .filter(Boolean)
    .map((tag) => `<span class="tag">${tag}</span>`)
    .join("");

  renderModalImage();
  renderThumbnails();
}

function renderModalImage() {
  if (!currentModalCake) return;

  const images = currentModalCake.imagenes || [];
  const safeIndex = Math.max(0, Math.min(currentImageIndex, images.length - 1));
  currentImageIndex = safeIndex;

  modalImg.style.opacity = 0;
  setTimeout(() => {
    modalImg.src = images[safeIndex] || "";
    modalImg.alt = `${currentModalCake.nombre} - imagen ${safeIndex + 1}`;
    modalImg.style.opacity = 1;
  }, 120);

  prevImgBtn.disabled = images.length <= 1;
  nextImgBtn.disabled = images.length <= 1;

  thumbs.querySelectorAll("img").forEach((thumb, index) => {
    thumb.classList.toggle("active", index === currentImageIndex);
  });
}

function renderThumbnails() {
  thumbs.innerHTML = "";

  (currentModalCake?.imagenes || []).forEach((img, index) => {
    const thumb = document.createElement("img");
    thumb.loading = "lazy";
    thumb.src = img;
    thumb.alt = `${currentModalCake.nombre} miniatura ${index + 1}`;
    thumb.classList.toggle("active", index === currentImageIndex);
    thumb.onclick = () => {
      currentImageIndex = index;
      renderModalImage();
    };
    thumbs.appendChild(thumb);
  });
}

function changeModalImage(direction) {
  if (!currentModalCake || (currentModalCake.imagenes || []).length <= 1) return;

  const totalImages = currentModalCake.imagenes.length;
  currentImageIndex = (currentImageIndex + direction + totalImages) % totalImages;
  renderModalImage();
}

function updateDetailsButton() {
  toggleDetailsBtn.textContent = modalInfo.classList.contains("show-details")
    ? "Ocultar detalles"
    : "Ver detalles";
}

function toggleModalDetails() {
  modalInfo.classList.toggle("show-details");
  updateDetailsButton();
}

function closeModal() {
  modal.classList.remove("active");
  modal.setAttribute("aria-hidden", "true");
  modalInfo.classList.remove("show-details");
  document.body.classList.remove("modal-open");
  currentModalCake = null;
}

searchInput.addEventListener("input", (event) => {
  searchTerm = normalizeText(event.target.value);
  applyFilters();
});

clearFiltersBtn.addEventListener("click", clearAllFilters);

toggleFiltersBtn.addEventListener("click", () => {
  filtersExpanded = !filtersExpanded;
  updateFiltersToggle();
});

prevImgBtn.addEventListener("click", () => changeModalImage(-1));
nextImgBtn.addEventListener("click", () => changeModalImage(1));
toggleDetailsBtn.addEventListener("click", toggleModalDetails);

/* ESC y navegación */
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
  if (!modal.classList.contains("active")) return;
  if (e.key === "ArrowLeft") changeModalImage(-1);
  if (e.key === "ArrowRight") changeModalImage(1);
});

/* clic fuera */
modal.addEventListener("click", (e) => {
  if (e.target.id === "modal") closeModal();
});
