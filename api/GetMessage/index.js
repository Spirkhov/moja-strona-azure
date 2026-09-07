// Importujemy bibliotekę do łączenia się z SQL Server / Azure SQL
const sql = require('mssql');

// Konfiguracja połączenia z bazą danych
// Używamy Managed Identity (tożsamość samej funkcji w Azure) zamiast hasła
const config = {
    server: 'spirkhov-db-nauka-001.database.windows.net',
    database: 'db-nauka-001',
    options: {
        encrypt: true
    },
    authentication: {
        type: 'azure-active-directory-msi-app-service'
    }
};

// Główna funkcja, którą Azure wywoła przy każdym zapytaniu HTTP
module.exports = async function (context, req) {
    try {
        // Łączymy się z bazą danych
        let pool = await sql.connect(config);

        // Wykonujemy proste zapytanie — pobieramy dane z Twojej testowej tabeli
        let result = await pool.request().query('SELECT * FROM TestowaTabela');

        // Zwracamy dane jako odpowiedź (w formacie JSON) do strony, która wywołała tę funkcję
        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: result.recordset
        };
    } catch (err) {
        // Jeśli coś pójdzie nie tak (np. problem z połączeniem), zwracamy błąd zamiast danych
        context.res = {
            status: 500,
            body: "Błąd połączenia z bazą: " + err.message
        };
    }
};
