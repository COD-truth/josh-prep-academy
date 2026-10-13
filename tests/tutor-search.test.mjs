import test from 'node:test';
import assert from 'node:assert/strict';
import { searchTutors } from '../src/lib/tutor-search.ts';
const records = [
  { full_name: 'Émilie', title: null, subjects: ['Mathématiques'], levels: ['Terminale'], languages: ['FR'], hourly_rate_fcfa: 3500, years_experience: 5 },
  { full_name: 'Josh', title: 'Teacher', subjects: ['Mathematics', 'English'], levels: ['GCE A Level'], languages: ['EN'], hourly_rate_fcfa: 2500, years_experience: null },
];
const defaults = { query: '', level: '', language: '', budget: '', sort: 'name' };
test('French and English subject searches find both curricula', () => {
  for (const query of ['maths', 'mathematics', 'Mathématiques']) assert.equal(searchTutors(records, { ...defaults, query }).length, 2);
  assert.equal(searchTutors(records, { ...defaults, query: 'anglais' })[0].full_name, 'Josh');
});
test('search ignores accents and whitespace while combining words', () => {
  assert.equal(searchTutors(records, { ...defaults, query: '  emilie maths  ' })[0].full_name, 'Émilie');
});
test('level, language and budget filters are combined with inclusive budget', () => {
  assert.equal(searchTutors(records, { ...defaults, level: 'Terminale', language: 'FR', budget: '3500' }).length, 1);
  assert.equal(searchTutors(records, { ...defaults, level: 'Terminale', language: 'EN' }).length, 0);
  assert.equal(searchTutors(records, { ...defaults, budget: '0' }).length, 0);
});
test('price and experience sorts do not mutate source records', () => {
  assert.equal(searchTutors(records, { ...defaults, sort: 'price' })[0].full_name, 'Josh');
  assert.equal(searchTutors(records, { ...defaults, sort: 'experience' })[0].full_name, 'Émilie');
  assert.equal(records[0].full_name, 'Émilie');
});
