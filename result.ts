export interface Result<E, A> {
  match<T>(ok: (value: A) => T, err: (error: E) => T): T;
  orDefault(defaultValue: A): A;
  orThrow(f: Error | ((error: E) => Error)): A;
  then<B>(f: (value: A) => Result<E, B>): Result<E, B>;
  catch<F>(f: (error: E) => Result<F, A>): Result<F, A>;
  map<B>(f: (value: A) => B): Result<E, B>;
  mapError<F>(f: (error: E) => F): Result<F, A>;
  replace<B>(value: B): Result<E, B>;
}

class Ok<E, A> implements Result<E, A> {
  constructor(private value_: A) {}

  private swapErrType<F>(): Ok<F, A> {
    return this as any as Ok<F, A>;
  }

  match<T>(ok: (value: A) => T, err: (error: E) => T): T {
    return ok(this.value_);
  }

  orDefault(defaultValue: A): A {
    return this.value_;
  }

  orThrow(f: (error: E) => Error): A {
    return this.value_;
  }

  then<B>(f: (value: A) => Result<E, B>): Result<E, B> {
    return f(this.value_);
  }

  catch<F>(f: (error: E) => Result<F, A>): Result<F, A> {
    return this.swapErrType();
  }

  map<B>(f: (value: A) => B): Result<E, B> {
    return new Ok(f(this.value_));
  }

  mapError<F>(f: (error: E) => F): Result<F, A> {
    return this.swapErrType();
  }

  replace<B>(value: B): Result<E, B> {
    return new Ok(value);
  }
}

class Err<E, A> implements Result<E, A> {
  constructor(private error_: E) {}

  private swapOkType<B>(): Err<E, B> {
    return this as any as Err<E, B>;
  }

  match<T>(ok: (value: A) => T, err: (error: E) => T): T {
    return err(this.error_);
  }

  orDefault(defaultValue: A): A {
    return defaultValue;
  }

  orThrow(f: (error: E) => Error): A {
    throw f(this.error_);
  }

  then<B>(f: (value: A) => Result<E, B>): Result<E, B> {
    return this.swapOkType();
  }

  catch<F>(f: (error: E) => Result<F, A>): Result<F, A> {
    return f(this.error_);
  }

  map<B>(f: (value: A) => B): Result<E, B> {
    return this.swapOkType();
  }

  mapError<F>(f: (error: E) => F): Result<F, A> {
    return new Err(f(this.error_));
  }

  replace<B>(value: B): Result<E, B> {
    return this.swapOkType();
  }
}

export function ok<E, A>(value: A): Result<E, A> {
  return new Ok(value);
}
  
export function err<E, A>(error: E): Result<E, A> {
  return new Err(error);
}
