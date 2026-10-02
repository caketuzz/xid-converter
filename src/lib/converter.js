export function convert(value) {
  const input = value.trim().toLowerCase();
  if (input.length > 256) throw new Error("ID too long (256 characters maximum).");
  if (/^x[0-9a-z]+$/.test(input)) {
    let number = 0n;
    for (const char of input.slice(1)) {
      number = number * 36n + BigInt("0123456789abcdefghijklmnopqrstuvwxyz".indexOf(char));
    }
    return {input, result: number.toString(), label: "Integer"};
  }
  if (/^[0-9]+$/.test(input)) {
    return {input, result: "x" + BigInt(input).toString(36), label: "X-ID"};
  }
  throw new Error("Select an X-ID (x9yazc2) or a non-negative integer.");
}
