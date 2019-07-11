'use strict';

const fs = require('fs');
const _ = require('lodash');
const { JSDOM } = require('jsdom');

const ignoreKeywords = ['on', 'the', 'of', 'in', '<span', 'a', 'over', 'with'];

// https://unicode.org/emoji/charts/full-emoji-list.html
console.log('load and parse full-emoji-list.html', __dirname);
var html = fs
  .readFileSync(__dirname + '/full-emoji-list.html', 'utf-8')
  .replace(/src='[^']*'/g, '');
var document = new JSDOM(html).window.document;
console.log('select rows');
var rows = document.getElementsByTagName('TR');

var category, section, vendorsList;
var byText = {};
var byCode = {};
var byName = {};
var byCategory = {};
var bySection = {};
var byVendor = {};

console.log('iterate over rows');
for (let row of rows) {
  if (row.children[0].tagName == 'TH') {
    if (row.children[0].classList.contains('bighead')) {
      category = row.children[0].children[0].text;
      console.log('== ' + category + ' ==');
    } else if (row.children[0].classList.contains('mediumhead')) {
      section = row.children[0].children[0].text;
      console.log(' - ' + section);
    } else if (!vendorsList) {
      vendorsList = [];
      for (let th of row.children) {
        if (_.endsWith(th.children[0].href, '#col-vendor')) {
          vendorsList.push(th.children[0].text);
        }
      }
      console.log('vendors', vendorsList);
    }
    continue;
  }
  let name;
  let vendors = {};
  let recentlyAdded = false;
  if (row.children[3].colSpan > 1) {
    name = row.children[4].innerHTML;
    vendorsList.forEach((v) => {
      vendors[v] = false;
      for (let recent of row.children[3].children) {
        if (_.startsWith(recent.title, `[${v}]`)) {
          vendors[v] = true;
        }
      }
    });
  } else {
    for (let i = 3; i < 14; i++) {
      vendors[vendorsList[i - 3]] = !row.children[i].classList.contains('miss');
    }
    name = row.children[14].innerHTML;
  }
  if (_.startsWith(name, '⊛')) {
    recentlyAdded = true;
    name = name.substring(2);
  }
  let item = {
    category,
    section,
    n: row.children[0].innerHTML,
    code: row.children[1].children[0].text,
    text: row.children[2].innerHTML,
    recentlyAdded,
    name,
    vendors,
  };
  byName[item.name] = item;
  // console.log(item);
}
rows = null;

// https://unicode.org/emoji/charts/emoji-list.html
console.log('load and parse emoji-list.html');

html = fs
  .readFileSync(__dirname + '/emoji-list.html', 'utf-8')
  .replace(/src='[^']*'/g, '');
document = new JSDOM(html).window.document;
html = '';
console.log('select rows');
rows = document.getElementsByTagName('TR');
var byTag = {};
var byKeyword = {};
var allKeywords = {};

console.log('iterate over rows');
for (let row of rows) {
  if (row.children[0].tagName == 'TH') {
    continue;
  }
  let name = row.children[3].innerHTML;
  if (_.startsWith(name, '⊛')) {
    name = name.substring(2);
  }
  var strKwd = row.children[4].innerHTML.replace(/<[^>]*>/g, '');
  let tags = strKwd
    .split(' | ')
    .map(cleanTag)
    .filter(filterTag);
  let keywords = (strKwd + ' ' + name)
    .split(/[,:\s|-]/)
    .map(cleanTag)
    .filter(filterTag);
  keywords = keywords.filter((k) => !ignoreKeywords.includes(k));
  keywords = _.uniq(keywords);
  let item = byName[name];
  item.tags = tags;
  item.keywords = keywords;

  byCode[item.code] = item;
  byText[item.text] = item;
  byCategory[item.category] = byCategory[item.category] || [];
  byCategory[item.category].push(item);
  bySection[item.section] = bySection[item.section] || [];
  bySection[item.section].push(item);

  tags.forEach((t) => {
    byTag[t] = byTag[t] || [];
    byTag[t].push(item);
  });

  keywords.forEach((k) => {
    byKeyword[k] = byKeyword[k] || [];
    byKeyword[k].push(item);
  });

  _.each(item.vendors, (v, k) => {
    if (v) {
      byVendor[k] = byVendor[k] || [];
      byVendor[k].push(item);
    }
  });
}
document = null;
rows = null;
// console.log(allKeywords);

