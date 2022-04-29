import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Icon, Style, Text} from '../src/ol/style.js';

const size = 20;

function getStyle(feature) {
  //const clusterSize = feature.length().toString().length();
  const clusterSize = feature.get('clusterSize');
  const length = clusterSize.toString().length;
  const canvas = document.createElement('canvas');
  const strokeSize = 1;
  const width = size * 2 + length;
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
  context.strokeStyle = 'black';
  context.fillStyle = 'yellow';
  context.stroke();
  context.fill();
  return new Style({
    text: new Text({
      text: clusterSize.toString(),
      fill: new Fill({
        color: context.strokeStyle,
      }),
    }),
    image: new Icon({
      img: canvas,
      imgSize: [canvas.width, canvas.height],
    }),
  });
}

const styles = {
  'badge': getStyle,
};

const styleKeys = ['badge'];
const count = 5;
const features = new Array(count);
const e = 4500000;
for (let i = 0; i < count; ++i) {
  const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new Feature(new Point(coordinates));
  features[i].set(
    'clusterSize',
    Math.floor(Math.random() * Math.pow(10, i + 1))
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
