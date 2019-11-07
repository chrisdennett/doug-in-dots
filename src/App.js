import React, { useState, useEffect } from "react";
import "@material/slider/dist/mdc.slider.css";
import { Slider } from "@rmwc/slider";
import "@material/radio/dist/mdc.radio.css";
import "@material/form-field/dist/mdc.form-field.css";
import { Radio } from "@rmwc/radio";

const DOT_TYPES = ["round", "square", "triangle", "triangle2", "ring"];
const DOT_COLOUR_OPTIONS = [
  "black-on-white",
  "grey-on-white",
  "white-on-black",
  "random-on-white"
];

const App = () => {
  const [sourceImg, setSourceImg] = useState(null);
  const [dotSize, setDotSize] = useState(4);
  const [totalDotSizes, setTotalDotSizes] = useState(50);
  const [dotColourOption, setDotColourOption] = useState(DOT_COLOUR_OPTIONS[0]);
  const [totalPixels, setTotalPixels] = useState(100);
  const [dotSizeMutliplier, setDotSizeMutliplier] = useState(1.3);
  const [dotType, setDotType] = useState(DOT_TYPES[0]);
  const canvasRef = React.useRef(null);

  useEffect(() => {
    if (!sourceImg) {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = () => {
        setSourceImg(image);
      };
      image.src = "doug3.png";
    }

    if (sourceImg) {
      const smallCanvas = createSmallCanvas(
        sourceImg,
        totalPixels,
        totalPixels
      );
      const dotCanvas = createBlockCanvas(
        smallCanvas,
        dotSize,
        dotType,
        dotColourOption,
        totalDotSizes,
        dotSizeMutliplier
      );
      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = dotCanvas.width;
      canvasRef.current.height = dotCanvas.height;
      drawCanvas(ctx, dotCanvas);
    }
  });

  return (
    <div>
      <div style={{ padding: "10px 20px" }}>
        <div>
          DOT TYPE:
          {DOT_TYPES.map(type => (
            <Radio
              value={type}
              key={type}
              checked={dotType === type}
              onChange={evt => setDotType(evt.currentTarget.value)}
            >
              {type}
            </Radio>
          ))}
        </div>
        <div>
          BG / DOT COLOURS:
          {DOT_COLOUR_OPTIONS.map(colourOption => (
            <Radio
              value={colourOption}
              key={colourOption}
              checked={dotColourOption === colourOption}
              onChange={evt => setDotColourOption(evt.currentTarget.value)}
            >
              {colourOption}
            </Radio>
          ))}
        </div>
        <div>
          DOT SIZE: {dotSize}
          <Slider
            value={dotSize}
            min={1}
            max={60}
            discrete
            step={1}
            onInput={evt => setDotSize(evt.detail.value)}
          />
        </div>
        <div>
          SMALL CANVAS SIZE: {totalPixels}
          <Slider
            value={totalPixels}
            min={10}
            max={248}
            discrete
            step={1}
            onInput={evt => setTotalPixels(evt.detail.value)}
          />
        </div>
        <div>
          TOTAL DOT SIZES: {totalDotSizes}
          <Slider
            value={totalDotSizes}
            min={2}
            max={50}
            discrete
            step={1}
            onInput={evt => setTotalDotSizes(evt.detail.value)}
          />
        </div>
        <div>
          DOT SIZE MULTIPLIER: {dotSizeMutliplier}
          <Slider
            value={dotSizeMutliplier}
            min={0.1}
            max={2}
            discrete
            step={0.01}
            onInput={evt => setDotSizeMutliplier(evt.detail.value)}
          />
        </div>
      </div>
      <canvas
        ref={canvasRef}
        width={window.innerWidth}
        height={window.innerHeight}
      />
    </div>
  );
};

export default App;

const drawCanvas = (ctx, source) => {
  ctx.drawImage(source, 0, 0);
};

const createSmallCanvas = (source, maxWidth, maxHeight) => {
  const sourceW = source.width;
  const sourceH = source.height;

  const wToHRatio = sourceH / sourceW;
  const hToWRatio = sourceW / sourceH;

  // allow maxHeight or maxWidth to be null
  if (!maxWidth) maxWidth = source.width;
  if (!maxHeight) maxHeight = source.height;

  let targetW = maxWidth;
  let targetH = targetW * wToHRatio;

  if (sourceH > maxHeight) {
    targetH = maxHeight;
    targetW = targetH * hToWRatio;
  }

  const smallCanvas = document.createElement("canvas");
  const ctx = smallCanvas.getContext("2d");
  smallCanvas.width = targetW;
  smallCanvas.height = targetH;

  ctx.drawImage(source, 0, 0, sourceW, sourceH, 0, 0, targetW, targetH);

  return smallCanvas;
};

