const defaultPairs = [
  '(', ')',
  '[', ']',
  '{', '}',
  '"', "'", '`',
];

const compose = (...fns) => fns.reduce((f, g) => (...args) => f(g(...args)));

const removePairs = (opening: string, closing?: string) => (str: string) => {
  if (!closing) {
    closing = opening;
  }

  const regex = new RegExp(`${opening}([^${opening}]+(?=${closing}))${closing}`, 'g');
  return str.replace(regex, '');
};

const removeClosedPairs = compose(
  str => str.split(''),
  removePairs("'"),
  removePairs('"'),
  removePairs('`'),
  removePairs('\\{', '\\}'),
  removePairs('\\[', '\\]'),
  removePairs('\\(', '\\)')
);

export function getUnclosedPairs(str) {
  const trimmed = removeClosedPairs(str);
  return trimmed.filter(char => defaultPairs.indexOf(char) > -1);
}

export function removeEscapedQuotes(str) {
  return str.replace(/(\\"|\\')/g, '');
}

export function invert(obj: Object): Object {
  return Object.keys(obj).reduce((acc, key) => ({
    ...acc,
    [obj[key]]: key,
  }), {});
}

export const reduceIntoKeyPairs = (obj: Object, transform: (key, val) => Object) =>
  Object.keys(obj).reduce((acc, key) => ({
    ...acc,
    ...(transform(key, obj[key])),
  }), {});
