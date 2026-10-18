export function csvText(rows: (string | number)[][]) {
  const encode = (value: string | number) => {
    let text = String(value);
    if (
      typeof value === "string" &&
      (/^[\s]*[=+@-]/.test(text) || /^[\t\r\n]/.test(text))
    )
      text = "'" + text;
    return '"' + text.replaceAll('"', '""') + '"';
  };
  return "\uFEFF" + rows.map((row) => row.map(encode).join(",")).join("\r\n");
}
