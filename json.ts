import { braces, brackets, character, choice, digit, many, many1, optional, quotes, sepBy, sequence, str, symbol, whitespace } from "./basics";
import { any, noop, Parser, satisfy } from "./parser";

const neg = character("-").replace(-1);
const nonZeroDigit = satisfy(digit, (d) => d !== "0", (d) => ({ expected: "non-zero digit", actual: d }));
const zero = character("0").replace(0);
const positiveInteger = nonZeroDigit.then((d) => many(digit).map((ds) => parseInt([d, ...ds].join(''))));
const nonNegativeInteger = zero.or(positiveInteger);
const mantissa = character(".").keepRight(many1(digit)).map((ds) => parseFloat('0.' + ds.join('')));
export const jsonNumber = sequence([
  optional(neg, 1),
  nonNegativeInteger,
  optional(mantissa, 0.0)
]).map(([sgn, whole, decimal]) => sgn * (whole + decimal));

const jsonTrue = symbol("true").replace(true);
const jsonFalse = symbol("false").replace(false);
const jsonBoolean = choice("boolean", [jsonTrue, jsonFalse]);

const stringCharacter = choice("JSON string character", [
  str("\\n").replace("\n"),
  str("\\t").replace("\t"),
  str("\\\"").replace("\""),
  str("\\\\").replace("\\"),
  satisfy(any, (ch) => ch !== '"', (ch) => ({ expected: "not a quote", actual: ch })),
]);
const jsonString = quotes(many(stringCharacter)).map((chs) => chs.join('')).keepLeft(whitespace);

type JSONValue = number | boolean | string | object | JSONValue[];

function jsonEntry(f: () => Parser<JSONValue>): Parser<{ key: string, value: JSONValue }> {
  return jsonString.keepLeft(symbol(":")).then((key) => f().map((value) => ({ key, value })));
}

function jsonObject(f: () => Parser<JSONValue>): Parser<object> {
  return braces(sepBy(jsonEntry(f), symbol(","))).map((kvs) => kvs.reduce((obj, { key, value }) => (obj[key] = value, obj), {} as object));
}

function jsonArray(f: () => Parser<JSONValue>): Parser<JSONValue[]> {
  return noop.then(() => brackets(sepBy(f(), symbol(","))));
}

let json_: Parser<JSONValue> | undefined = undefined;
export function jsonGen(): Parser<JSONValue> {
  if (json_ === undefined) {
    json_ = choice("JSON value", [
      jsonNumber as Parser<JSONValue>,
      jsonBoolean as Parser<JSONValue>,
      jsonString as Parser<JSONValue>,
      jsonObject(jsonGen) as Parser<JSONValue>,
      jsonArray(jsonGen) as Parser<JSONValue>,
    ]);
  }
  return json_;
}

export const json = jsonGen();
