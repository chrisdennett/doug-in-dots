export const drawDot = ({
  pixelSize,
  x,
  y,
  fractionSize,
  context,
  dotSizeMutliplier
}) => {
  let bgColour, dotColour;

  bgColour = "#FFF";
  dotColour = "#000";

  let dotSize = pixelSize * fractionSize * dotSizeMutliplier;

  // draw background
  context.fillStyle = bgColour;
  context.beginPath();
  context.rect(x, y, pixelSize, pixelSize);
  context.fill();
  const halfDotSize = dotSize * 0.5;

  context.fillStyle = dotColour;
  context.beginPath();
  context.arc(x, y, halfDotSize, 0, 2 * Math.PI);
  context.fill();
};

export const drawImageDot = ({
  pixelSize,
  dotImage,
  x,
  y,
  fractionSize,
  context,
  dotSizeMutliplier
}) => {
  let bgColour, dotColour;

  bgColour = "#FFF";
  dotColour = "#000";

  let dotSize = pixelSize * fractionSize * dotSizeMutliplier;

  context.save();
  // draw background
  context.fillStyle = bgColour;
  context.beginPath();
  context.rect(x, y, pixelSize, pixelSize);
  context.fill();
  context.closePath();

  // add a circle path to act as a clipping path
  const halfDotSize = dotSize * 0.5;
  context.fillStyle = dotColour;
  context.beginPath();
  context.arc(x + halfDotSize, y + halfDotSize, halfDotSize, 0, 2 * Math.PI);
  context.closePath();

  // set as clip
  context.clip();

  // add the image to be clipped
  context.drawImage(dotImage, x, y, dotSize, dotSize);

  context.restore();
};
