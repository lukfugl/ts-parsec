export interface Option<A> {
    // destructuring
    match<T>(some: (value: A) => T, none: () => T): T;

    // unwrapping
    orDefault(defaultValue: A): A;
    orThrow(err: Error): A;

    // monad!
    then<B>(f: (value: A) => Option<B>): Option<B>;
    catch(f: () => Option<A>): Option<A>;

    // other...
    map<B>(f: (value: A) => B): Option<B>;
    replace<B>(value: B): Option<B>;
}

class Some<A> implements Option<A> {
  constructor(private value_: A) {}

  match<B>(some: (value: A) => B, none: () => B): B {
    return some(this.value_);
  }

  orDefault(defaultValue: A): A {
    return this.value_;
  }

  orThrow(err: Error): A {
    return this.value_;
  }

  then<B>(f: (value: A) => Option<B>): Option<B> {
    return f(this.value_);
  }

  catch(f: () => Option<A>): Option<A> {
    return this;
  }

  map<B>(f: (value: A) => B): Option<B> {
    return new Some(f(this.value_));
  }

  replace<B>(value: B): Option<B> {
    return new Some(value);
  }
}

export function some<A>(value: A): Option<A> {
  return new Some(value);
}

class None<A> implements Option<A> {
  swapType<B>(): None<B> {
    return this as any as None<B>;
  }

  match<B>(some: (value: A) => B, none: () => B): B {
    return none();
  }

  orDefault(defaultValue: A): A {
    return defaultValue;
  }

  orThrow(err: Error): A {
    throw err;
  }

  then<B>(f: (value: A) => Option<B>): Option<B> {
    return this.swapType();
  }

  catch(f: () => Option<A>): Option<A> {
    return f();
  }

  map<B>(f: (value: A) => B): Option<B> {
    return this.swapType();
  }

  replace<B>(value: B): Option<B> {
    return this.swapType();
  }
}

const none_ = new None();

export function none<A>(): Option<A> {
  return none_.swapType();
}
