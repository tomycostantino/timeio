const { ipcMain } = require('electron');
const sqlite3 = require('sqlite3');

let database = null;

function getDatabase() {
    if (!database) {
        database = new sqlite3.Database('./db.sqlite3', (err) => {
            if (err) console.error('Database opening error: ', err);
        });
        initDatabase();
    }
    return database;
}

function initDatabase() {
    if (!database) {
        database = new sqlite3.Database('./db.sqlite3', (err) => {
            if (err) console.error('Database opening error: ', err);
        });
    }

    database.serialize(() => {
        database.run(`CREATE TABLE IF NOT EXISTS sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            start_time INTEGER,
            end_time INTEGER,
            duration INTEGER,
            app_usage TEXT
        )`, (err) => {
            if (err) console.error('Error creating table: ', err);
            else console.log('Database initialized successfully');
        });
    });

    setupDatabaseHandlers();
}

function closeDatabase() {
    if (database) {
        database.close((err) => {
            if (err) console.error('Error closing database: ', err);
            else console.log('Database closed successfully');
        });
        database = null;
    }
}

function setupDatabaseHandlers() {
    ipcMain.handle('store-session', (event, entry) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const keys = Object.keys(entry).join(', ');
            const values = Object.values(entry).join(', ');
            db.run(
                `INSERT INTO sessions (${keys}) VALUES (${values})`,
                function(err) {
                    if (err) {
                        console.error('Error adding time entry:', err);
                        reject(err);
                    } else {
                        resolve({ id: this.lastID });
                    }
                }
            );
        });
    });

    ipcMain.handle('update-session', (event, entry) => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            const id = entry.id;
            if (!id) {
                return reject(new Error('ID missing from entry data.'));
            }
            delete entry.id;
            const fields = Object.keys(entry);
            const values = Object.values(entry);

            if (!fields.length) {
                return resolve({ success: true, message: 'No fields to update' });
            }

            const setPlaceholders = fields.map(field => `${field} = ?`).join(', ');

            const sql = `UPDATE sessions SET ${setPlaceholders} WHERE id = ?`;

            const params = [...values, id];

            db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error storing session', err);
                    reject(err);
                } else {
                    resolve({ success: true });
                }
            });
        });
    });

    ipcMain.handle('get-sessions', () => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.all('SELECT * FROM sessions ORDER BY start_time DESC', (err, rows) => {
                if (err) {
                    console.error('Error retrieving time entries:', err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    });

    ipcMain.handle('get-active-session', () => {
        return new Promise((resolve, reject) => {
            const db = getDatabase();
            db.get('SELECT * FROM sessions WHERE end_time IS NULL ORDER BY start_time DESC LIMIT 1', [], (err, row) => {
               if (err) {
                   console.error('Error fetching active session', err);
                   reject(err);
               } else {
                   resolve(row);
               }
            });
        })
    });

    ipcMain.handle('delete-session', (event, id) => {
       return new Promise((resolve, reject) => {
           const db = getDatabase();
           db.run('DELETE FROM sessions WHERE id = ?', [id], function(err) {
               if (err) {
                   console.error('Error adding time entry:', err);
                   reject(err);
               } else {
                   resolve(true);
               }
           })
        });
    });
}

module.exports = {
    initDatabase,
    closeDatabase
};
