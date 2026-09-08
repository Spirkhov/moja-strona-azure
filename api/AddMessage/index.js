const sql = require('mssql');

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

module.exports = async function (context, req) {
    try {
        // Odczytujemy treść wiadomości przesłaną przez użytkownika
        // req.body to dane wysłane w zapytaniu POST (np. z formularza albo z fetch())
        const wiadomosc = req.body && req.body.wiadomosc;

        // Sprawdzamy, czy w ogóle coś przesłano — jeśli nie, zwracamy błąd 400 (błędne zapytanie)
        if (!wiadomosc) {
            context.res = {
                status: 400,
                body: "Brak treści wiadomości. Wyślij JSON w formacie: { \"wiadomosc\": \"tekst\" }"
            };
            return;
        }

        let pool = await sql.connect(config);

        // Zapytanie parametryzowane — @wiadomosc to "placeholder",
        // który biblioteka mssql bezpiecznie podstawia zamiast wklejać tekst wprost do zapytania.
        // To chroni przed SQL Injection (o czym więcej przy kolejnej funkcji)
        let result = await pool.request()
            .input('wiadomosc', sql.NVarChar, wiadomosc)
            .query('INSERT INTO TestowaTabela (Wiadomosc) OUTPUT INSERTED.* VALUES (@wiadomosc)');

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: result.recordset[0]
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: "Błąd zapisu do bazy: " + err.message
        };
    }
};