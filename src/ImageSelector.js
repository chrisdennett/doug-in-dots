import React, { useState, useEffect } from "react";
import styled from "styled-components";

const ImageSelector = ({ onChange }) => {
  const canvasRef = React.createRef();
  const [sourceImg, setSourceImg] = useState(null);

  useEffect(() => {
    if (!sourceImg) {
      const image = new Image();
      image.crossOrigin = "Anonymous";
      image.onload = () => {
        setSourceImg(image);
      };
      image.src = "don-t-panic.jpg";
      copyToCanvas(image, canvasRef.current, false);

      onChange(canvasRef.current);
    }
  });

  const handleSubmit = e => {
    e.preventDefault();
  };

  const handleImageChange = e => {
    e.preventDefault();

    if (e.target.files[0]) {
      const imgFile = e.target.files[0];

      createCanvasFromFile(imgFile, canvas => {
        copyToCanvas(canvas, canvasRef.current, false);

        onChange(canvasRef.current);
      });
    }
  };

  return (
    <ImageSelectorHolder>
      <form onSubmit={handleSubmit}>
        <input type={"file"} onChange={handleImageChange} />
        <input type="submit" value="ADD DOT" />
      </form>
      <canvas ref={canvasRef} width={100} height={100} />
    </ImageSelectorHolder>
  );
};

export default ImageSelector;

const ImageSelectorHolder = styled.div`
  padding: 20px;
`;

const maxOutputCanvasSize = 500;

const createCanvasFromFile = (file, callback) => {
  getImage(file, (sourceImg, imgOrientation) => {
    const maxWidthCanvas = createMaxSizeCanvas(
      sourceImg,
      maxOutputCanvasSize,
      maxOutputCanvasSize
    );
    const canvas = createOrientatedCanvas(maxWidthCanvas, imgOrientation);

    callback(canvas);
  });
};

const getImage = (imgFile, callback) => {
  getPhotoOrientation(imgFile, orientation => {
    const reader = new FileReader();

    reader.onload = e => {
      const imgSrc = e.target.result;
      // Create a new image element
      let img = new Image();
      img.setAttribute("crossOrigin", "anonymous"); //
      img.src = imgSrc;

      // wait for it to be loaded and then return
      img.onload = e => {
        const w = img.width;
        const h = img.height;

        const widthToHeightRatio = h / w;
        const heightToWidthRatio = w / h;

        callback(img, orientation, widthToHeightRatio, heightToWidthRatio);
      };
    };
    reader.readAsDataURL(imgFile);
  });
};

const getPhotoOrientation = (file, callback) => {
  const reader = new FileReader();
  reader.onload = e => {
    const view = new DataView(e.target.result);

    if (view.getUint16(0, false) !== 0xffd8) return callback(-2);
    const length = view.byteLength;
    let offset = 2;
    while (offset < length) {
      let marker = view.getUint16(offset, false);
      offset += 2;
      if (marker === 0xffe1) {
        offset += 2;
        if (view.getUint32(offset, false) !== 0x45786966) return callback(-1);

        const little = view.getUint16((offset += 6), false) === 0x4949;
        offset += view.getUint32(offset + 4, little);
        const tags = view.getUint16(offset, little);
        offset += 2;
        for (let i = 0; i < tags; i++)
          if (view.getUint16(offset + i * 12, little) === 0x0112)
            return callback(view.getUint16(offset + i * 12 + 8, little));
      } else if ((marker & 0xff00) !== 0xff00) break;
      else offset += view.getUint16(offset, false);
    }
    return callback(-1);
  };
  reader.readAsArrayBuffer(file);
};

