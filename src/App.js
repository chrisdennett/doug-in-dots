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
  const [pixelSize, setPixelSize] = useState(10);
  const [totalDotSizes, setTotalDotSizes] = useState(16);
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

      const dotData = createDotData({
        inputCanvas: smallCanvas,
        totalDotSizes
      });

      const dotCanvas = createDotCanvas({
        dotData,
        pixelSize: pixelSize,
        inputCanvas: smallCanvas,
        dotSizeMutliplier
      });

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
          DOT SIZE: {pixelSize}
          <Slider
            value={pixelSize}
            min={1}
            max={60}
            discrete
            step={1}
            onInput={evt => setPixelSize(evt.detail.value)}
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

const createDotCanvas = ({
  dotData,
  pixelSize,
  inputCanvas,
  dotSizeMutliplier
}) => {
  const { width: inputW, height: inputH } = inputCanvas;

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = inputW * pixelSize;
  outputCanvas.height = inputH * pixelSize;
  const outputCtx = outputCanvas.getContext("2d");

  const halfPixelSize = pixelSize / 2;

  dotData.forEach(dot => {
    const x = dot.xIndex * pixelSize + halfPixelSize;
    const y = dot.yIndex * pixelSize + halfPixelSize;

    drawDot({
      pixelSize,
      x,
      y,
      fractionSize: dot.fractionSize,
      context: outputCtx,
      dotSizeMutliplier
    });
  });

  return outputCanvas;
};

const drawDot = ({
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

const getFractionBand = (totalFactions = 10) => {
  return 1 / totalFactions;
};

const getRestrictedValue = (value, fractionBandSize) => {
  return Math.round(value / fractionBandSize) * fractionBandSize;
};

const createDotData = ({ inputCanvas, totalDotSizes = 255 }) => {
  const { width: inputW, height: inputH } = inputCanvas;

  const fractionBandSize = getFractionBand(totalDotSizes);

  const inputCtx = inputCanvas.getContext("2d");
  let imgData = inputCtx.getImageData(0, 0, inputW, inputH);
  let pixels = imgData.data;

  const dotData = [];

  for (let y = 0; y < inputH; y++) {
    for (let x = 0; x < inputW; x++) {
      const i = (y * inputW + x) * 4;

      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      //grey = (r + g + b) / 3;
      const brightness = r * 0.2126 + g * 0.7152 + b * 0.0722;

      const rawFractionSize = 1 - brightness / 255;
      const fractionSize = getRestrictedValue(
        rawFractionSize,
        fractionBandSize
      );

      dotData.push({
        fractionSize,
        xIndex: x,
        yIndex: y
      });
    }
  }

  return dotData;
};
