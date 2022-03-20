const {
    hideHtmlFileExtensions = false, // For configuration with different types of web servers
    urlPrefix = '' // For if you are hosting this on a subdirectory
} = require('./config.json');
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

let subNumbers = {};
chapters = chapters.map(chapter => {
    const fileData = readFileSync(join(__dirname, 'guide', chapter), 'utf8');
    const chapterName = fileData.split('\n')[0].substring(2);
    const number = parseFloat(chapterName.substring(0, chapterName.indexOf('. ')));
    const mainNumber = Math.floor(number);
    const subNumber = number - mainNumber;
    if (!subNumbers[mainNumber]) subNumbers[mainNumber] = 0;
    if (subNumber) subNumbers[mainNumber]++;
    const chapterTitle = chapterName.substring(chapterName.indexOf('. ') + 2);
    return {
        fileData,
        fileName: chapter,
        chapterName,
        number,
        mainNumber,
        subNumber,
        chapterTitle
    }
}).sort((a, b) => a.number - b.number);

chapters.forEach(({ chapterTitle, fileName: chapter }) => {
    chaptersObject[chapterTitle] = urlPrefix + '/chapters/' + chapter.substring(0, chapter.length - 3) + (hideHtmlFileExtensions ? '' : '.html');
});

const chapterLinks = Object.values(chaptersObject);

writeFileSync(
    join(__dirname, 'docs', 'index.html'),
    readFileSync(
        join(__dirname, 'index.html'), 'utf8'
    ).replace(`{"unknown_chapter":{}}`, JSON.stringify(chaptersObject)), 'utf8'
);

const templateCode = readFileSync(join(__dirname, 'docs', 'index.html'), 'utf8');

let contents = ``;
for (const chapter of chapters) {
    const { mainNumber, subNumber, chapterTitle } = chapter;
    if (subNumber) {
        if (subNumbers[mainNumber]) {
            contents += `<li><a href="${chaptersObject[chapterTitle]}">${chapterTitle}</a></li>`;
            subNumbers -= 1;
            if (subNumbers[mainNumber] == 0) contents += `</ol></li>`
        } else {
        }
    } else {
        if (subNumbers[mainNumber]) {
            contents += `<li><a href="${chaptersObject[chapterTitle]}">${chapterTitle}</a><ol>`;
        } else {
            contents += `<li><a href="${chaptersObject[chapterTitle]}">${chapterTitle}</a></li>`;
        }
    }
}

function template (title, body, back, next, github, flags = []) {
    return templateCode.replace('{% urlprefix %}', urlPrefix).replace('{% pagetitle %}', title == '0. Slash-Z Guide' ? '/z Guide' : '/z Guide - ' + title).replace('{% title %}', title).replace('{% body %}', body).replace('{% contents %}', contents).replace('{% back %}', back).replace('{% next %}', next).replace('{% github %}', github).replace('body-classname-flags-here', flags.join(' '));
}

chapters.forEach((chapterData, index) => {
    const chapter = chapterData.fileName;
    const { fileData, chapterName, number, chapterTitle } = chapterData;
    const output0 = `<!DOCTYPE html>
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
    const back = chapterLinks[chapterLinks.indexOf(chaptersObject[chapterTitle]) - 1];
    const next = chapterLinks[chapterLinks.indexOf(chaptersObject[chapterTitle]) + 1];
    const output = template(chapterName, marked.parse(
        fileData.substring(fileData.indexOf('\n') + 1)
    ), back, next, 'https://github.com/YodaLightsabr/slashz-guide/blob/master/guide/' + chapter, index == 0 ? ['hideback'] : (index == chapters.length - 1 ? ['hidenext'] : []));
    writeFileSync(join(__dirname, 'docs', 'chapters', chapter.substring(0, chapter.length - 3) + '.html'), output, 'utf8');
});

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

writeFileSync(
    join(__dirname, 'docs', 'index.html'),
    readFileSync(
        join(__dirname, 'docs', 'chapters', 'index.html')
    )
);