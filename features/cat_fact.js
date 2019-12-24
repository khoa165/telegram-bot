function randomFact(json) {
  return `<b>Learn a new fact to be a better servant for your cat(s)!</b>
  <i>${json.data.fact}</i>`;
}

module.exports = randomFact;
