using WoodCraft.Models;

namespace WoodCraft.Services;

/// <summary>Contains furniture rules without coupling callers to their implementation.</summary>
public interface IFurnitureDesignService
{
    /// <summary>Generates concepts or returns the validation message for an invalid request.</summary>
    DesignGenerationResult Generate(GenerateRequest request);

    /// <summary>Checks that a submitted idea contains a supported, complete setup.</summary>
    string? ValidateSavedDesign(SavedDesignRequest request);
}
