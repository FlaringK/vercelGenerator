var { createCanvas, loadImage } = require('@napi-rs/canvas');
var path = require("path");
const express = require("express");
const app = express();

app.get('/:name', genImage);
// app.get('/:id/:scott', genImage);
app.get('/', genImage);

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

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Server is running in port ${PORT}`));