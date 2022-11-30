import { parse } from "./basics";
import { json } from "./json";

const input = '{ "a": [1, -23.4], "b\\nc\\"\\\\": true }';

parse(json, input).match(
  (value) => console.log(value),
  (error) => console.error(error),
);
