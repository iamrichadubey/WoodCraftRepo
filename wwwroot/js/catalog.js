(() => {
// Browser-side catalog mirrors the server catalog for immediate previews and Discover.
const furnitureTypes = {
  bed: {
    name: "Bed", budget: 35000, dimensions: [160, 200, 110], basePrice: 26000,
    shapes: ["Platform", "Hydraulic storage", "Upholstered headboard", "Four-poster"],
    changes: ["Hydraulic storage", "Pull-out drawers", "Upholstered headboard", "Bedside ledges"],
    names: ["Smart storage bed", "Made-to-fit bed", "Statement headboard bed"],
    images: ["photo-1505693416388-ac5ce068fe85", "photo-1616486338812-3dadae4b4ace", "photo-1615874694520-474822394e73"]
  },
  cupboard: {
    name: "Cupboard / wardrobe", budget: 50000, dimensions: [180, 60, 210], basePrice: 34000,
    shapes: ["Sliding shutters", "Hinged doors", "L-shaped corner", "Floor-to-ceiling"],
    changes: ["Loft storage", "Mirror panel", "Internal organisers", "Sliding shutters"],
    names: ["Smart storage wardrobe", "Made-to-fit wardrobe", "Wardrobe with a little more"],
    images: ["photo-1595428774223-ef52624120d2", "photo-1616486338812-3dadae4b4ace", "photo-1618221195710-dd6b41faaea6"]
  },
  office: {
    name: "Office furniture", budget: 20000, dimensions: [120, 60, 75], basePrice: 16000,
    shapes: ["Straight desk", "L-shaped desk", "Wall-mounted desk", "Height-adjustable"],
    changes: ["Cable management", "Drawer unit", "Monitor shelf", "L-shaped worktop"],
    names: ["Smart work setup", "Made-to-fit workspace", "Workspace, with room to grow"],
    images: ["photo-1497366811353-6870744d04b2", "photo-1497366754035-f200968a6e72", "photo-1497366216548-37526070297c"]
  },
  mandir: {
    name: "Home mandir", budget: 15000, dimensions: [80, 45, 140], basePrice: 12000,
    shapes: ["Wall-mounted", "Floor-standing", "Corner-fit", "Arched"],
    changes: ["Jaali detailing", "Bell and drawer storage", "Warm LED lighting", "Wall-mounted design"],
    names: ["Compact home mandir", "Made-to-fit mandir", "A more detailed mandir"],
    images: ["/Images/Gemini_Generated_Image_6bdtpm6bdtpm6bdt.png", "/Images/Gemini_Generated_Image_fmvy1kfmvy1kfmvy-2.png", "/Images/Gemini_Generated_Image_fmvy1kfmvy1kfmvy.png"],
    imagesByStyle: {
      "Modern Indian": "/Images/Gemini_Generated_Image_6bdtpm6bdtpm6bdt.png",
      "Minimal": "/Images/Gemini_Generated_Image_fmvy1kfmvy1kfmvy-2.png"
    }
  }
};

// Discover presents each named concept at the furniture type's standard base price.
const standardFurniture = Object.entries(furnitureTypes).flatMap(([key, product]) =>
  product.names.map((name, index) => ({
    category: key,
    categoryName: product.name,
    title: name,
    image: product.images[index],
    dimensions: product.dimensions,
    shape: product.shapes[0],
    basePrice: product.basePrice
  }))
);
const colorNames = { sheesham: "Sheesham", teak: "Teak", walnut: "Walnut", ivory: "Ivory", sage: "Sage green" };
const formatINR = (amount) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(amount);
const formatRange = (low, high) => `${formatINR(low)}–${formatINR(high)}`;
const imageUrl = (image, width = 720) => /^(https?:|\/|data:)/.test(image)
  ? image
  : `https://images.unsplash.com/${image}?auto=format&fit=crop&w=${width}&q=83`;

window.WoodCraftCatalog = Object.freeze({
  furnitureTypes,
  standardFurniture,
  colorNames,
  formatINR,
  formatRange,
  imageUrl
});
})();