const createBlockCanvas = (
  inputCanvas,
  dotSize,
  dotType,
  dotColourOption,
  totalDotSizes,
  dotSizeMutliplier
) => {
  const { width: inputW, height: inputH } = inputCanvas;

  const blockSize = dotSize;
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = inputW * blockSize;
  outputCanvas.height = inputH * blockSize;
  const outputCtx = outputCanvas.getContext("2d");

  const inputCtx = inputCanvas.getContext("2d");
  let imgData = inputCtx.getImageData(0, 0, inputW, inputH);
  let pixels = imgData.data;

  let r, g, b, grey;

  const fractionBandSize = getFractionBand(totalDotSizes);

  for (let y = 0; y < inputH; y++) {
    for (let x = 0; x < inputW; x++) {
      const i = (y * inputW + x) * 4;

      r = pixels[i];
      g = pixels[i + 1];
      b = pixels[i + 2];

      //grey = (r + g + b) / 3;
      grey = r * 0.2126 + g * 0.7152 + b * 0.0722;

      const halfBlock = blockSize / 2;
      const xPos = x * blockSize + halfBlock;
      const yPos = y * blockSize + halfBlock;

      drawDot({
        type: dotType,
        brightness: grey,
        colourOption: dotColourOption,
        blockSize,
        x: xPos,
        y: yPos,
        context: outputCtx,
        fractionBandSize,
        dotSizeMutliplier
      });
    }
  }

  return outputCanvas;
};

const drawDot = ({
  type,
  colourOption,
  brightness,
  blockSize,
  x,
  y,
  context,
  fractionBandSize,
  dotSizeMutliplier
}) => {
  let bgColour, dotColour, dotSizeAsFraction;

  const darknessAsFraction = brightness / 255;
  const lightnessAsFraction = 1 - darknessAsFraction;

  if (colourOption === "black-on-white") {
    dotSizeAsFraction = lightnessAsFraction;
    bgColour = "#FFF";
    dotColour = "#000";
  } else if (colourOption === "grey-on-white") {
    dotSizeAsFraction = lightnessAsFraction;
    bgColour = "#FFF";
    dotColour = "#ddd";
  } else if (colourOption === "white-on-black") {
    dotSizeAsFraction = darknessAsFraction;
    bgColour = "#000";
    dotColour = "#FFF";
  } else if (colourOption === "random-on-white") {
    dotSizeAsFraction = lightnessAsFraction;
    bgColour = "#FFF";

    const h = Math.random() * 100;
    const s = 80;
    const l = 20;

    dotColour = `hsl(${h}, ${s}%, ${l}%)`;
  }

  const restrictedDotSizeFraction = getRestrictedValue(
    dotSizeAsFraction,
    fractionBandSize
  );

  let dotSize = blockSize * restrictedDotSizeFraction * dotSizeMutliplier;

  // draw background
  context.fillStyle = bgColour;
  context.beginPath();
  context.rect(x, y, blockSize, blockSize);
  context.fill();
  const halfBlockSize = blockSize * 0.5;
  const halfDotSize = dotSize * 0.5;
  const middleX = x + halfBlockSize;
  const middleY = y + halfBlockSize;

  if (type === "round") {
    context.fillStyle = dotColour;
    context.beginPath();
    context.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
    context.fill();
  } else if (type === "square") {
    context.fillStyle = dotColour;
    context.beginPath();
    context.rect(x, y, dotSize, dotSize);
    context.fill();
  } else if (type === "ring") {
    context.fillStyle = "#fff";
    context.strokeStyle = dotColour;
    context.beginPath();
    context.arc(x, y, dotSize / 2, 0, 2 * Math.PI);
    context.stroke();
    context.fill();
  } else if (type === "triangle2") {
    context.fillStyle = dotColour;
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x + dotSize, y + dotSize);
    context.lineTo(x, y + dotSize);
    context.fill();
  } else if (type === "triangle") {
    context.fillStyle = dotColour;
    context.beginPath();
    context.moveTo(middleX, middleY - halfDotSize);
    context.lineTo(middleX + halfDotSize, middleY + halfDotSize);
    context.lineTo(middleX - halfDotSize, middleY + halfDotSize);
    context.fill();
  }
};

const getFractionBand = (totalFactions = 10) => {
  return 1 / totalFactions;
};

const getRestrictedValue = (value, fractionBandSize) => {
  return Math.round(value / fractionBandSize) * fractionBandSize;
};
