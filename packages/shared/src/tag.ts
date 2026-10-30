const TAG_REGEX = /^#[0289PYLQGRJCUV]{3,12}$/;

/** " #2pp o " → "#2PP0": tira espaços, põe maiúsculas, troca a letra O por zero e garante o #. */
export function normalizeTag(input: string): string {
  return input.replace(/\s/g, "").toUpperCase().replace(/O/g, "0").replace(/^#?/, "#");
}

export function isValidTag(tag: string): boolean {
  return TAG_REGEX.test(tag);
}
