import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Icon, Style, Text} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';

const angleInput = document.getElementById('angle');

const rome = new Feature({
  geometry: new Point(fromLonLat([12.5, 41.9])),
});
const london = new Feature({
  geometry: new Point(fromLonLat([-0.12755, 51.507222])),
});
const madrid = new Feature({
  geometry: new Point(fromLonLat([-3.683333, 40.4])),
});
const paris = new Feature({
  geometry: new Point(fromLonLat([2.353, 48.8566])),
});
const berlin = new Feature({
  geometry: new Point(fromLonLat([13.3884, 52.5169])),
});

const features = [rome, london, madrid, paris, berlin];
features.forEach((feature, index) => {
  let azimuth;
  if (index !== 0) {
    azimuth = Math.floor(Math.random() * 359);
  } else {
    azimuth = -1;
  }
  feature.set('azimuth', azimuth);
});

const vectorSource = new VectorSource({
  features: features,
});

const styleCache = {};
const styleFunction = function (feature) {
  const angle = parseInt(angleInput.value, 10);
  const azimuth = feature.get('azimuth');
  const styleKey = `${angle}-${azimuth}`;
  let style = styleCache[styleKey];
  if (!style) {
    style = getStyle(feature, angle);
    styleCache[styleKey] = style;
  }
  return style;
};

function getStyle(feature, angle) {
  const pointSize = 20;
  const beamSize = pointSize * 3;
  let azimuth = feature.get('azimuth');
  if (azimuth < 0) {
    azimuth = 0;
    angle = 360;
  }
  const azimuthRadian = azimuth * (Math.PI / 180);
  const angleRadian = angle * (Math.PI / 180);
  const canvas = document.createElement('canvas');
  canvas.width = beamSize;
  canvas.height = beamSize;
  const context = canvas.getContext('2d');
  const centerX = canvas.width / 2;
  const centerY = canvas.height / 2;
  const radius = beamSize / 2;
  const startingAngle = 0;
  const endingAngle = angleRadian;
  const counterclockwise = false;
  // Draw the beam
  context.beginPath();
  context.moveTo(centerX, centerY);
  context.lineTo(centerX + beamSize / 2, centerY);
  context.arc(
    centerX,
    centerY,
    radius,
    startingAngle,
    endingAngle,
    counterclockwise
  );
  context.lineTo(centerX, centerY);
  context.fillStyle = 'rgba(0, 150, 255, 0.7)';
  context.fill();
  context.closePath();
  return [
    new Style({
      image: new Icon({
        img: canvas,
        imgSize: [beamSize, beamSize],
        // Move the 0 to the top (-90°), and remove the half angle. Then add the azimuth.
        rotation: -Math.PI / 2 - angleRadian / 2 + azimuthRadian,
      }),
    }),
    new Style({
      image: new Icon({
        color: '#8959A8',
        crossOrigin: 'anonymous',
        src: 'data/dot.svg',
        size: [pointSize, pointSize],
      }),
    }),
    new Style({
      text: new Text({
        text: `${feature.get('azimuth')}°`,
        fill: new Fill({color: '#000000'}),
        backgroundFill: new Fill({color: '#FFFFFF'}),
        scale: 1.3,
        offsetX: beamSize / 2,
      }),
    }),
  ];
}

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: styleFunction,
});

const angleChangeHandler = function () {
  vectorLayer.changed();
};

angleInput.addEventListener('change', angleChangeHandler);

const rasterLayer = new TileLayer({
  source: new TileJSON({
    url: 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json?secure=1',
    crossOrigin: '',
  }),
});

const map = new Map({
  layers: [rasterLayer, vectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([2.896372, 44.6024]),
    zoom: 3,
  }),
});
