const COMMON_MOJIBAKE_REPLACEMENTS: Array<[string, string]> = [
  ["â€™", "’"],
  ["â€œ", "“"],
  ["â€", "”"],
  ["â€“", "–"],
  ["â€”", "—"],
  ["â€¦", "..."],
  ["Â", ""],
  ["ï¿½", "�"],
];

const looksLikeMojibake = (value: string) =>
  /Ã.|â.|Â|ï¿½/.test(value);

const tryLatin1ToUtf8 = (value: string): string => {
  try {
    const bytes = Uint8Array.from(
      Array.from(value).map((char) => char.charCodeAt(0) & 0xff)
    );
    return new TextDecoder("utf-8").decode(bytes);
  } catch {
    return value;
  }
};

export const fixTextEncoding = (value?: string | null): string => {
  if (!value) return "";

  let output = value;
  for (const [from, to] of COMMON_MOJIBAKE_REPLACEMENTS) {
    output = output.split(from).join(to);
  }

  if (looksLikeMojibake(output)) {
    const decoded = tryLatin1ToUtf8(output);
    if (decoded && !decoded.includes("�")) {
      output = decoded;
    }
  }

  return output;
};
