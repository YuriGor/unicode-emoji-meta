 ## Emoji metadata in JSON format
 ### parsed from pages
[full-emoji-list.html](https://unicode.org/emoji/charts/full-emoji-list.html)
and
[emoji-list.html](https://unicode.org/emoji/charts/emoji-list.html)

### Example of emoji metada:
```json
{
  "category": "Smileys & Emotion",
  "section": "face-smiling",
  "n": "1",
  "code": "U+1F600",
  "text": "😀",
  "recentlyAdded": false,
  "name": "grinning face",
  "vendors": {
    "Appl": true,
    "Goog": true,
    "FB": true,
    "Wind": true,
    "Twtr": true,
    "Joy": true,
    "Sams": true,
    "GMail": true,
    "SB": false,
    "DCM": false,
    "KDDI": false
  },
  "tags": [
    "face",
    "grin",
    "grinning face"
  ],
  "keywords": [
    "face",
    "grin",
    "grinning"
  ]
},
```

### JSON files types:

`emoji-by-{field}.json` - emoji metadata indexed by {field}, formatted json
`emoji-by-{field}.min.json` - emojies metadata indexed by {field}, minified json
`emoji-by-{field}.index.json` - emoji unicode string indexed by {field}, formatted json
`emoji-by-{field}.min.json` - emojies unicode string indexed by {field}, minified json

Where {field}:
- text
- code
- name
- category
- section
- vendor
- tag
- keyword

### To update

```
git clone https://github.com/YuriGor/emoji-json.git
cd emoji-json
npm install
npm run fetch
npm run generate
```

correct output is not guaranteed,
because source html pages layout can be changed later.