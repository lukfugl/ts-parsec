import { err, ok, Result } from "./result";

export type ParseError = { expected: string, actual: string };
type PartialParse<A> = { rest: string, value: A };
type ParseResult<A> = Result<ParseError, PartialParse<A>>;

export interface Parser<A> {
  // heart
  runStep(input: string): ParseResult<A>;

  // monad
  then<B>(f: (value: A) => Parser<B>): Parser<B>;
  or(p: Parser<A>): Parser<A>; // catch-ish
  map<B>(f: (value: A) => B): Parser<B>;
  replace<B>(value: B): Parser<B>;

  // convenience
  keepRight<B>(p: Parser<B>): Parser<B>;
  keepLeft<B>(p: Parser<B>): Parser<A>;
}

class ConstantParser<A> implements Parser<A> {
  constructor(private value_: A) {}

  runStep(input: string): ParseResult<A> {
    return ok({ rest: input, value: this.value_ });
  }

  then<B>(f: (value: A) => Parser<B>): Parser<B> {
    return f(this.value_);
  }

  map<B>(f: (value: A) => B): Parser<B> {
    return new ConstantParser(f(this.value_));
  }

  keepRight<B>(p: Parser<B>): Parser<B> {
    return p;
  }

  replace<B>(value: B): Parser<B> {
    return new ConstantParser(value);
  }

  keepLeft<B>(p: Parser<B>): Parser<A> {
    return p.replace(this.value_);
  }

  or(p: Parser<A>): Parser<A> {
    return this;
  }
}

export function constant<A>(value: A): Parser<A> {
  return new ConstantParser(value);
}

class RejectParser<A> implements Parser<A> {
  constructor(private error_: ParseError) {}

  runStep(input: string): ParseResult<A> {
    return err(this.error_);
  }

  private swapType<B>(): RejectParser<B> {
    return this as any;
  }
  
  then<B>(f: (value: A) => Parser<B>): Parser<B> {
    return this.swapType();
  }

  map<B>(f: (value: A) => B): Parser<B> {
    return this.swapType();
  }

  keepRight<B>(p: Parser<B>): Parser<B> {
    return this.swapType();
  }

  replace<B>(value: B): Parser<B> {
    return this.swapType();
  }

  keepLeft<B>(p: Parser<B>): Parser<A> {
    return this;
  }

  or(p: Parser<A>): Parser<A> {
    return p;
  }
}

export function reject<A>(error: ParseError): Parser<A> {
  return new RejectParser(error);
}

class NaiveParser<A> implements Parser<A> {
  constructor(public readonly runStep: (input: string) => ParseResult<A>) {}
  
  then<B>(f: (value: A) => Parser<B>): Parser<B> {
    return new NaiveParser((input) =>
      this.runStep(input).then(({ rest, value }) =>
        f(value).runStep(rest)));
  }

  map<B>(f: (value: A) => B): Parser<B> {
    return this.then((value) => constant(f(value)));
  }

  keepRight<B>(p: Parser<B>): Parser<B> {
    return this.then(() => p);
  }

  replace<B>(value: B): Parser<B> {
    return this.keepRight(constant(value));
  }

  keepLeft<B>(p: Parser<B>): Parser<A> {
    return this.then((value) => p.replace(value));
  }

  or(p: Parser<A>): Parser<A> {
    return new NaiveParser((input) =>
      this.runStep(input).catch(() =>
        p.runStep(input)));
  }
}

export const any: Parser<string> = new NaiveParser((input) => {
  if (input.length > 0) {
    return ok({
      value: input[0],
      rest: input.substring(1),
    });
  } else {
    return err({
      expected: "any character",
      actual: "end of input",
    });
  }
});

export const eof: Parser<undefined> = new NaiveParser((input) => {
  if (input.length === 0) {
    return ok({
      value: undefined,
      rest: input,
    });
  } else {
    return err({
      expected: "end of input",
      actual: input[0],
    });
  }
});

export function satisfy<A>(p: Parser<A>, test: (value: A) => boolean, error: (value: A) => ParseError): Parser<A> {
  return p.then((value) => {
    if (test(value)) {
      return constant(value);
    } else {
      return reject(error(value));
    }
  });
}

// similar to constant(undefined), except forces non-immediate resolution via NaiveParser
export const noop: Parser<undefined> = new NaiveParser((input) => {
  return ok({ rest: input, value: undefined });
});