console.log('write JSON files');

fs.writeFileSync(
  __dirname + '/../emoji-by-text.json',
  JSON.stringify(byText, null, 2)
);

fs.writeFileSync(
  __dirname + '/../emoji-by-code.json',
  JSON.stringify(byCode, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-code.index.json',
  JSON.stringify(_.mapValues(byCode, 'text'), null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-name.json',
  JSON.stringify(byName, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-name.index.json',
  JSON.stringify(_.mapValues(byName, 'text'), null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-category.json',
  JSON.stringify(byCategory, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-category.index.json',
  JSON.stringify(_.mapValues(byCategory, (l) => _.map(l, 'text')), null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-section.json',
  JSON.stringify(bySection, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-section.index.json',
  JSON.stringify(_.mapValues(bySection, (l) => _.map(l, 'text')), null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-vendor.json',
  JSON.stringify(byVendor, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-vendor.index.json',
  JSON.stringify(_.mapValues(byVendor, (l) => _.map(l, 'text')), null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-tag.json',
  JSON.stringify(byTag, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-tag.index.json',
  JSON.stringify(_.mapValues(byTag, (l) => _.map(l, 'text')), null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-keyword.json',
  JSON.stringify(byKeyword, null, 2)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-keyword.index.json',
  JSON.stringify(_.mapValues(byKeyword, (l) => _.map(l, 'text')), null, 2)
);

fs.writeFileSync(
  __dirname + '/../emoji-by-text.min.json',
  JSON.stringify(byText)
);

fs.writeFileSync(
  __dirname + '/../emoji-by-code.min.json',
  JSON.stringify(byCode)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-code.index.min.json',
  JSON.stringify(_.mapValues(byCode, 'text'))
);
fs.writeFileSync(
  __dirname + '/../emoji-by-name.min.json',
  JSON.stringify(byName)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-name.index.min.json',
  JSON.stringify(_.mapValues(byName, 'text'))
);
fs.writeFileSync(
  __dirname + '/../emoji-by-category.min.json',
  JSON.stringify(byCategory)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-category.index.min.json',
  JSON.stringify(_.mapValues(byCategory, (l) => _.map(l, 'text')))
);
fs.writeFileSync(
  __dirname + '/../emoji-by-section.min.json',
  JSON.stringify(bySection)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-section.index.min.json',
  JSON.stringify(_.mapValues(bySection, (l) => _.map(l, 'text')))
);
fs.writeFileSync(
  __dirname + '/../emoji-by-vendor.min.json',
  JSON.stringify(byVendor)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-vendor.index.min.json',
  JSON.stringify(_.mapValues(byVendor, (l) => _.map(l, 'text')))
);
fs.writeFileSync(
  __dirname + '/../emoji-by-tag.min.json',
  JSON.stringify(byTag)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-tag.index.min.json',
  JSON.stringify(_.mapValues(byTag, (l) => _.map(l, 'text')))
);
fs.writeFileSync(
  __dirname + '/../emoji-by-keyword.min.json',
  JSON.stringify(byKeyword)
);
fs.writeFileSync(
  __dirname + '/../emoji-by-keyword.index.min.json',
  JSON.stringify(_.mapValues(byKeyword, (l) => _.map(l, 'text')))
);

console.log('done');

function cleanTag(tag) {
  tag = tag.toLowerCase();
  if (_.startsWith(tag, 'class=')) {
    tag = tag.split(/></)[1];
  }
  tag = _.trim(tag, '\'"“”()!');
  tag = tag.replace('</span>', '');
  if (tag == 'hugging') tag = 'hug';
  if (tag == 'clapping') tag = 'clap';
  if (tag == 'flexed') tag = 'flex';
  return tag;
}

function filterTag(tag) {
  return tag != '';
}
