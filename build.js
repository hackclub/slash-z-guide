const { hideHtmlFileExtensions = false } = require('./config.json');
const { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync } = require('fs');
const { marked } = require('marked');
const { join } = require('path');

let chapters = readdirSync(join(__dirname, 'guide')).filter(file => file.toLowerCase().endsWith('.md'));
try {
    rmSync(join(__dirname, 'docs'), { recursive: true });
    mkdirSync(join(__dirname, 'docs'));
    mkdirSync(join(__dirname, 'docs', 'chapters'));
} catch (err) {}

const chaptersObject = {};

for (const chapter of chapters) {
    const fileData = readFileSync(join(__dirname, 'guide', chapter), 'utf8');
    const chapterName = fileData.split('\n')[0].substring(2);
    const output = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>${chapterName}</title>
    <link rel="stylesheet" href="style.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hackclub/css@79ee8661dfe9ab17af7d35cd8d9d7373029a8919/theme.css" />
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/hackclub/css@79ee8661dfe9ab17af7d35cd8d9d7373029a8919/fonts.css" />

    <link rel="favicon" href="favicon.png" />
    <link rel="icon" href="favicon.png" />
    <link rel="shortcut icon" href="favicon.png" />
    <link rel="apple-touch-icon" href="favicon.png" />

    <link rel="apple-touch-startup-image" href="favicon.png">
    <meta name="apple-mobile-web-app-title" content="/z Guide">
    <meta name="apple-mobile-web-app-capable" content="yes">
    <meta name="apple-mobile-web-app-status-bar-style" content="default">
    <meta name="theme-color" content="#3d72d0">

    <meta property="og:title" content="/z Guide" />
    <meta name="twitter:title" content="/z Guide" />
    <meta
      name="description"
      content="A guide to getting started with /z."
    />
    <meta
      property="og:description"
      content="A guide to getting started with /z."
    />
    <meta
      name="twitter:description"
      content="A guide to getting started with /z."
    />
    <meta name="msapplication-TileColor" content="#3d72d0" />
</head>
<body>
${marked.parse(
    fileData.substring(fileData.indexOf('\n') + 1)
)}
</body>
</html>
    `;
    chaptersObject[chapterName] = '/chapters/' + chapter.substring(0, chapter.length - 3) + '.html';
    writeFileSync(join(__dirname, 'docs', 'chapters', chapter.substring(0, chapter.length - 3) + '.html'), output, 'utf8');
}

writeFileSync(
    join(__dirname, 'docs', 'index.html'),
    readFileSync(
        join(__dirname, 'index.html'), 'utf8'
    ).replace(`{"unknown_chapter":{}}`, JSON.stringify(chaptersObject)), 'utf8'
);

writeFileSync(
    join(__dirname, 'docs', 'favicon.png'),
    readFileSync(
        join(__dirname, 'favicon.png')
    )
);

writeFileSync(
    join(__dirname, 'docs', 'style.css'),
    readFileSync(
        join(__dirname, 'style.css')
    )
);