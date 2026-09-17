const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');

const indexHtml = fs.readFileSync('index.html', 'utf8');
const contactsHtml = fs.readFileSync('contacts.html', 'utf8');

test('public homepage does not expose the company requisites card', () => {
  assert.equal(indexHtml.includes('class="company-card"'), false);
  assert.equal(indexHtml.includes('Реквизиты организации'), false);
});

test('dedicated contacts page still contains the company requisites', () => {
  assert.equal(contactsHtml.includes('Реквизиты организации'), true);
  assert.equal(contactsHtml.includes('ИНН КР'), true);
});
