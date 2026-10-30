using Microsoft.Data.Sqlite;
using System.Text.Json;
using WoodCraft.Models;

namespace WoodCraft.Data;

/// <summary>Persists projects and saved ideas in the local SQLite database.</summary>
public sealed class SqliteDesignRepository(string connectionString) : IDesignRepository
{
    public async Task InitializeAsync(CancellationToken cancellationToken = default)
    {
        await using var connection = new SqliteConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        // Keep the existing tables and serialized design format for data compatibility.
        command.CommandText = """
            CREATE TABLE IF NOT EXISTS SavedDesigns (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                DesignJson TEXT NOT NULL,
                CreatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            );
            CREATE TABLE IF NOT EXISTS Projects (
                Id INTEGER PRIMARY KEY AUTOINCREMENT,
                DesignJson TEXT NOT NULL,
                CreatedAt TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
            );
            """;
        await command.ExecuteNonQueryAsync(cancellationToken);
    }

    public async Task<IReadOnlyList<StoredDesign>> GetAllAsync(
        DesignCollection collection,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new SqliteConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        // Table names come only from the enum allowlist below; design data remains parameterized.
        command.CommandText = $"SELECT Id, CreatedAt, DesignJson FROM {GetTableName(collection)} ORDER BY Id DESC;";
        await using var reader = await command.ExecuteReaderAsync(cancellationToken);
        var designs = new List<StoredDesign>();
        while (await reader.ReadAsync(cancellationToken))
        {
            var design = JsonSerializer.Deserialize<SavedDesignRequest>(reader.GetString(2))
                ?? throw new InvalidOperationException("A saved design could not be read from the database.");
            designs.Add(new StoredDesign(reader.GetInt64(0), reader.GetString(1), design));
        }

        return designs;
    }

    public async Task<StoredDesign> AddAsync(
        DesignCollection collection,
        SavedDesignRequest design,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new SqliteConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = $"INSERT INTO {GetTableName(collection)} (DesignJson) VALUES ($design); SELECT last_insert_rowid();";
        command.Parameters.AddWithValue("$design", JsonSerializer.Serialize(design));
        var id = (long)(await command.ExecuteScalarAsync(cancellationToken)
            ?? throw new InvalidOperationException("The saved design was not assigned a database ID."));
        return new StoredDesign(id, DateTimeOffset.UtcNow.ToString("O"), design);
    }

    public async Task<bool> DeleteAsync(
        DesignCollection collection,
        long id,
        CancellationToken cancellationToken = default)
    {
        await using var connection = new SqliteConnection(connectionString);
        await connection.OpenAsync(cancellationToken);
        await using var command = connection.CreateCommand();
        command.CommandText = $"DELETE FROM {GetTableName(collection)} WHERE Id = $id;";
        command.Parameters.AddWithValue("$id", id);
        return await command.ExecuteNonQueryAsync(cancellationToken) != 0;
    }

    private static string GetTableName(DesignCollection collection) => collection switch
    {
        DesignCollection.SavedIdeas => "SavedDesigns",
        DesignCollection.Projects => "Projects",
        _ => throw new ArgumentOutOfRangeException(nameof(collection), collection, "Unsupported design collection.")
    };
}
