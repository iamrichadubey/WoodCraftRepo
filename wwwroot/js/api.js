(() => {
// Keep URL and HTTP details out of the page's rendering and interaction code.
async function request(path, options) {
  const response = await fetch(path, options);
  // DELETE endpoints return 204 and therefore have no JSON response body.
  const result = response.status === 204 ? null : await response.json();
  return { response, result };
}

function jsonRequest(method, body) {
  return {
    method,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)
  };
}

window.WoodCraftApi = Object.freeze({
  generateDesigns: (payload) => request("/api/designs/generate", jsonRequest("POST", payload)),
  getSavedDesigns: () => request("/api/designs/saved"),
  saveDesign: (design) => request("/api/designs/saved", jsonRequest("POST", design)),
  removeSavedDesign: (id) => request(`/api/designs/saved/${id}`, { method: "DELETE" }),
  getProjects: () => request("/api/projects"),
  saveProject: (design) => request("/api/projects", jsonRequest("POST", design)),
  removeProject: (id) => request(`/api/projects/${id}`, { method: "DELETE" })
});
})();
