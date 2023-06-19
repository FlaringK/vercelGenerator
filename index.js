var { createCanvas, loadImage, GlobalFonts } = require('@napi-rs/canvas');
var path = require("path");
const express = require("express");
const app = express();

app.get('/', genImage);
// app.get('/:id/:scott', genImage);
app.get('/undertale/:text', genUTimage);

const colRegex = /color=[^\s]+/

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

async function genUTimage (req, res) {

	const inText = req.params.text ?? "%21%20This%20is%20just%20color%3Dred%20a%20test%20ooo%20now%20I%27m%20red%5CnAnd%20this%20one%20which%20is%20really%20really%20really%20long%20and%20should%20take%20up%20at%20least%202%20textboxes%20please%2C%20oh%20good%20thank%20you%21%20I%20am%20very%20glad%20this%20worked%20and%20there%27s%20no%20%2A%20on%20this%20one%5Cn%211%20color%3Dcyan%20And%20this%20one%20would%20have%20a%20cool%20expression%20if%20I%20loaded%20it%5Cncolor%3D%234ac925%20B33%20%3C%20color%3D%23f2a400%20cool%20kat%5Cncolor%3Dlime%20color%3Dwhite%20cool%20coloured%20%2A"

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
      let exprIndex = /\d/.test(boxText.expression[0]) ? 8 : 0
      ctx.drawImage(faces, 0, 64 * exprIndex, 64, 64, 12, 14 + i * 160, 128, 128)
    }
    
    let lineStart = boxText.expression ? 142 : 32
    boxText.text.split("\n").forEach((line, j) => {

      let letterCount = 0
      line.split(" ").forEach(word => {
        if (colRegex.test(word)) {
          ctx.fillStyle = word.replace("color=", "")
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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));