using WoodCraft.Models;

namespace WoodCraft.Services;

/// <summary>Validates design requests and calculates local, indicative furniture estimates.</summary>
public sealed class FurnitureDesignService : IFurnitureDesignService
{
    /// <summary>Builds three design ideas from the selected furniture type and setup.</summary>
    public DesignGenerationResult Generate(GenerateRequest request)
    {
        if (request.Prompt is { Length: > 500 })
        {
            return Failure("The design description must be 500 characters or fewer.");
        }

        if (!FurnitureCatalog.TryGetProduct(request.Item, out var product))
        {
            return Failure("Choose a bed, cupboard, office furniture, or home mandir.");
        }

        var width = request.WidthCm ?? product.DefaultWidthCm;
        var depth = request.DepthCm ?? product.DefaultDepthCm;
        var height = request.HeightCm ?? product.DefaultHeightCm;
        if (new[] { width, depth, height }.Any(value => value is < 30 or > 500))
        {
            return Failure("Each measurement must be between 30 and 500 cm.");
        }

        var budget = request.BudgetInr ?? 35000;
        if (budget is < 5000 or > 300000)
        {
            return Failure("Budget must be between ₹5,000 and ₹3,00,000.");
        }

        var style = request.Style?.Trim() is { Length: > 0 } selectedStyle ? selectedStyle : "Modern Indian";
        var shape = product.Shapes.Contains(request.Shape ?? "") ? request.Shape! : product.Shapes[0];
        var color = request.Color?.Trim().ToLowerInvariant() switch
        {
            "sheesham" => "Sheesham",
            "walnut" => "Walnut",
            "ivory" => "Ivory",
            "sage" => "Sage green",
            _ => "Teak"
        };
        var changes = request.Changes?
            .Where(product.Customizations.Contains)
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .Take(4)
            .ToArray() ?? [];
        var brief = request.Prompt?.Trim();
        var summary = string.IsNullOrWhiteSpace(brief)
            ? $"{style} · {shape}"
            : $"{style} · {shape} · {(brief.Length > 65 ? brief[..62] + "..." : brief)}";

        // Scale price by the cube root of the volume ratio to moderate dimension changes.
        var volumeFactor = Math.Clamp(
            Math.Cbrt((double)(width * depth * height) / (product.DefaultWidthCm * product.DefaultDepthCm * product.DefaultHeightCm)),
            0.7,
            1.55);
        var featureFactor = 1 + changes.Length * 0.045;
        var shapeFactor = shape.Contains("L-shaped", StringComparison.OrdinalIgnoreCase) ? 1.08 : 1;
        var finishFactor = color switch
        {
            "Sheesham" or "Teak" => 1.08,
            "Walnut" => 1.04,
            _ => 1
        };
        // These factors are planning heuristics, not a supplier quote or stock price.
        var baseEstimate = product.BasePrice * volumeFactor * featureFactor * shapeFactor * finishFactor;
        var customTags = new[] { color, shape }.Concat(changes).Distinct(StringComparer.OrdinalIgnoreCase).ToArray();

        var ideas = product.Options.Select((name, index) =>
        {
            var estimate = RoundEstimate(baseEstimate * (0.82 + index * 0.16));
            return new DesignIdea(
                $"{name}, option {index + 1}",
                summary,
                $"{width} × {depth} × {height} cm · {color}",
                customTags,
                product.Images[index],
                RoundEstimate(baseEstimate * (0.82 + index * 0.16) * 0.9),
                RoundEstimate(baseEstimate * (0.82 + index * 0.16) * 1.12),
                estimate <= budget);
        }).ToArray();

        return new DesignGenerationResult(
            new GenerateDesignResponse(
                product.Name,
                budget,
                "Indicative estimate only. Final cost depends on material grade, hardware, and local workmanship.",
                ideas),
            null);
    }

    /// <summary>Returns a user-facing validation message, or null when the saved setup is valid.</summary>
    public string? ValidateSavedDesign(SavedDesignRequest request)
    {
        if (request.ItemKey is not ("bed" or "cupboard" or "office" or "mandir")
            || string.IsNullOrWhiteSpace(request.Item)
            || request.Item.Length > 80
            || string.IsNullOrWhiteSpace(request.Title)
            || request.Title.Length > 120
            || request.Setup is null
            || request.Setup.Item != request.ItemKey)
        {
            return "The selected furniture setup is incomplete.";
        }

        if (request.Setup.Prompt is { Length: > 500 }
            || request.Setup.Style is not { Length: > 0 and <= 50 }
            || request.Setup.Shape is not { Length: > 0 and <= 80 }
            || request.Setup.WidthCm is not (>= 30 and <= 500)
            || request.Setup.DepthCm is not (>= 30 and <= 500)
            || request.Setup.HeightCm is not (>= 30 and <= 500)
            || request.Setup.BudgetInr is not (>= 5000 and <= 300000))
        {
            return "Check the design description, measurements, and budget before saving.";
        }

        if (request.Image is { Length: > 2048 }
            || request.Tags is { Length: > 12 }
            || request.Setup.Changes is { Length: > 4 }
            || request.EstimateLow is < 0
            || request.EstimateHigh is < 0)
        {
            return "The selected design contains invalid details.";
        }

        return null;
    }

    private static DesignGenerationResult Failure(string error) => new(null, error);

    // Estimates are displayed in ₹500 increments for readability.
    private static int RoundEstimate(double amount) =>
        (int)(Math.Round(amount / 500, MidpointRounding.AwayFromZero) * 500);
}
