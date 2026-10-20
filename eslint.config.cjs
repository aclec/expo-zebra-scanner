const { defineConfig } = require('eslint/config');
const universe = require('eslint-config-universe/flat/native');

module.exports = defineConfig([{ ignores: ['build', 'example/**'] }, ...universe]);
