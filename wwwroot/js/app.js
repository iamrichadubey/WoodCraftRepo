const { furnitureTypes, standardFurniture, colorNames, formatINR, formatRange, imageUrl } = window.WoodCraftCatalog;
const woodCraftApi = window.WoodCraftApi;
const staticDemo = window.WoodCraftConfig?.staticDemo === true;
// This list is the current studio view; selecting another furniture type replaces its ideas.
const concepts = furnitureTypes.bed.names.map((name, index) => ({
  title: `${name}, option ${index + 1}`,
  detail: "160 × 200 × 110 cm · Teak",
  image: furnitureTypes.bed.images[index],
  tags: ["Teak", "Platform", "Hydraulic storage"],
  inspiration: "Modern Indian · Platform",
  estimateLow: 24000 + index * 4000,
  estimateHigh: 30000 + index * 5000,
  fitsBudget: true
}));
let activeIndex = 0;
// Keep current form choices separate from the server-loaded saved collections.
let category = "bed";
let color = "teak";
let saved = [];
let projects = [];
let discoverCategory = "all";
let toastTimer;
const $ = (selector) => document.querySelector(selector);
const conceptGrid = $("#concept-grid");
const heroImage = $("#hero-image");

function showToast(message) {
  $("#toast-message").textContent = message;
  $("#toast").classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => $("#toast").classList.remove("visible"), 2400);
}

function drawConcepts() {
  conceptGrid.replaceChildren(...concepts.map((concept, index) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `concept-card${index === activeIndex ? " selected" : ""}`;
    button.setAttribute("aria-label", `View ${concept.title}`);
    button.setAttribute("aria-pressed", String(index === activeIndex));
    const image = document.createElement("img");
    image.className = "concept-image";
    image.src = imageUrl(concept.image, 420);
    image.alt = concept.detail;
    image.dataset.style = concept.style;
    image.loading = "lazy";
    const body = document.createElement("span");
    body.className = "concept-body";
    const title = document.createElement("span");
    title.className = "concept-title";
    title.textContent = concept.title;
    const meta = document.createElement("span");
    meta.className = "concept-meta";
    meta.textContent = concept.detail;
    const estimate = document.createElement("span");
    estimate.className = "concept-estimate";
    estimate.textContent = formatRange(concept.estimateLow, concept.estimateHigh);
    body.append(title, meta, estimate);
    button.append(image, body);
    button.addEventListener("click", () => selectConcept(index));
    return button;
  }));
}

function selectConcept(index) {
  activeIndex = index;
  const concept = concepts[index];
  $("#result-name").textContent = concept.title;
  $("#result-subtitle").textContent = concept.inspiration;
  $("#image-count").textContent = `0${index + 1} / 03`;
  $("#estimate").textContent = formatRange(concept.estimateLow, concept.estimateHigh);
  $("#budget-status").textContent = concept.fitsBudget ? "Within budget" : "Over budget";
  $("#budget-status").classList.toggle("over", !concept.fitsBudget);
  $("#image-caption").textContent = `${furnitureTypes[category].name} reference`;
  $("#tag-list").replaceChildren(...concept.tags.map((tag) => {
    const el = document.createElement("span");
    el.className = "tag";
    el.textContent = tag;
    return el;
  }));
  heroImage.src = imageUrl(concept.image, 1200);
  heroImage.alt = `${furnitureTypes[category].name}: ${concept.detail}`;
  heroImage.dataset.style = concept.style;
  heroImage.classList.remove("hero-image");
  void heroImage.offsetWidth;
  heroImage.classList.add("hero-image");
  drawConcepts();
  updateFavoriteButton();
}

function updateFavoriteButton() {
  const isSaved = Boolean(findSavedDesign());
  $("#favorite-button").classList.toggle("saved", isSaved);
  $("#favorite-label").textContent = isSaved ? "Saved" : "Save idea";
  $("#favorite-button").setAttribute("aria-label", isSaved ? "Remove design from favorites" : "Add design to favorites");
  $("#saved-count").textContent = String(saved.length);
}

function findSavedDesign() {
  const current = createSavedDesign();
  return saved.find(({ design }) =>
    design.title === current.title
    && design.itemKey === current.itemKey
    && JSON.stringify(design.setup) === JSON.stringify(current.setup)
  );
}

// Use the same payload for favorites and projects so the saved setup can be validated server-side.
function createSavedDesign() {
  const concept = currentImage();
  return {
    itemKey: category,
    item: furnitureTypes[category].name,
    title: concept.title,
    inspiration: concept.inspiration,
    detail: concept.detail,
    image: concept.image,
    tags: concept.tags,
    estimateLow: concept.estimateLow,
    estimateHigh: concept.estimateHigh,
    fitsBudget: concept.fitsBudget,
    setup: readCurrentPayload()
  };
}

