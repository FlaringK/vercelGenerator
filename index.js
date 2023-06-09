var { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
var path = require("path");
const express = require("express");
const app = express();

app.get('/', genImage);
// app.get('/:id/:scott', genImage);
app.get('/undertale/:text', genUTimage);
app.get('/homestuck/:text', genHSimage);
app.get('/homestuck/:char/:text', genHSimage);

const colRegex = /color=[^\s]+/i

async function genImage (req, res) {
	// Get params
  let name = req.params.name ?? "";

	// Load image
	let space = await loadImage(path.join(__dirname, `public`, `space.png`)).catch(() => "404");

	// Set img type
  res.set('Cache-Control', "public, max-age=300, s-maxage=600");
  res.set('Content-Type', 'image/png');

	// Create canvas
  const canvas = createCanvas(650, 450);
  const ctx = canvas.getContext('2d');

	// Set fonts
	ctx.font = "bold 48px 'courier new'";

	// Draw img
	ctx.drawImage(space, 100, 0, 450, 450);
	ctx.fillText(name, 10, 10)
	

	// Send Canvas
	res.send(await canvas.encode("png"));
	return;
}

/* UNDERTALE */

async function genUTimage (req, res) {

	const inText = req.params.text ?? "Wow%2C%20you%20must%27ve%20really%20fucked%20something%20up"

	// Set img type
  res.set('Cache-Control', "public, max-age=300, s-maxage=600");
  res.set('Content-Type', 'image/png');

	// Process Text
	textArray = processUTtext(decodeURI(inText))

	// Create canvas
  const canvas = createCanvas(586, 160 * textArray.length)
  const ctx = canvas.getContext('2d')

	// Load assets
	let faces = await loadImage(path.join(__dirname, `public`, `chara.png`)).catch(() => "404");
	let textbox = await loadImage(path.join(__dirname, `public`, `tb_basic.png`)).catch(() => "404");

	GlobalFonts.registerFromPath(
		path.join(__dirname, `public`, `DeterminationMonoWebRegular-Z5oq.ttf`),
		'dt',
	)
	
	ctx.textBaseline = 'alphabetic'
  ctx.font = "32px dt"
  ctx.imageSmoothingEnabled = false;


	// Draw textbox
  for (let i = 0; i < textArray.length; i++) {
    ctx.drawImage(textbox, 4, 4 + 160 * i)
  }

  // Draw text
  textArray.forEach((boxText, i) => {

    if (boxText.expression) {
      let exprIndex = /\d/.test(boxText.expression[0]) ? parseInt(boxText.expression[0].replace(/[^0-9]/g, "")) : 0
      ctx.drawImage(faces, 0, 64 * exprIndex, 64, 64, 12, 14 + i * 160, 128, 128)
    }
    
    let lineStart = boxText.expression ? 142 : 32
    boxText.text.split("\n").forEach((line, j) => {

      let letterCount = 0
      line.split(" ").forEach(word => {
        if (colRegex.test(word)) {
          ctx.fillStyle = word.replace(/color=/i, "")
        } else {
          ctx.fillText(word + " ", lineStart + letterCount * 16, 50 + i * 160 + j * 38)
          letterCount += word.length + 1
        }
      })
      
    })

  })
  
	// Send Canvas
	res.send(await canvas.encode("png"));
	return;
}

let processUTtext = inText => {

	let textArray = []

	inText.split("\n").forEach(line => {
    let outText = "color=white * "
    let textExpression = line.match(/^!\d*\s+/gm)
    let maxChars = textExpression ? 23 : 32
    let words = line.replace(/^!\d*\s+/gm, "").split(" ")
    let letterCount = 0
    let lineCount = 0

    // Add first word to avoid first line break problem
    if (colRegex.test(words[0])) {
      outText = words.shift() + " * "
    } else {
      letterCount += words[0].length + 1
      outText += words.shift() + " "
    }

    words.forEach(word => {

      if (colRegex.test(word)) { // If word is a colour changer
        outText += word + " "
      } else {
        // Check if word goes past textbox
        if (letterCount + word.length > maxChars) { // if so add line break
          outText += "\n  "
          lineCount += 1
          letterCount = 0

          // If over 3 lines add new textbox with the same expression & reset outtext
          if (lineCount == 3) {
            textArray.push({
              text: outText,
              expression: textExpression
            })
            outText = "  "
            lineCount = 0
          }
        }
        
        outText += word + " "
        letterCount += word.length + 1
      }

    })

    // Add final outtext to expression
    textArray.push({
      text: outText,
      expression: textExpression
    })
  });

	return textArray

}

/* HOMESTUCK */

async function genHSimage (req, res) {

  // Set img type
  res.set('Cache-Control', "public, max-age=300, s-maxage=600");
  res.set('Content-Type', 'image/png');

  // Consts
  let dimentions = {
    default: {
      x: 0, y: 0, ox: 0, oy: 0, scale: 0, 
      width: 650, height: 450, lineHeight: 16,
      pos: { text: 84, width: 475, box: 56, height: 110, }, 
    },
    ob: { 
      x: 180, y: 240, ox: -90, oy: -15, scale: 2, 
      width: 650, height: 450, lineHeight: 16,
      pos: { text: 250, width: 360, box: 90, height: 110, }, 
    },
    bdth: { 
      x: 375, y: 325, ox: 340, oy: 0, scale: 2, 
      width: 930, height: 650, lineHeight: 20,
      pos: { text: 48, width: 400, box: 18, height: 180, }, 
      credx: 60, credy: 625
    }
  }

  const credits = {
    bdth: "'Burning Down The House' by Victoria Lacroix\n        https://burningdownthehou.se/"
  }

  const characters = {
    default: { col: "black", sprite: "ob_karkat.png", dim: dimentions.default },
    
    rose: { col: "#b536da", sprite: "ob_rose.png", dim: dimentions.ob, handle: "ROSE" },
    dave: { col: "#e00707", sprite: "ob_dave.png", dim: dimentions.ob, handle: "DAVE" },
    karkat: { col: "#626262", sprite: "ob_karkat.png", dim: dimentions.ob, handle: "KARKAT" },
    nepeta: { col: "#416600", sprite: "ab_nepeta.png", dim: dimentions.ob, handle: "NEPETA" },
    kanaya: { col: "#008141", sprite: "ob_kanaya.png", dim: dimentions.ob, handle: "KANAYA" },
    vriska: { col: "#005682", sprite: "ab_vriska.png", dim: dimentions.ob, handle: "VRISKA" },

    bdthJune: { col: "#0715cd", sprite: "bdth_june.png", dim: dimentions.bdth, handle: "JUNE", credit: credits.bdth },
    bdthRose: { col: "#b536da", sprite: "bdth_rose.png", dim: dimentions.bdth, handle: "ROSE", credit: credits.bdth },
    bdthDave: { col: "#e00707", sprite: "bdth_dave.png", dim: dimentions.bdth, handle: "DAVE", credit: credits.bdth },
    bdthJade: { col: "#4ac925", sprite: "bdth_jade.png", dim: dimentions.bdth, handle: "JADE", credit: credits.bdth },
    bdthJane: { col: "#00d5f2", sprite: "bdth_jane.png", dim: dimentions.bdth, handle: "JANE", credit: credits.bdth },
    bdthJake: { col: "#1f9400", sprite: "bdth_jake.png", dim: dimentions.bdth, handle: "JAKE", credit: credits.bdth },
    bdthRoxy: { col: "#ff6ff2", sprite: "bdth_roxy.png", dim: dimentions.bdth, handle: "ROXY", credit: credits.bdth },
    bdthDirk: { col: "#f2a400", sprite: "bdth_dirk.png", dim: dimentions.bdth, handle: "DIRK", credit: credits.bdth },
    bdthAradia: { col: "#a10000", sprite: "bdth_aradia.png", dim: dimentions.bdth, handle: "ARADIA", credit: credits.bdth },
    bdthTavros: { col: "#a15000", sprite: "bdth_tavros.png", dim: dimentions.bdth, handle: "TAVROS", credit: credits.bdth },
    bdthSollux: { col: "#a1a100", sprite: "bdth_sollux.png", dim: dimentions.bdth, handle: "SOLLUX", credit: credits.bdth },
    bdthKarkat: { col: "#626262", sprite: "bdth_karkat.png", dim: dimentions.bdth, handle: "KARKAT", credit: credits.bdth },
    bdthKanaya: { col: "#008141", sprite: "bdth_kanaya.png", dim: dimentions.bdth, handle: "KANAYA", credit: credits.bdth },
    bdthTerezi: { col: "#008282", sprite: "bdth_terezi.png", dim: dimentions.bdth, handle: "TEREZI", credit: credits.bdth },
    
    bdthCalliope: { col: "#929292", sprite: "bdth_.calliopepng", dim: dimentions.bdth, handle: "CALLIOPE", credit: credits.bdth },
    bdthDavesprite: { col: "#f2a400", sprite: "bdth_davesprite.png", dim: dimentions.bdth, handle: "DAVESPRITE", credit: credits.bdth },
  }

  const text = req.params.text ?? "Wow%2C%20you%20must%27ve%20really%20fucked%20something%20up"
  const char = characters[req.params.char] ?? characters.default

  // Create canvas
  const canvas = createCanvas(char.dim.width, char.dim.height);
  const ctx = canvas.getContext('2d');

  // get images
  let bigbox = await loadImage(path.join(__dirname, `public`, `homestuck`, `dialogBoxBig.png`)).catch(() => "404");
  let smallbox = await loadImage(path.join(__dirname, `public`, `homestuck`, `dialogBoxSmall.png`)).catch(() => "404");
  let faces = await loadImage(path.join(__dirname, `public`, `homestuck`, char.sprite)).catch(() => "404");

  GlobalFonts.registerFromPath(
		path.join(__dirname, `public`, `homestuck`, `COURBD.TTF`),
		"'Courier New'",
	)

  // EVERYTHING PAST THIS POINT IS IDENTICAL
  // Determin face
  const startReg = /^!\d*\s+/
  let face = 0
  if (startReg.test(text)) {
    face = parseInt(text.match(startReg)[0].replace(/[^0-9]/g, ""))
    face = face ? face : 0
  }

  const pos = char.dim.pos

  // BEGIN DRAWING
  // Draw Textbox
  ctx.drawImage(bigbox, pos.box, pos.height)
  ctx.drawImage(smallbox, pos.box, pos.height + 270)

  // Draw text
  ctx.font = "bold 16px 'Courier New'"
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = char.col

  // Draw main text
  let textTypes = text.split(/#(.*)/s)

  let mainlines = textTypes[0].replace(startReg, "").trim()
  if (char.handle) {
    mainlines = mainlines.replace(/(\n|^)/g, "$1" + char.handle + ": ")
  }

  let bodyLines = splitLines(ctx, mainlines, pos.width)
  bodyLines.forEach((line, i) => {
    ctx.fillText(line, pos.text, pos.height + 40 + char.dim.lineHeight * i)
  })

  // Draw Hashtag text
  ctx.fillStyle = "#000000"

  if (textTypes[1]) {
    let hashLines = splitLines(ctx, "#" + textTypes[1].trim(), pos.width)
    hashLines.forEach((line, i) => {
      ctx.fillText(line, pos.text, (hashLines.length > 2 ? pos.height + 290 : pos.height + 298) + 16 * i)
    })
  }

  // Draw Character
  let sprite = char.dim

  ctx.drawImage(faces, 0, sprite.y * face, sprite.x, sprite.y, sprite.ox, sprite.oy, sprite.x * sprite.scale, sprite.y * sprite.scale)

  // Draw credits
  if (char.credit) {
    let creds = char.credit.split("\n")
    ctx.fillText(creds[0], sprite.credx, sprite.credy)
    ctx.fillText(creds[1], sprite.credx, sprite.credy + sprite.lineHeight)
  }

  // Send Canvas
	res.send(await canvas.encode("png"));
	return;
}

const splitLines = (ctx, text, maxWidth) => {
  let strings = text.split("\n")
  let lines = []

  strings.forEach(string => {
    lines = lines.concat(getLines(ctx, string, maxWidth))
  })

  return lines
}

// https://stackoverflow.com/questions/2936112/text-wrap-in-a-canvas-element
const getLines = (ctx, text, maxWidth) => {
  var words = text.split(" ");
  var lines = [];
  var currentLine = words[0];

  for (var i = 1; i < words.length; i++) {
      var word = words[i];
      var width = ctx.measureText(currentLine + " " + word).width;
      if (width < maxWidth) {
          currentLine += " " + word;
      } else {
          lines.push(currentLine);
          currentLine = word;
      }
  }
  lines.push(currentLine);
  return lines;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));