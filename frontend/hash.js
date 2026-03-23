const bcrypt = require('bcrypt');

async function generateHash(password) {
  const hash = await bcrypt.hash(password, 10);
  console.log(hash);
}

generateHash('admin123'); // replace with any password you want
