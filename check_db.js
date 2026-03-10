const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./data/avapay.sqlite');

db.all('SELECT * FROM employees LIMIT 5', [], (err, rows) => {
  if (err) console.error(err);
  else console.log('EMPLOYEES:', JSON.stringify(rows, null, 2));
  
  db.all('SELECT * FROM payrun_items LIMIT 10', [], (err2, rows2) => {
    if (err2) console.error(err2);
    else console.log('PAYRUN_ITEMS:', JSON.stringify(rows2, null, 2));
    
    db.all('SELECT * FROM payruns LIMIT 5', [], (err3, rows3) => {
      if (err3) console.error(err3);
      else console.log('PAYRUNS:', JSON.stringify(rows3, null, 2));
      db.close();
    });
  });
});
</parameter>
</create_file>
