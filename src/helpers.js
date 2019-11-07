//
// converts source canvas into an array of dot data
export const createDotData = ({ sourcePixelCanvas, totalDotSizes = 255 }) => {
  const { width: inputW, height: inputH } = sourcePixelCanvas;

  const fractionBandSize = getFractionBand(totalDotSizes);

  const inputCtx = sourcePixelCanvas.getContext("2d");
  let imgData = inputCtx.getImageData(0, 0, inputW, inputH);
  let pixels = imgData.data;

  const dots = [];

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

      dots.push({
        fractionSize,
        xIndex: x,
        yIndex: y
      });
    }
  }

  const dotData = {
    dots,
    dotsWide: inputW,
    dotsHigh: inputH
  };

  return dotData;
};

// creates data for all the sheets (canvases) needed to create the full image
// defaults to A4 portrait sheets
export const createSheetData = ({
  dotData,
  pixelSizeInMm = 10,
  sheetWidthInMm = A4_PORTRAIT_WIDTH_IN_MM,
  sheetHeightInMm = A4_PORTRAIT_HEIGHT_IN_MM
}) => {
  const { dots, dotsWide, dotsHigh } = dotData;
  const fullImageWidthInMm = dotsWide * pixelSizeInMm;
  const fullImageHeightInMm = dotsHigh * pixelSizeInMm;

  const pixelsPerSheetWidth = Math.floor(sheetWidthInMm / pixelSizeInMm);
  const pixelsPerSheetHeight = Math.floor(sheetHeightInMm / pixelSizeInMm);

  const maxUseableWidthOnSheet = pixelsPerSheetWidth * pixelSizeInMm;
  const maxUseableHeightOnSheet = pixelsPerSheetHeight * pixelSizeInMm;

  const totalSheetsWide = Math.ceil(
    fullImageWidthInMm / maxUseableWidthOnSheet
  );
  const totalSheetsHigh = Math.ceil(
    fullImageHeightInMm / maxUseableHeightOnSheet
  );
  const totalSheets = totalSheetsWide * totalSheetsHigh;

  const sheets = [];

  for (
    let sheetRowIndex = 0;
    sheetRowIndex < totalSheetsHigh;
    sheetRowIndex++
  ) {
    for (
      let sheetColumnIndex = 0;
      sheetColumnIndex < totalSheetsWide;
      sheetColumnIndex++
    ) {
      //
      const startDotXIndex = sheetColumnIndex * pixelsPerSheetWidth;
      const endDotXIndex = startDotXIndex + (pixelsPerSheetWidth - 1);

      const startDotYIndex = sheetRowIndex * pixelsPerSheetHeight;
      const endDotYIndex = startDotYIndex + (pixelsPerSheetHeight - 1);
      const sheetDots = [];

      for (let dy = startDotYIndex; dy <= endDotYIndex; dy++) {
        for (let dx = startDotXIndex; dx <= endDotXIndex; dx++) {
          // get index from full dot array
          const dotIndex = dx + dotsWide * dy;

          if (dotIndex < dots.length && dx < dotsWide && dy < dotsHigh) {
            // make a sharllow copy of this dot to be safe
            let dot = Object.assign({}, dots[dotIndex]);
            dot.fullDotXIndex = dot.xIndex;
            dot.fullDotYIndex = dot.yIndex;
            dot.xIndex = dx - startDotXIndex;
            dot.yIndex = dy - startDotYIndex;
            sheetDots.push(dot);
          }
        }
      }

      const sheet = {
        sheetDots,
        rowIndex: sheetRowIndex,
        colIndex: sheetColumnIndex,
        startDotXIndex,
        startDotYIndex,
        endDotXIndex,
        endDotYIndex
      };
      sheets.push(sheet);
    }
  }

  const sheetData = {
    sheets,
    totalSheetsWide,
    totalSheetsHigh,
    totalSheets,
    fullImageWidthInMm,
    fullImageHeightInMm,
    pixelsPerSheetWidth,
    pixelsPerSheetHeight,
    maxUseableWidthOnSheet,
    maxUseableHeightOnSheet
  };

  return sheetData;
};

// uses the dot data to create a single canvas
export const createDotCanvas = ({
  dots,
  dotsWide,
  dotsHigh,
  pixelSizeInMm,
  dotSizeMutliplier
}) => {
  const pixelSize = mmToPixels(pixelSizeInMm);

  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = dotsWide * pixelSize;
  outputCanvas.height = dotsHigh * pixelSize;
  const outputCtx = outputCanvas.getContext("2d");

  const halfPixelSize = pixelSize / 2;

  dots.forEach(dot => {
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

export const drawCanvas = (ctx, source) => {
  ctx.drawImage(source, 0, 0);
};

export const createSmallCanvas = (source, maxWidth, maxHeight) => {
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

const PIXELS_PER_MM = 3.7795275591;
const A4_PORTRAIT_WIDTH_IN_MM = 210;
const A4_PORTRAIT_HEIGHT_IN_MM = 297;
export const mmToPixels = mm => mm * PIXELS_PER_MM;
export const pixelsToMms = pixels => pixels / PIXELS_PER_MM;
