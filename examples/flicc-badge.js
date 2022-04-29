import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Icon, Style, Text} from '../src/ol/style.js';

const fontSize = '10';
const size = 20;
const strokeColor = 'black';
const fillColor = 'yellow';

const styleCanvasCache = {};
function getStyleCanevas(stringLength) {
  const canvas = document.createElement('canvas');
  const strokeSize = 1;
  const width = size + ((stringLength <= 1 ? 2 : stringLength) * fontSize) / 2;
  const height = size;
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext('2d');
  context.roundRect(
    strokeSize,
    strokeSize,
    width - 2 * strokeSize,
    height - 2 * strokeSize,
    (height - 2 * strokeSize) / 2
  );
  context.lineWidth = strokeSize;
  context.strokeStyle = strokeColor;
  context.fillStyle = fillColor;
  context.stroke();
  context.fill();
  return new Icon({
    img: canvas,
    imgSize: [canvas.width, canvas.height],
  });
}

const styleTextCache = {};
function getStyleText(clusterSize) {
  return new Text({
    text: clusterSize.toString(),
    font: `bold ${fontSize}px sans-serif`,
    offsetY: 1.5,
    fill: new Fill({
      color: strokeColor,
    }),
  });
}

function getStyle(feature) {
  //const clusterSize = feature.length().toString().length();
  const clusterSize = feature.get('clusterSize');
  const stringLength = clusterSize.toString().length;
  let styleCanevas = styleCanvasCache[stringLength];
  if (!styleCanevas) {
    styleCanevas = getStyleCanevas(stringLength);
    styleCanvasCache[stringLength] = styleCanevas;
  }
  let styleText = styleTextCache[clusterSize];
  if (!styleText) {
    styleText = getStyleText(clusterSize);
    styleTextCache[clusterSize] = styleText;
  }
  return new Style({
    text: styleText,
    image: styleCanevas,
  });
}

const styles = {
  'badge': getStyle,
};

const styleKeys = ['badge'];
const count = 20;
const features = new Array(count);
const e = 4500000;
for (let i = 0; i < count; ++i) {
  const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new Feature(new Point(coordinates));
  const length = Math.ceil(Math.random() * 5);
  features[i].set(
    'clusterSize',
    Math.floor(Math.random() * Math.pow(10, length))
  );
  features[i].setStyle(
    styles[styleKeys[Math.floor(Math.random() * styleKeys.length)]]
  );
}

const source = new VectorSource({
  features: features,
});

const vectorLayer = new VectorLayer({
  source: source,
});

const map = new Map({
  layers: [vectorLayer],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});
