import Feature from '../src/ol/Feature.js';
import LineString from '../src/ol/geom/LineString.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import TileJSON from '../src/ol/source/TileJSON.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Icon, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';

const rome = new Feature({
  geometry: new Point(fromLonLat([12.5, 41.9])),
  'target': 1,
});
const madrid = new Feature({
  geometry: new Point(fromLonLat([-3.683333, 40.4])),
  'target': 1,
});
const paris = new Feature({
  geometry: new Point(fromLonLat([2.353, 48.8566])),
  'target': 1,
});
const london = new Feature({
  geometry: new Point(fromLonLat([-0.12755, 51.507222])),
  'target': 2,
});
const berlin = new Feature({
  geometry: new Point(fromLonLat([13.3884, 52.5169])),
  'target': 2,
});

const features = [rome, madrid, paris, london, berlin];

const vectorSource = new VectorSource({
  features: features,
});

const lineFeatures = [];
let previousFeature = null;
features.forEach((feature) => {
  if (previousFeature) {
    if (feature.get('target') === previousFeature.get('target')) {
      lineFeatures.push(
        new Feature({
          geometry: new LineString([
            previousFeature.getGeometry().getCoordinates(),
            feature.getGeometry().getCoordinates(),
          ]),
        })
      );
    }
  }
  previousFeature = feature;
});

function getLineStyle(feature) {
  const geometry = feature.getGeometry();
  const styles = [
    new Style({
      stroke: new Stroke({color: '#0088AA', width: 2}),
    }),
  ];
  geometry.forEachSegment(function (start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);
    // arrows
    styles.push(
      new Style({
        geometry: new Point(end),
        image: new Icon({
          color: '#0088AA',
          src: 'data/arrow.png',
          anchor: [0.75, 0.5],
          rotateWithView: true,
          rotation: -rotation,
        }),
      })
    );
  });
  return styles;
}

const lineVectorSource = new VectorSource({
  features: lineFeatures,
});

const lineVectorLayer = new VectorLayer({
  source: lineVectorSource,
  style: getLineStyle,
});

const vectorLayer = new VectorLayer({
  source: vectorSource,
  style: new Style({
    image: new Icon({
      color: '#8959A8',
      crossOrigin: 'anonymous',
      src: 'data/dot.svg',
    }),
  }),
});

const rasterLayer = new TileLayer({
  source: new TileJSON({
    url: 'https://a.tiles.mapbox.com/v3/aj.1x1-degrees.json?secure=1',
    crossOrigin: '',
  }),
});

const map = new Map({
  layers: [rasterLayer, vectorLayer, lineVectorLayer],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([2.896372, 44.6024]),
    zoom: 3,
  }),
});
