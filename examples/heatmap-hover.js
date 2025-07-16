import RBush from 'rbush';
import Feature from '../src/ol/Feature.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import Point from '../src/ol/geom/Point.js';
import HeatmapLayer from '../src/ol/layer/Heatmap.js';
import TileLayer from '../src/ol/layer/Tile.js';
import VectorLayer from '../src/ol/layer/Vector.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';
import CircleStyle from '../src/ol/style/Circle.js';
import {Fill, Stroke, Style, Text} from '../src/ol/style.js';

const treeItem = [];
const metersOnCH = 1.45;
// ============== init features ==============
// const side = 316; // = ~100'000 features
const side = 1000; // = 1'000'000 features
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
    const feature = new Feature({
      geometry: new Point([x, y]),
      i1: value,
    });
    const buffer = (metersOnCH * 100) / 4;
    treeItem.push({
      minX: x - buffer,
      minY: y - buffer,
      maxX: x + buffer,
      maxY: y + buffer,
      feature,
    });
    return feature;
  });

// ============ init the map =============
const overlaySource = new VectorSource({});
const overlay = new VectorLayer({
  source: overlaySource,
  style: new Style({
    image: new CircleStyle({
      radius: 10,
      fill: new Fill({
        color: 'rgba(255, 0, 0, 0.5)',
      }),
    }),
    text: new Text({
      color: '#000000',
      font: '18px sans-serif',
      stroke: new Stroke({
        color: '#FFFFFF',
        width: 1,
      }),
      text: '',
    }),
  }),
});
const source = new VectorSource({});
source.addFeatures(features);
const heatmap = new HeatmapLayer({
  source,
  weight: (feature) => {
    const value = feature.get('i1');
    return value / 100000;
  },
});
const osm = new TileLayer({
  source: new OSM(),
});
const map = new Map({
  layers: [osm, heatmap, overlay],
  target: 'map',
  view: new View({
    center: [770485, 5970649],
    zoom: 10,
    projection: 'EPSG:3857',
  }),
});
const scaleControl = new ScaleLine();
map.addControl(scaleControl);

// ============== init controls ==============
const blur = document.getElementById('blur');
const radius = document.getElementById('radius');
blur.addEventListener('input', function () {
  heatmap.setBlur(parseInt(blur.value, 10));
});
radius.addEventListener('input', function () {
  heatmap.setRadius(parseInt(radius.value, 10));
});
heatmap.setBlur(parseInt(blur.value, 10));
heatmap.setRadius(parseInt(radius.value, 10));

// Setup pointer move - use a rBush tree to find the feature from the pointer's coordinate.
const tree = new RBush();
tree.load(treeItem);
map.on('pointermove', (evt) => {
  overlaySource.clear();
  //  ===== That works... but poorly. ====
  // let match;
  // evt.map.forEachFeatureAtPixel(evt.pixel, (feature) => {
  //   if (match) {
  //     return;
  //   }
  //   match = feature;
  //   overlaySource.addFeature(feature);
  //   overlay
  //     .getStyle()
  //     .getText()
  //     .setText(`${feature.get('i1')}`);
  // }, {hitTolerance: 5});
  const buffer = (metersOnCH * 100) / 2;
  const coordinates = evt.target.getEventCoordinate(evt.originalEvent);
  if (!coordinates || coordinates.length !== 2) {
    return;
  }
  const result = tree.search({
    minX: coordinates[0] - buffer,
    minY: coordinates[1] - buffer,
    maxX: coordinates[0] + buffer,
    maxY: coordinates[1] + buffer,
  });
  if (!result.length) {
    return;
  }
  const feature = result[0].feature;
  overlaySource.addFeature(feature);
  overlay
    .getStyle()
    .getText()
    .setText(`${feature.get('i1')}`);
});
