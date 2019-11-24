type AnyFunction = (...args: any[]) => any;

interface AnyObject {
  [key: string]: any;
}

const defaultPairs = ['(', ')', '[', ']', '{', '}', '"', "'", '`'];

const compose = (...fns: AnyFunction[]) =>
  fns.reduce((f, g) => (...args: AnyFunction[]) => f(g(...args)));

const removePairs = (opening: string, closing?: string) => (str: string) => {
  if (!closing) {
    closing = opening;
  }

  const regex = new RegExp(
    `${opening}([^${opening}]+(?=${closing}))${closing}`,
    'g'
  );
  return str.replace(regex, '');
};

const removeClosedPairs = compose(
  (str: string) => str.split(''),
  removePairs("'"),
  removePairs('"'),
  removePairs('`'),
  removePairs('\\{', '\\}'),
  removePairs('\\[', '\\]'),
  removePairs('\\(', '\\)')
);

export function getUnclosedPairs(str: string) {
  const trimmed = removeClosedPairs(str);
  return trimmed.filter((char: string) => defaultPairs.indexOf(char) > -1);
}

export function removeEscapedQuotes(str: string) {
  return str.replace(/(\\"|\\')/g, '');
}

export function invert(obj: AnyObject): AnyObject {
  return Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      [obj[key]]: key,
    }),
    {}
  );
}

export const reduceIntoKeyPairs = (
  obj: AnyObject,
  transform: (key: string, val: any) => AnyObject
) =>
  Object.keys(obj).reduce(
    (acc, key) => ({
      ...acc,
      ...transform(key, obj[key]),
    }),
    {}
  );
