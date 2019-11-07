import React, { useState, useEffect } from "react";
import "@material/radio/dist/mdc.radio.css";
import "@material/form-field/dist/mdc.form-field.css";
import { Radio } from "@rmwc/radio";
import "@material/slider/dist/mdc.slider.css";
import { Slider } from "@rmwc/slider";
import {
  createSmallCanvas,
  createDotCanvas,
  createDotData,
  drawCanvas,
  createSheetData
} from "./helpers";
import Counter from "./Counter";

const App = () => {
  const [showSheets, setShowSheets] = useState(true);
  const [sourceImg, setSourceImg] = useState(null);
  const [currentSheetIndex, setCurrentSheetIndex] = useState(0);
  const [totalSheets, setTotalSheets] = useState(0);
  const [pixelSizeInMm, setPixelSizeInMm] = useState(10);
  const [totalDotSizes, setTotalDotSizes] = useState(16);
  const [totalPixels, setTotalPixels] = useState(32);
  const [dotSizeMutliplier, setDotSizeMutliplier] = useState(1.3);
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
      const sourcePixelCanvas = createSmallCanvas(
        sourceImg,
        totalPixels,
        totalPixels
      );

      let dotData = createDotData({
        sourcePixelCanvas,
        totalDotSizes
      });

      let canvasToshow;

      if (showSheets) {
        const sheetData = createSheetData({ dotData, pixelSizeInMm });
        const sheet = sheetData.sheets[currentSheetIndex];
        setTotalSheets(sheetData.sheets.length - 1);

        console.log("sheetData: ", sheetData);

        canvasToshow = createDotCanvas({
          dots: sheet.sheetDots,
          dotsWide: sheetData.pixelsPerSheetWidth,
          dotsHigh: sheetData.pixelsPerSheetHeight,
          pixelSizeInMm,
          dotSizeMutliplier
        });
      } else {
        canvasToshow = createDotCanvas({
          dots: dotData.dots,
          dotsWide: dotData.dotsWide,
          dotsHigh: dotData.dotsHigh,
          pixelSizeInMm,
          dotSizeMutliplier
        });
      }

      const ctx = canvasRef.current.getContext("2d");
      canvasRef.current.width = canvasToshow.width;
      canvasRef.current.height = canvasToshow.height;
      drawCanvas(ctx, canvasToshow);

      // updates slider layout - probably should be delayed until after canvas drawn
      window.dispatchEvent(new Event("resize"));
    }
  }, [
    showSheets,
    sourceImg,
    currentSheetIndex,
    pixelSizeInMm,
    totalDotSizes,
    totalPixels,
    dotSizeMutliplier
  ]);

  return (
    <div style={{ display: "flex" }}>
      <div style={{ padding: "10px 20px", flex: 1, minWidth: 500 }}>
        <div>
          <Radio checked={showSheets} onChange={e => setShowSheets(true)}>
            Show sheets
          </Radio>
          <Radio checked={!showSheets} onChange={e => setShowSheets(false)}>
            Show full image
          </Radio>
        </div>

        {showSheets && (
          <div>
            CURRENT SHEET:
            <Counter
              value={currentSheetIndex}
              setValue={setCurrentSheetIndex}
              min={0}
              max={totalSheets}
            />
          </div>
        )}

        <div>
          PIXEL SIZE: {pixelSizeInMm}mm
          <Slider
            value={pixelSizeInMm}
            min={1}
            max={60}
            discrete
            step={1}
            onInput={evt => setPixelSizeInMm(evt.detail.value)}
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
          <div>
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
