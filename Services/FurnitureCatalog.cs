using System.Diagnostics.CodeAnalysis;
using WoodCraft.Models;

namespace WoodCraft.Services;

/// <summary>Single source of furniture options used by server-side estimates.</summary>
public static class FurnitureCatalog
{
    private static readonly IReadOnlyDictionary<string, ProductInfo> Products =
        new Dictionary<string, ProductInfo>(StringComparer.OrdinalIgnoreCase)
        {
            ["bed"] = new("Bed", 26000, 160, 200, 110,
                ["Smart storage bed", "Made-to-fit bed", "Statement headboard bed"],
                ["photo-1505693416388-ac5ce068fe85", "photo-1616486338812-3dadae4b4ace", "photo-1615874694520-474822394e73"],
                ["Platform", "Hydraulic storage", "Upholstered headboard", "Four-poster"],
                ["Hydraulic storage", "Pull-out drawers", "Upholstered headboard", "Bedside ledges"]),
            ["cupboard"] = new("Cupboard / wardrobe", 34000, 180, 60, 210,
                ["Smart storage wardrobe", "Made-to-fit wardrobe", "Wardrobe with a little more"],
                ["photo-1595428774223-ef52624120d2", "photo-1616486338812-3dadae4b4ace", "photo-1618221195710-dd6b41faaea6"],
                ["Sliding shutters", "Hinged doors", "L-shaped corner", "Floor-to-ceiling"],
                ["Loft storage", "Mirror panel", "Internal organisers", "Sliding shutters"]),
            ["office"] = new("Office furniture", 16000, 120, 60, 75,
                ["Smart work setup", "Made-to-fit workspace", "Workspace, with room to grow"],
                ["photo-1497366811353-6870744d04b2", "photo-1497366754035-f200968a6e72", "photo-1497366216548-37526070297c"],
                ["Straight desk", "L-shaped desk", "Wall-mounted desk", "Height-adjustable"],
                ["Cable management", "Drawer unit", "Monitor shelf", "L-shaped worktop"]),
            ["mandir"] = new("Home mandir", 12000, 80, 45, 140,
                ["Compact home mandir", "Made-to-fit mandir", "A more detailed mandir"],
                ["/Images/Gemini_Generated_Image_6bdtpm6bdtpm6bdt.png", "/Images/Gemini_Generated_Image_fmvy1kfmvy1kfmvy-2.png", "/Images/Gemini_Generated_Image_fmvy1kfmvy1kfmvy.png"],
                ["Wall-mounted", "Floor-standing", "Corner-fit", "Arched"],
                ["Jaali detailing", "Bell and drawer storage", "Warm LED lighting", "Wall-mounted design"])
        };

    /// <summary>Looks up a supported item key without making unknown items valid.</summary>
    public static bool TryGetProduct(string? key, [NotNullWhen(true)] out ProductInfo? product)
    {
        if (key is not null && Products.TryGetValue(key.Trim(), out var found))
        {
            product = found;
            return true;
        }

        product = null;
        return false;
    }
}
