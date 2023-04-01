var { createCanvas, loadImage } = require('@napi-rs/canvas');
var path = require("path");
const express = require("express");
const app = express();

app.get('/:id', genImage);
app.get('/:id/:scott', genImage);
app.get('/', genImage);

async function genImage (req, res) {
	// Get params
  let gameID = req.params.id ?? 620;
  let scottID = req.params.scott ?? Math.floor(Math.random() * 1);

	// Load image
	let space = await loadImage(path.join(__dirname, `public`, `space.png`)).catch(() => "404");

	// Set img type
  res.set('Cache-Control', "public, max-age=300, s-maxage=600");
  res.set('Content-Type', 'image/png');

	// Create canvas
  const canvas = createCanvas(650, 450);
  const ctx = canvas.getContext('2d');

	ctx.drawImage(space, 100, 0, 450, 450);	

	// Send Canvas
	res.send(await canvas.encode("png"));
	return;
}

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));