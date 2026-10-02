import {test} from "node:test";
import assert from "node:assert/strict";
import {convert} from "../src/lib/converter.js";
test("exemples ES et MySQL", () => {
  for (const [xid, id] of [["x9yazc2", "601814882"], ["x9yazc6", "601814886"]]) {
    assert.equal(convert(xid).result, id);
    assert.equal(convert(id).result, xid);
  }
});
test("grands entiers : aucune perte de précision", () => {
  const id = "18446744073709551615";
  assert.equal(convert(convert(id).result).result, id);
});
test("normalisation, zéro et retenue base36", () => {
  assert.equal(convert(" X9YAZC2 ").result, "601814882");
  assert.equal(convert("0").result, "x0");
  assert.equal(convert("xz").result, "35");
  assert.equal(convert("36").result, "x10");
  assert.equal(convert("00036").result, "x10");
});
test("formats invalides rejetés sans conversion partielle", () => {
  for (const input of ["", "x", "-1", "12.3", "x9y!", "9yazc2", "123 456", "x9yazc2,", "1".repeat(257)]) assert.throws(() => convert(input));
});
