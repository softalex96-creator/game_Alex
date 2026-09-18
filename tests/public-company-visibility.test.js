const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const contactsHtml = fs.readFileSync('contacts.html', 'utf8');

test('public homepage does not expose the company requisites card', () => {
  assert.equal(indexHtml.includes('class="company-card"'), false);
  assert.equal(indexHtml.includes('Реквизиты организации'), false);
});

test('public contacts page exposes only contact channels, not company requisites', () => {
  assert.equal(contactsHtml.includes('Реквизиты организации'), false);
  assert.equal(contactsHtml.includes('ИНН КР'), false);
  assert.equal(contactsHtml.includes('Адрес офиса'), false);
  assert.equal(contactsHtml.includes('Директор'), false);
  assert.equal(contactsHtml.includes('business@pulse80.cc'), true);
  assert.equal(contactsHtml.includes('@levelUP_67'), true);
});
