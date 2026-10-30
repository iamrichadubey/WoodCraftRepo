using WoodCraft.Models;

namespace WoodCraft.Data;

/// <summary>Defines storage operations independently of the persistence provider.</summary>
public interface IDesignRepository
{
    /// <summary>Ensures the persistence schema exists before the application serves requests.</summary>
    Task InitializeAsync(CancellationToken cancellationToken = default);

    /// <summary>Returns a collection ordered newest-first.</summary>
    Task<IReadOnlyList<StoredDesign>> GetAllAsync(
        DesignCollection collection,
        CancellationToken cancellationToken = default);

    /// <summary>Adds a design and returns it with its generated database identity.</summary>
    Task<StoredDesign> AddAsync(
        DesignCollection collection,
        SavedDesignRequest design,
        CancellationToken cancellationToken = default);

    /// <summary>Deletes a design; returns false when its identifier was not found.</summary>
    Task<bool> DeleteAsync(
        DesignCollection collection,
        long id,
        CancellationToken cancellationToken = default);
}
