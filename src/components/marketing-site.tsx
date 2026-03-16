import fs from "node:fs";
import path from "node:path";

function readLandingHtml() {
  const filePath = path.join(process.cwd(), "index.html");
  const source = fs.readFileSync(filePath, "utf8");

  if (source.includes("<base ")) {
    return source;
  }

  return source.replace(
    "<head>",
    '<head><base target="_top" />',
  );
}

export function MarketingSite() {
  const srcDoc = readLandingHtml();

  return (
    <iframe
      title="Reviz AI Landing Page"
      srcDoc={srcDoc}
      style={{
        display: "block",
        width: "100%",
        minHeight: "100vh",
        border: "0",
        background: "#ffffff",
      }}
    />
  );
}
