namespace WoodCraft.Models;

/// <summary>Selected furniture idea and the setup needed to recreate it.</summary>
public sealed record SavedDesignRequest(
    string? ItemKey,
    string? Item,
    string? Title,
    string? Inspiration,
    string? Detail,
    string? Image,
    string[]? Tags,
    int? EstimateLow,
    int? EstimateHigh,
    bool FitsBudget,
    GenerateRequest? Setup);

/// <summary>A saved design together with its database identity and creation time.</summary>
public sealed record StoredDesign(long Id, string CreatedAt, SavedDesignRequest Design);

/// <summary>Public response for an item in the saved-ideas collection.</summary>
public sealed record SavedDesignResponse(long Id, string CreatedAt, SavedDesignRequest Design);

/// <summary>Public response for an item in the projects collection.</summary>
public sealed record ProjectResponse(long Id, string CreatedAt, SavedDesignRequest Design);

/// <summary>Furniture customization values submitted for estimate generation.</summary>
public sealed record GenerateRequest(
    string? Item,
    string? Prompt,
    string? Style,
    string? Shape,
    int? WidthCm,
    int? DepthCm,
    int? HeightCm,
    string? Color,
    string[]? Changes,
    int? BudgetInr);

/// <summary>Standard options and defaults used to generate a furniture design.</summary>
public sealed record ProductInfo(
    string Name,
    int BasePrice,
    int DefaultWidthCm,
    int DefaultDepthCm,
    int DefaultHeightCm,
    string[] Options,
    string[] Images,
    string[] Shapes,
    string[] Customizations);

/// <summary>One generated furniture concept and its indicative estimate.</summary>
public sealed record DesignIdea(
    string Title,
    string Inspiration,
    string Detail,
    string[] Tags,
    string Image,
    int EstimateLow,
    int EstimateHigh,
    bool FitsBudget);

/// <summary>Three concepts returned for a valid customization request.</summary>
public sealed record GenerateDesignResponse(
    string Item,
    int BudgetInr,
    string Note,
    DesignIdea[] Ideas);

/// <summary>Represents a generation response or the validation error returned instead.</summary>
public sealed record DesignGenerationResult(GenerateDesignResponse? Response, string? Error)
{
    public bool Succeeded => Response is not null;
}

/// <summary>Selects which local collection a repository operation targets.</summary>
public enum DesignCollection
{
    SavedIdeas,
    Projects
}
