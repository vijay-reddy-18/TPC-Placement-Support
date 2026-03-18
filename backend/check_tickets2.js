const mongoose = require('mongoose');
const fs = require('fs');
const Ticket = require('./src/models/Ticket');

mongoose.connect('mongodb://127.0.0.1:27017/tpc', { useNewUrlParser: true, useUnifiedTopology: true })
.then(async () => {
   const t = await Ticket.find().sort({createdAt: -1}).limit(5);
   fs.writeFileSync('tickets_dump.json', JSON.stringify(t, null, 2));
   process.exit(0);
})
.catch(err => { console.error(err); process.exit(1); });
