const { MeiliSearch } = require('meilisearch');

const client = new MeiliSearch({
    host: 'http://127.0.0.1:7700', // Адрес Meilisearch
    apiKey: 'DBHNpmJKfYOfsFPZyzwYmM3uAKtgA0JWyV9jnQvoAPw', // Укажите ключ, если требуется
});

module.exports = client;
