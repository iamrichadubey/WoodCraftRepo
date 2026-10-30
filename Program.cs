using Microsoft.Data.Sqlite;
using Microsoft.Extensions.FileProviders;
using WoodCraft.Api;
using WoodCraft.Data;
using WoodCraft.Services;

var builder = WebApplication.CreateBuilder(args);
var databasePath = Path.Combine(builder.Environment.ContentRootPath, "woodcraft.db");
var connectionString = new SqliteConnectionStringBuilder { DataSource = databasePath }.ToString();

// Register application contracts here so endpoint code does not depend on infrastructure details.
builder.Services.AddSingleton<IDesignRepository>(_ => new SqliteDesignRepository(connectionString));
builder.Services.AddSingleton<IFurnitureDesignService, FurnitureDesignService>();

var app = builder.Build();
// Create the local tables before accepting requests.
await app.Services.GetRequiredService<IDesignRepository>().InitializeAsync();

// wwwroot serves the browser app; product images are stored outside that directory.
app.UseStaticFiles();
app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new PhysicalFileProvider(Path.Combine(app.Environment.ContentRootPath, "Images")),
    RequestPath = "/Images"
});

// The landing page is kept at the project root rather than in wwwroot.
app.MapGet("/", (IWebHostEnvironment environment) =>
    Results.File(Path.Combine(environment.ContentRootPath, "index.html"), "text/html; charset=utf-8"));
app.MapWoodCraftEndpoints();

app.Run();
