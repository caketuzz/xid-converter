export function convert(value) {
  const input = value.trim().toLowerCase();
  if (input.length > 256) throw new Error("Identifiant trop long (256 caractères maximum).");
  if (/^x[0-9a-z]+$/.test(input)) {
    let number = 0n;
    for (const char of input.slice(1)) {
      number = number * 36n + BigInt("0123456789abcdefghijklmnopqrstuvwxyz".indexOf(char));
    }
    return {input, result: number.toString(), label: "Entier"};
  }
  if (/^[0-9]+$/.test(input)) {
    return {input, result: "x" + BigInt(input).toString(36), label: "X-ID"};
  }
  throw new Error("Sélectionne un X-ID (x9yazc2) ou un entier positif ou nul.");
}
