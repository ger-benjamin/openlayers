import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import Point from '../src/ol/geom/Point.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const metersOnCH = 1.45;
// ============== init features ==============
// const side = 100; // = ~10'000 features
const side = 316; // = ~100'000 features
// const side = 1000; // = 1'000'000 features
const features = Array(Math.pow(side, 2))
  .fill(null)
  .map((_, index) => {
    const line = (index % side) * 100 * metersOnCH;
    const column = Math.floor(index / side) * 100 * metersOnCH;
    const x = 770485 + column;
    const y = 5970649 - line;
    const xVal = x % 10000;
    const yVal = y % 10000;
    const value = (xVal > 5000 ? 10 : xVal) * (yVal > 1000 ? 10 : yVal);
    return new Feature({
      geometry: new Point([x, y]),
      i1: value,
    });
  });

const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: document.getElementById('map'),
  view: new View({
    center: [770485, 5970649],
    zoom: 10,
    projection: 'EPSG:3857',
  }),
});
const scaleControl = new ScaleLine();
map.addControl(scaleControl);

const vectorSource = new VectorSource({});
vectorSource.addFeatures(features);

// ============== init WegGL style ==============
const resolutionPerZoom = Array(35)
  .fill(null)
  .map((_, index) => {
    const meters = Math.floor(200 / map.getView().getResolutionForZoom(index));
    return [index, Math.max(meters, 1)];
  })
  .flat();

// const radius = (100 * metersOnCH) / 2;
const predefinedStyles = {
  'triangles-latitude': {
    'shape-points': 4,
    'shape-angle': Math.PI / 4,
    //'shape-radius': (100 * metersOnCH) / 2,
    'shape-radius': [
      'interpolate',
      ['exponential', 1],
      ['zoom'],
      ...resolutionPerZoom,
    ],
    'shape-displacement': [0, 0],
    'shape-fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'i1'],
      0,
      '#003fff',
      5000,
      '#5aca5b',
      10000,
      '#ffce00',
      15000,
      '#ff0000',
    ],
    'shape-stroke-color': ['match', ['get', 'hover'], 1, '#ff3f3f', '#006688'],
  },
};

// ======= Get feature content on hover ========
let literalStyle;
let pointsLayer;
let selected = null;
map.on('pointermove', function (ev) {
  if (selected !== null) {
    selected.set('hover', 0);
    selected = null;
  }

  map.forEachFeatureAtPixel(ev.pixel, function (feature) {
    feature.set('hover', 1);
    console.log(feature.get('i1'));
    selected = feature;
    return true;
  });
});

// ======= Handle others inputs ========
function refreshLayer(newStyle) {
  const previousLayer = pointsLayer;
  pointsLayer = new WebGLVectorLayer({
    source: vectorSource,
    style: newStyle,
  });
  map.addLayer(pointsLayer);

  if (previousLayer) {
    map.removeLayer(previousLayer);
    previousLayer.dispose();
  }
  literalStyle = newStyle;
}

const spanValid = document.getElementById('style-valid');
const spanInvalid = document.getElementById('style-invalid');
function setStyleStatus(errorMsg) {
  const isError = typeof errorMsg === 'string';
  spanValid.style.display = errorMsg === null ? 'initial' : 'none';
  spanInvalid.firstElementChild.innerText = isError ? errorMsg : '';
  spanInvalid.style.display = isError ? 'initial' : 'none';
}

const editor = document.getElementById('style-editor');
editor.addEventListener('input', function () {
  const textStyle = editor.value;
  try {
    const newLiteralStyle = JSON.parse(textStyle);
    if (JSON.stringify(newLiteralStyle) !== JSON.stringify(literalStyle)) {
      refreshLayer(newLiteralStyle);
    }
    setStyleStatus(null);
  } catch (e) {
    setStyleStatus(e.message);
  }
});

const select = document.getElementById('style-select');
select.value = 'triangles-latitude';
function onSelectChange() {
  const style = select.value;
  const newLiteralStyle = predefinedStyles[style];
  editor.value = JSON.stringify(newLiteralStyle, null, 2);
  try {
    refreshLayer(newLiteralStyle);
    setStyleStatus();
  } catch (e) {
    setStyleStatus(e.message);
  }
}
onSelectChange();
select.addEventListener('change', onSelectChange);
