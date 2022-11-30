import { any, constant, eof, ParseError, Parser, reject, satisfy } from "./parser";
import { Result } from "./result";

export function parse<A>(p: Parser<A>, input: string): Result<ParseError, A> {
  return p.keepLeft(eof).runStep(input).map(({ value }) => value);
}

export function character(expected: string): Parser<string> {
  return satisfy(any, (ch) => ch === expected, (actual) => ({ expected, actual }));
}

function isWhitespace(ch: string): boolean {
  return ch.match(/\s/) != null;
}

export const whitespace1 = satisfy(any, isWhitespace, (actual) => ({ expected: "whitespace", actual }));
export const whitespace = many(whitespace1);
export const skipWhitespace = ignore(whitespace);

function isDigit(ch: string): boolean {
  return ch.match(/\d/) != null;
}

export const digit = satisfy(any, isDigit, (actual) => ({ expected: "digit", actual }));

export function str(s: string): Parser<string> {
  return sequence(s.split('').map(character)).map((chs) => chs.join('')).keepLeft(skipWhitespace);
}

export function symbol(s: string): Parser<string> {
  return str(s).keepLeft(whitespace);
}

export function choice<A>(description: string, ps: Parser<A>[]): Parser<A> {
  return ps.reduceRight((acc, p) => p.or(acc), reject({ expected: description, actual: "no match" }));
}

export function sequence<A>(ps: Parser<A>[]): Parser<A[]> {
  return ps.reduceRight((acc, p) => p.then((v1) => acc.map((vs) => [v1, ...vs])), constant([] as A[]));
}

export function ignore(p: Parser<any>): Parser<undefined> {
  return p.replace(undefined);
}

export function optional<A>(p: Parser<A>, defaultValue: A): Parser<A> {
  return p.or(constant(defaultValue));
}

export function many<A>(p: Parser<A>): Parser<A[]> {
  return optional(many1(p), []);
}

export function many1<A>(p: Parser<A>): Parser<A[]> {
  return p.then((a) => many(p).map((as) => [a, ...as]));
}

export function sepBy1<A, B>(p: Parser<A>, q: Parser<B>): Parser<A[]> {
  return p.then((a) => many(q.keepRight(p)).map((as) => [a, ...as]));
}

export function sepBy<A, B>(p: Parser<A>, q: Parser<B>): Parser<A[]> {
  return optional(sepBy1(p, q), []);
}

export function between<A>(open: Parser<any>, close: Parser<any>, p: Parser<A>): Parser<A> {
  return open.keepRight(p).keepLeft(close);
}

export function brackets<A>(p: Parser<A>): Parser<A> {
  return between(symbol("["), symbol("]"), p);
}

export function braces<A>(p: Parser<A>): Parser<A> {
  return between(symbol("{"), symbol("}"), p);
}

export function quotes<A>(p: Parser<A>): Parser<A> {
  return between(symbol("\""), symbol("\""), p);
}
