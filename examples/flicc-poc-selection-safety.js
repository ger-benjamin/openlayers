import Feature from '../src/ol/Feature.js';
import LayerGroup from '../src/ol/layer/Group.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import View from '../src/ol/View.js';
import {
  Circle as CircleStyle,
  Fill,
  Stroke,
  Style,
  Text,
} from '../src/ol/style.js';
import {Cluster, OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {boundingExtent} from '../src/ol/extent.js';

const distanceInput = document.getElementById('distance');
const minDistanceInput = document.getElementById('min-distance');

const count = 200;
const features = new Array(count);
const e = 450000;
for (let i = 0; i < count; ++i) {
  const coordinates = [2 * e * Math.random() - e, 2 * e * Math.random() - e];
  features[i] = new Feature(new Point(coordinates));
}

const source = new VectorSource({
  features: features,
});

const clusterSource = new Cluster({
  source: source,
});

const styleCache = {};
const clusters = new VectorLayer({
  source: clusterSource,
  style: function (feature) {
    const size = feature.get('features').length;
    let style = styleCache[size];
    if (!style) {
      style = new Style({
        image: new CircleStyle({
          radius: 10,
          stroke: new Stroke({
            color: '#fff',
          }),
          fill: new Fill({
            color: '#3399CC',
          }),
        }),
        text: new Text({
          text: size.toString(),
          fill: new Fill({
            color: '#fff',
          }),
        }),
      });
      styleCache[size] = style;
    }
    return style;
  },
});

const raster = new TileLayer({
  source: new OSM(),
});

const map = new Map({
  layers: [raster, clusters],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 2,
  }),
});

const saveClusters = [];
const saveEndFeatures = [];


map.on('click', (e) => {
  clusters.getFeatures(e.pixel).then((clickedFeatures) => {
    console.log('------------');
    if (clickedFeatures.length) {
      if (!saveClusters.includes(clickedFeatures[0])) {
        saveClusters.push(clickedFeatures[0]);
      }
      // Get clustered Coordinates
      const features = clickedFeatures[0].get('features');
      features.forEach(f => {
        if (!saveEndFeatures.includes(f)) {
          saveEndFeatures.push(f);
          //f.set('toto', Math.random());
        }
      });
      console.log(saveClusters.length);
      console.log(saveEndFeatures.length);
      saveEndFeatures.forEach(f => {
          console.log(f.ol_uid);
      })
    }
  });
});