async function loadSavedDesigns() {
  try {
    const { response, result } = await woodCraftApi.getSavedDesigns();
    if (!response.ok || !Array.isArray(result)) {
      throw new Error(result.error || "Unexpected saved designs response.");
    }
    saved = result;
    updateFavoriteButton();
  } catch (error) {
    console.error("Could not load saved designs.", error);
    showToast("Saved ideas could not be loaded from the database.");
  }
}

async function loadProjects() {
  const { response, result } = await woodCraftApi.getProjects();
  if (!response.ok || !Array.isArray(result)) {
    throw new Error(result.error || "Unexpected projects response.");
  }
  projects = result;
  renderProjects();
}

function renderProjects() {
  const list = $("#project-list");
  $("#project-count").textContent = String(projects.length);
  if (projects.length === 0) {
    const empty = document.createElement("p");
    empty.className = "projects-empty";
    empty.textContent = "No projects yet. Explore furniture options, choose a design, then save it here.";
    list.replaceChildren(empty);
    return;
  }

  list.replaceChildren(...projects.map((project) => {
    const design = project.design;
    const card = document.createElement("article");
    card.className = "project-card";
    const image = document.createElement("img");
    image.className = "project-image";
    image.src = imageUrl(design.image, 420);
    image.alt = `${design.item}: ${design.detail}`;
    image.loading = "lazy";
    const body = document.createElement("div");
    body.className = "project-card-body";
    const title = document.createElement("h2");
    title.textContent = design.title;
    const subtitle = document.createElement("p");
    subtitle.textContent = `${design.item} · ${design.detail}`;
    const estimate = document.createElement("p");
    estimate.className = "project-estimate";
    estimate.textContent = `${formatRange(design.estimateLow, design.estimateHigh)}${design.fitsBudget ? " · Within budget" : " · Over budget"}`;
    const date = document.createElement("p");
    date.className = "project-date";
    date.textContent = `Saved ${new Intl.DateTimeFormat("en-IN", { dateStyle: "medium" }).format(new Date(project.createdAt))}`;
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "result-action";
    remove.textContent = "Remove";
    remove.setAttribute("aria-label", `Remove ${design.title} from projects`);
    remove.addEventListener("click", async () => {
      remove.disabled = true;
      try {
        const { response } = await woodCraftApi.removeProject(project.id);
        if (!response.ok) throw new Error(`Could not remove project (HTTP ${response.status}).`);
        projects = projects.filter((item) => item.id !== project.id);
        renderProjects();
        showToast("Project removed.");
      } catch (error) {
        console.error("Could not remove project.", error);
        showToast(error.message || "Could not remove the project.");
        remove.disabled = false;
      }
    });
    body.append(title, subtitle, estimate, date, remove);
    card.append(image, body);
    return card;
  }));
}

// Discover is a local catalog view and does not call the estimate-generation API.
function renderDiscover() {
  const products = discoverCategory === "all"
    ? standardFurniture
    : standardFurniture.filter((product) => product.category === discoverCategory);
  $("#discover-count").textContent = `${products.length} display ${products.length === 1 ? "piece" : "pieces"}`;
  $("#discover-grid").replaceChildren(...products.map((product) => {
    const card = document.createElement("article");
    card.className = "discover-card";
    const image = document.createElement("img");
    image.className = "discover-image";
    image.src = imageUrl(product.image, 640);
    image.alt = `${product.categoryName}: ${product.title}`;
    image.loading = "lazy";
    const body = document.createElement("div");
    body.className = "discover-card-body";
    const categoryLabel = document.createElement("span");
    categoryLabel.className = "discover-category";
    categoryLabel.textContent = product.categoryName;
    const title = document.createElement("h2");
    title.textContent = product.title;
    const specs = document.createElement("p");
    specs.className = "discover-specs";
    specs.textContent = `${product.dimensions.join(" × ")} cm · ${product.shape}`;
    const priceLabel = document.createElement("span");
    priceLabel.className = "discover-price-label";
    priceLabel.textContent = "Standard base price";
    const price = document.createElement("p");
    price.className = "discover-price";
    price.textContent = formatINR(product.basePrice);
    body.append(categoryLabel, title, specs, priceLabel, price);
    card.append(image, body);
    return card;
  }));
}

function currentImage() {
  return concepts[activeIndex];
}

function updateProductFields() {
  category = $("#item").value;
  const product = furnitureTypes[category];
  $("#shape").replaceChildren(...product.shapes.map((shape) => {
    const option = document.createElement("option");
    option.textContent = shape;
    return option;
  }));
  ["width", "depth", "height"].forEach((id, index) => { $("#" + id).value = product.dimensions[index]; });
  $("#change-options").replaceChildren(...product.changes.map((change, index) => {
    const label = document.createElement("label");
    label.className = "change-option";
    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = change;
    input.checked = index < 2;
    const text = document.createElement("span");
    text.textContent = change;
    label.append(input, text);
    return label;
  }));
  $("#budget").value = product.budget;
  updateBudgetDisplay();
  previewIdeas(readCurrentPayload());
}

