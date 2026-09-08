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
        // Odczytujemy parametr "id" z adresu URL, np. ...?id=2
        // req.query to obiekt zawierający wszystkie parametry przekazane po znaku "?"
        const id = req.query.id;

        // Walidacja — sprawdzamy, czy parametr w ogóle został podany
        if (!id) {
            context.res = {
                status: 400,
                body: "Brak parametru 'id'. Użyj np.: ?id=1"
            };
            return;
        }

        let pool = await sql.connect(config);

        // Znowu zapytanie PARAMETRYZOWANE — @id to placeholder,
        // NIGDY nie wklejamy wartości id bezpośrednio do tekstu zapytania
        // (np. przez `WHERE Id = ${id}`), bo to otwiera drzwi na SQL Injection
        let result = await pool.request()
            .input('id', sql.Int, id)
            .query('SELECT * FROM TestowaTabela WHERE Id = @id');

        // Jeśli nic nie znaleziono, informujemy o tym zamiast zwracać pustą odpowiedź bez wyjaśnienia
        if (result.recordset.length === 0) {
            context.res = {
                status: 404,
                body: `Nie znaleziono wiadomości o id=${id}`
            };
            return;
        }

        context.res = {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
            body: result.recordset[0]
        };
    } catch (err) {
        context.res = {
            status: 500,
            body: "Błąd odczytu z bazy: " + err.message
        };
    }
};