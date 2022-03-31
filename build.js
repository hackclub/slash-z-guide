const config = require('./config.json');
const { readdirSync, readFileSync, mkdirSync, writeFileSync, rmSync } = require('fs');
const { marked } = require('marked');
const { join } = require('path');
const getIcon = require('./icons.js');

const args = process.argv.slice(1);
const iconsToReplace = {};
const repoArg = args.filter(arg => arg.startsWith('--githubrepo='));
const overrideArgs = args.filter(arg => arg.startsWith('--override_'));
overrideArgs.forEach(arg => config[arg.substring(11, arg.indexOf('='))] = arg.substring(arg.indexOf('=') + 1));
let github = repoArg.length ? repoArg[0].substring('--githubrepo='.length) : 'yodalightsabr/slashz-guide';

if (config.hideHtmlFileExtensions == 'true') config.hideHtmlFileExtensions = true;
if (config.hideHtmlFileExtensions == 'false') config.hideHtmlFileExtensions = false;

const {
    hideHtmlFileExtensions = false, // For configuration with different types of web servers
    urlPrefix = '' // For if you are hosting this on a subdirectory
} = config;

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
            subNumbers[mainNumber] -= 1;
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

function template (title, body, back, next, githubUrl, flags = []) {
    const matches = body.match(/\(\$ICON_.*?-.*?-.*?\)/g) || [];
    matches.forEach(match => {
        body = body.replace(match, iconsToReplace[match]);
    });
    return templateCode
        .replace(/\{\% urlprefix \%\}/g, urlPrefix)
        .replace('{% pagetitle %}', title == '0. Slash-Z Guide' ? '/z Guide' : '/z Guide - ' + title)
        .replace('{% pagetitle %}', title == '0. Slash-Z Guide' ? '/z Guide' : '/z Guide - ' + title)
        .replace('{% title %}', title)
        .replace('{% body %}', body)
        .replace('{% contents %}', contents)
        .replace('{% back %}', back)
        .replace('{% back %}', back)
        .replace('{% next %}', next)
        .replace('{% next %}', next)
        .replace('{% updated %}', Date.now())
        .replace('{% commiturl %}', (config.commitHash && github) ? `https://github.com/${github}/commit/${config.commitHash}` : (github ? `https://github.com/${github}/commits/master` : 'javascript: void 0;'))
        .replace('{% github %}', githubUrl)
        .replace('body-classname-flags-here', flags.join(' '));
}

chapters.forEach((chapterData, index) => {
    const chapter = chapterData.fileName;
    let { fileData, chapterName, number, chapterTitle } = chapterData;
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
    
    const matches = fileData.substring(fileData.indexOf('\n') + 1).match(/<icon:.*?(( color=".*?")|())(( \/)|())>/g) || [];
    matches.forEach(match => {
        let icon = match.substring(6, match.indexOf(" "));
        let color = match.includes("color=") ? (
            match.substring(match.indexOf("color=\"") + 7, 
            match.indexOf("color=\"") + 7 + match.substring(match.indexOf("color=\"") + 7)
            .indexOf('"'))
        ) : 'black';
        let size = match.includes("size=\"") ? (
            match.substring(
                match.indexOf("size=\"") + 6, 
                match.indexOf("size=\"") + 6 + match.substring(match.indexOf("size=\"") + 6)
                .indexOf('"')
            )
        ) : '32';
        let name = `($ICON_${icon}-${color}-${size})`;
        iconsToReplace[name] = getIcon(icon, color, size);
        fileData = fileData.replace(match, name);
    });

    const output = template(chapterName, marked.parse(
        fileData.substring(fileData.indexOf('\n') + 1)
    ), back, next, 'https://github.com/' + github + '/blob/master/guide/' + chapter, index == 0 ? ['hideback'] : (index == chapters.length - 1 ? ['hidenext'] : []));
    writeFileSync(join(__dirname, 'docs', 'chapters', chapter.substring(0, chapter.length - 3) + '.html'), output, 'utf8');
});

writeFileSync(
    join(__dirname, 'docs', 'favicon.png'),
    readFileSync(
        join(__dirname, 'favicon.png')
    )
);

writeFileSync(
    join(__dirname, 'docs', 'banner.png'),
    readFileSync(
        join(__dirname, 'banner.png')
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

writeFileSync(
    join(__dirname, 'docs', 'README.md'),
    `# /z Guide\n\n/z Guide Static Site`,
    'utf8'
);