function updateBudgetDisplay() {
  $("#budget-display").textContent = formatINR(Number($("#budget").value));
}

function readCurrentPayload() {
  return {
    item: category,
    prompt: $("#prompt").value,
    style: $("#style").value,
    shape: $("#shape").value,
    widthCm: Number($("#width").value),
    depthCm: Number($("#depth").value),
    heightCm: Number($("#height").value),
    color,
    changes: Array.from($("#change-options").querySelectorAll("input:checked"), (input) => input.value),
    budgetInr: Number($("#budget").value)
  };
}

function previewIdeas(payload) {
  const product = furnitureTypes[payload.item];
  // Keep the local fallback estimate directionally consistent with the server formula.
  const volumeFactor = Math.max(0.7, Math.min(1.55, Math.cbrt(
    (payload.widthCm * payload.depthCm * payload.heightCm) /
    (product.dimensions[0] * product.dimensions[1] * product.dimensions[2])
  )));
  const base = product.basePrice * volumeFactor * (1 + payload.changes.length * 0.045);
  product.names.forEach((name, index) => {
    const estimate = Math.round(base * (0.82 + index * 0.16) / 500) * 500;
    concepts[index] = {
      title: `${name}, option ${index + 1}`,
      inspiration: `${payload.style} · ${payload.shape}`,
      style: payload.style,
      detail: `${payload.widthCm} × ${payload.depthCm} × ${payload.heightCm} cm · ${colorNames[payload.color]}`,
      image: product.images[index],
      tags: [colorNames[payload.color], payload.shape, ...payload.changes.slice(0, 1)],
      estimateLow: Math.round(estimate * 0.9 / 500) * 500,
      estimateHigh: Math.round(estimate * 1.12 / 500) * 500,
      fitsBudget: estimate <= payload.budgetInr
    };
  });
  activeIndex = 0;
  drawConcepts();
  selectConcept(0);
}

function applyServerIdeas(ideas) {
  ideas.forEach((idea, index) => {
    concepts[index] = {
      ...concepts[index],
      ...idea,
      image: furnitureTypes[category].images[index],
      style: $("#style").value
    };
  });
  activeIndex = 0;
  drawConcepts();
  selectConcept(0);
}

$("#item").addEventListener("change", updateProductFields);
$("#design-form").addEventListener("change", updateFavoriteButton);
$("#design-form").addEventListener("input", updateFavoriteButton);
$("#style").addEventListener("change", () => {
  const style = $("#style").value;
  concepts.forEach((concept) => {
    concept.style = style;
    concept.inspiration = `${style} · ${$("#shape").value}`;
  });
  drawConcepts();
  selectConcept(activeIndex);
});
$("#budget").addEventListener("input", () => {
  updateBudgetDisplay();
  updateFavoriteButton();
});

$("#design-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = $("#generate-button");
  button.disabled = true;
  button.querySelector("span").textContent = "Pricing your options…";
  const payload = readCurrentPayload();
  try {
    const { response, result } = await woodCraftApi.generateDesigns(payload);
    if (!response.ok) {
      showToast(result.error || "Please check your measurements and budget.");
      return;
    }
    if (!Array.isArray(result.ideas) || result.ideas.length !== 3) throw new Error("Unexpected furniture API response");
    applyServerIdeas(result.ideas);
    showToast("Options and indicative prices updated.");
  } catch {
    // Directly opened/static previews remain usable if the API is unavailable.
    previewIdeas(payload);
    showToast("Showing local preview estimates; the .NET service is unavailable.");
  } finally {
    button.disabled = false;
    button.querySelector("span").textContent = "Explore options";
  }
});

document.querySelectorAll(".swatch").forEach((swatch) => {
  swatch.addEventListener("click", () => {
    color = swatch.dataset.color;
    document.querySelectorAll(".swatch").forEach((item) => item.setAttribute("aria-pressed", String(item === swatch)));
    $("#color-name").textContent = colorNames[color];
    updateFavoriteButton();
  });
});