const createMaxSizeCanvas = (
  inputCanvas,
  _maxWidth = 1000,
  _maxHeight = 1000
) => {
  const { width: inputWidth, height: inputHeight } = inputCanvas;
  const maxWidth = _maxWidth ? _maxWidth : inputWidth;
  const maxHeight = _maxHeight ? _maxHeight : inputHeight;

  // get width and height restricted to maximums
  const { width: outputWidth, height: outputHeight } = getDimensionsToFit(
    inputWidth,
    inputHeight,
    maxWidth,
    maxHeight
  );

  // set up the output canvas
  const outputCanvas = document.createElement("canvas");
  outputCanvas.width = outputWidth;
  outputCanvas.height = outputHeight;

  // draw input to output at the restricted size
  const ctx = outputCanvas.getContext("2d");
  ctx.drawImage(
    inputCanvas,
    0,
    0,
    inputWidth,
    inputHeight,
    0,
    0,
    outputWidth,
    outputHeight
  );

  return outputCanvas;
};

const createOrientatedCanvas = (sourceCanvas, orientation) => {
  const outputCanvas = document.createElement("canvas");
  const isPortrait = orientation > 4 && orientation < 9;

  // switch height and width if it's portrait
  let canvasW = isPortrait ? sourceCanvas.height : sourceCanvas.width;
  let canvasH = isPortrait ? sourceCanvas.width : sourceCanvas.height;

  const ctx = outputCanvas.getContext("2d");

  outputCanvas.width = canvasW;
  outputCanvas.height = canvasH;

  // transform context before drawing image
  switch (orientation) {
    case 2:
      ctx.transform(-1, 0, 0, 1, canvasW, 0);
      break;

    case 3:
      ctx.transform(-1, 0, 0, -1, canvasW, canvasH);
      break;

    case 4:
      ctx.transform(1, 0, 0, -1, 0, canvasH);
      break;

    case 5:
      ctx.transform(0, 1, 1, 0, 0, 0);
      break;
    case 6:
      ctx.transform(0, 1, -1, 0, canvasW, 0);
      break;
    case 7:
      ctx.transform(0, -1, -1, 0, canvasW, canvasH);
      break;
    case 8:
      ctx.transform(0, -1, 1, 0, 0, canvasH);
      break;
    default:
      break;
  }

  ctx.drawImage(sourceCanvas, 0, 0);

  return outputCanvas;
};

const copyToCanvas = (inputCanvas, outputCanvas, resizeCanvas = true) => {
  const { width: inputWidth, height: inputHeight } = inputCanvas;

  if (resizeCanvas) {
    outputCanvas.width = inputWidth;
    outputCanvas.height = inputHeight;
  }

  const ctx = outputCanvas.getContext("2d");
  ctx.drawImage(
    inputCanvas,
    0,
    0,
    inputCanvas.width,
    inputCanvas.height,
    0,
    0,
    outputCanvas.width,
    outputCanvas.height
  );
};

const getDimensionRatios = (w, h) => {
  const widthToHeightRatio = Math.round(100 * (h / w)) / 100;
  const heightToWidthRatio = Math.round(100 * (w / h)) / 100;

  return { widthToHeightRatio, heightToWidthRatio };
};

const getDimensionsToFit = (inputWidth, inputHeight, maxWidth, maxHeight) => {
  let outputWidth, outputHeight;
  const { widthToHeightRatio, heightToWidthRatio } = getDimensionRatios(
    inputWidth,
    inputHeight
  );

  // if the width need reducing, set width to max and scale height accordingly
  if (inputWidth > maxWidth) {
    outputWidth = maxWidth;
    outputHeight = outputWidth * widthToHeightRatio;

    if (outputHeight > maxHeight) {
      outputHeight = maxHeight;
      outputWidth = outputHeight * heightToWidthRatio;
    }
  }
  // if the height need reducing, set height to max and scale width accordingly
  else if (inputHeight > maxHeight) {
    outputHeight = maxHeight;
    outputWidth = outputHeight * heightToWidthRatio;
  }
  // otherwise output can match input
  else {
    outputWidth = inputWidth;
    outputHeight = inputHeight;
  }

  return { width: outputWidth, height: outputHeight };
};
