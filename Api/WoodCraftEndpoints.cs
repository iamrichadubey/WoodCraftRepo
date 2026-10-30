using Microsoft.AspNetCore.Routing;
using WoodCraft.Data;
using WoodCraft.Models;
using WoodCraft.Services;

namespace WoodCraft.Api;

public static class WoodCraftEndpoints
{
    /// <summary>Registers the application's HTTP API routes.</summary>
    public static IEndpointRouteBuilder MapWoodCraftEndpoints(this IEndpointRouteBuilder endpoints)
    {
        endpoints.MapGet("/api/health", () =>
            Results.Ok(new { status = "ok", application = "WoodCraft Studio" }));

        endpoints.MapPost("/api/designs/generate", (GenerateRequest request, IFurnitureDesignService service) =>
        {
            var result = service.Generate(request);
            return result.Succeeded
                ? Results.Ok(result.Response)
                : Results.BadRequest(new { error = result.Error });
        });

        // Share CRUD behavior while adapting the response type to each public API shape.
        MapDesignCollection(endpoints, "/api/designs/saved", DesignCollection.SavedIdeas,
            (stored) => new SavedDesignResponse(stored.Id, stored.CreatedAt, stored.Design));
        MapDesignCollection(endpoints, "/api/projects", DesignCollection.Projects,
            (stored) => new ProjectResponse(stored.Id, stored.CreatedAt, stored.Design));

        return endpoints;
    }

    // Both collection routes have identical storage semantics but retain distinct response contracts.
    private static void MapDesignCollection<TResponse>(
        IEndpointRouteBuilder endpoints,
        string route,
        DesignCollection collection,
        Func<StoredDesign, TResponse> responseFactory)
    {
        endpoints.MapGet(route, async (IDesignRepository repository, CancellationToken cancellationToken) =>
        {
            var designs = await repository.GetAllAsync(collection, cancellationToken);
            return Results.Ok(designs.Select(responseFactory));
        });

        endpoints.MapPost(route, async (
            SavedDesignRequest request,
            IDesignRepository repository,
            IFurnitureDesignService service,
            CancellationToken cancellationToken) =>
        {
            var validationError = service.ValidateSavedDesign(request);
            if (validationError is not null)
            {
                return Results.BadRequest(new { error = validationError });
            }

            var design = await repository.AddAsync(collection, request, cancellationToken);
            return Results.Ok(responseFactory(design));
        });

        endpoints.MapDelete($"{route}/{{id:long}}", async (
            long id,
            IDesignRepository repository,
            CancellationToken cancellationToken) =>
        {
            var deleted = await repository.DeleteAsync(collection, id, cancellationToken);
            return deleted ? Results.NoContent() : Results.NotFound();
        });
    }
}