$("#favorite-button").addEventListener("click", async () => {
  const button = $("#favorite-button");
  const existing = findSavedDesign();
  button.disabled = true;
  try {
    if (existing) {
      const { response } = await woodCraftApi.removeSavedDesign(existing.id);
      if (!response.ok) throw new Error(`Could not remove saved idea (HTTP ${response.status}).`);
      saved = saved.filter((item) => item.id !== existing.id);
      showToast("Removed from your saved ideas.");
    } else {
      const { response, result } = await woodCraftApi.saveDesign(createSavedDesign());
      if (!response.ok) throw new Error(result.error || `Could not save idea (HTTP ${response.status}).`);
      saved.unshift(result);
      showToast("Saved to your ideas.");
    }
  } catch (error) {
    console.error("Could not update saved designs.", error);
    showToast(error.message || "Could not update your saved ideas.");
  } finally {
    button.disabled = false;
    updateFavoriteButton();
  }
});

$("#project-button").addEventListener("click", async () => {
  const button = $("#project-button");
  button.disabled = true;
  try {
    const { response, result } = await woodCraftApi.saveProject(createSavedDesign());
    if (!response.ok) throw new Error(result.error || `Could not save project (HTTP ${response.status}).`);
    projects.unshift(result);
    renderProjects();
    showToast("Selected design saved to My projects.");
  } catch (error) {
    console.error("Could not save project.", error);
    showToast(error.message || "Could not save the selected design to projects.");
  } finally {
    button.disabled = false;
  }
});

$("#share-button").addEventListener("click", async () => {
  const shareData = { title: currentImage().title, text: "A furniture idea from WoodCraft Studio", url: location.href };
  try {
    if (navigator.share) await navigator.share(shareData);
    else if (navigator.clipboard && window.isSecureContext) await navigator.clipboard.writeText(location.href);
    else throw new Error("Clipboard unavailable");
    showToast(navigator.share ? "Ready to share." : "Link copied to clipboard.");
  } catch (error) {
    if (error.name !== "AbortError") showToast("Your design link is ready to copy from the address bar.");
  }
});

$("#download-button").addEventListener("click", () => {
  const link = document.createElement("a");
  link.href = heroImage.src;
  link.download = `${currentImage().title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.jpg`;
  link.target = "_blank";
  link.rel = "noopener";
  link.click();
  showToast("Your design image is on its way.");
});


function startNewProject() {
  $("#prompt").value = "";
  $("#item").selectedIndex = 0;
  $("#style").selectedIndex = 0;
  updateProductFields();
  $("#prompt").focus();
  document.querySelector('[data-view="studio"]').click();
  showToast("A fresh project is ready for an idea.");
}

$("#new-project").addEventListener("click", startNewProject);
$("#projects-new-project").addEventListener("click", startNewProject);

$("#help-button").addEventListener("click", () => showToast("Try describing storage, dimensions, materials, or how you use the furniture."));
$("#notifications-button").addEventListener("click", () => showToast("You’re all caught up."));

$("#discover-filters").addEventListener("click", (event) => {
  const filter = event.target.closest("[data-category]");
  if (!filter) return;
  discoverCategory = filter.dataset.category;
  document.querySelectorAll(".discover-filter").forEach((button) => {
    const isActive = button === filter;
    button.classList.toggle("active", isActive);
    button.setAttribute("aria-pressed", String(isActive));
  });
  renderDiscover();
});

document.querySelectorAll(".nav-item").forEach((item) => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach((nav) => nav.classList.toggle("active", nav === item));
    const view = item.dataset.view;
    if (staticDemo && (view === "projects" || view === "saved")) return;
    const names = { studio: "Design studio", projects: "My projects", saved: "Saved ideas", discover: "Discover" };
    $("#breadcrumb-current").textContent = names[view];
    const showProjects = view === "projects";
    const showDiscover = view === "discover";
    $("#studio-intro").hidden = showProjects || showDiscover;
    $("#studio-grid").hidden = showProjects || showDiscover;
    $("#projects-view").hidden = !showProjects;
    $("#discover-view").hidden = !showDiscover;
    if (view === "saved") showToast(saved.length ? `You’ve saved ${saved.length} furniture idea${saved.length === 1 ? "" : "s"}.` : "Your favorite furniture ideas will live here.");
    else if (view === "projects") {
      loadProjects().catch((error) => {
        console.error("Could not load projects.", error);
        showToast(error.message || "Projects could not be loaded.");
      });
    } else if (view === "discover") renderDiscover();
    else if (view === "studio") {
      document.querySelector("#studio").scrollIntoView({ behavior: "smooth" });
    }
  });
});

updateProductFields();
renderDiscover();
drawConcepts();
selectConcept(0);
if (staticDemo) {
  document.body.classList.add("static-demo");
  $("#static-demo-notice").hidden = false;
  document.querySelectorAll('[data-view="projects"], [data-view="saved"], #project-button, #favorite-button')
    .forEach((element) => { element.hidden = true; });
} else {
  loadSavedDesigns();
  loadProjects().catch((error) => {
    console.error("Could not load projects.", error);
    showToast(error.message || "Projects could not be loaded.");
  });
}
