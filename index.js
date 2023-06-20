var { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
var path = require("path");
const express = require("express");
const app = express();

app.get('/', genImage);
// app.get('/:id/:scott', genImage);
app.get('/undertale/:text', genUTimage);
app.get('/homestuck/:text', genHSimage);

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

  const text = req.params.text ?? "Wow%2C%20you%20must%27ve%20really%20fucked%20something%20up"

  // Set img type
  res.set('Cache-Control', "public, max-age=300, s-maxage=600");
  res.set('Content-Type', 'image/png');

  // Create canvas
  const canvas = createCanvas(650, 450);
  const ctx = canvas.getContext('2d');

  const positions = [
    { // Center
      text: 84, width: 475, box: 56
    },
    { // left
      text: 84, width: 360, box: 56
    },
    { // right
      text: 250, width: 360, box: 90
    },
  ]

  // get images
  let bigbox = await loadImage(path.join(__dirname, `public`, `homestuck`, `dialogBoxBig.png`)).catch(() => "404");
  let smallbox = await loadImage(path.join(__dirname, `public`, `homestuck`, `dialogBoxSmall.png`)).catch(() => "404");
  let faces = await loadImage(path.join(__dirname, `public`, `homestuck`, `ob_karkat.png`)).catch(() => "404");

  GlobalFonts.registerFromPath(
		path.join(__dirname, `public`, `homestuck`, `COURBD.TTF`),
		'CourierNewBold',
	)

  // Determin face and lean
  const startReg = /^!\d*\s+/
  let lean = 0
  let face = 0
  if (startReg.test(text)) {
    lean = 2
    face = parseInt(text.match(startReg)[0].replace(/[^0-9]/g, ""))
    face = face ? face : 0
  }

  const pos = positions[lean]

  // Draw Textbox
  ctx.drawImage(bigbox, pos.box, 110)
  ctx.drawImage(smallbox, pos.box, 380)

  // Get text colour
  let textColor = "#626262"

  // Set text params
  ctx.font = "16px CourierNewBold"
  ctx.imageSmoothingEnabled = false;
  ctx.fillStyle = textColor

  // Draw main text
  let textTypes = text.split(/#(.*)/s)

  let bodyLines = getLines(ctx, textTypes[0].replace(startReg, ""), pos.width)
  bodyLines.forEach((line, i) => {
    ctx.fillText(line, pos.text, 150 + 16 * i)
  })

  // Draw Hashtag text
  ctx.fillStyle = "#000000"

  if (textTypes[1]) {
    let hashLines = getLines(ctx, "#" + textTypes[1], pos.width)
    hashLines.forEach((line, i) => {
      ctx.fillText(line, pos.text, (hashLines.length > 2 ? 400 : 408) + 16 * i)
    })
  }

  // Draw Character
  let sprite = { x: 175, y: 240 }

  if (lean == 2) {
    ctx.drawImage(faces, 0, sprite.y * face, sprite.x, sprite.y, -80, -15, sprite.x * 2, sprite.y * 2)
  }

  // Send Canvas
	res.send(await canvas.encode("png"));
	return;
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