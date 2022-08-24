import Feature from '../src/ol/Feature.js';
import Icon from '../src/ol/style/Icon.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import View from '../src/ol/View.js';
import vectorLayer from '../src/ol/renderer/canvas/VectorLayer.js';
import {Circle as CircleStyle, Stroke, Style} from '../src/ol/style.js';
import {OSM, Vector as VectorSource} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {easeIn, easeOut, inAndOut} from '../src/ol/easing.js';
import {fromLonLat} from '../src/ol/proj.js';
import {getVectorContext} from '../src/ol/render.js';
import {unByKey} from '../src/ol/Observable.js';

const iconSize = 20;

const tileLayer = new TileLayer({
  source: new OSM({
    wrapX: false,
  }),
});

const source = new VectorSource({
  wrapX: false,
});
const vector = new VectorLayer({
  source: source,
  style: new Style({
    image: new Icon({
      crossOrigin: 'anonymous',
      src: 'data/flicc-point.svg',
      scale: 1,
    }),
  }),
});

const map = new Map({
  layers: [tileLayer, vector],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
    multiWorld: true,
  }),
});

function addRandomFeature(last) {
  const x = Math.random() * 360 - 180;
  const y = Math.random() * 170 - 85;
  const geom = new Point(fromLonLat([x, y]));
  const feature = new Feature(geom);
  if (last) {
    feature.set('last', true);
  }
  source.addFeature(feature);
}

const duration = 750;
function flash(feature) {
  const start = Date.now();
  const flashGeom = feature.getGeometry().clone();
  const listenerKey = vector.on('postrender', animate);

  function animate(event) {
    const frameState = event.frameState;
    const elapsed = frameState.time - start;
    const vectorContext = getVectorContext(event);
    const elapsedRatio =
      (elapsed - Math.floor(elapsed / duration) * duration) / duration;
    let ratio;
    if (Math.floor(elapsed / duration) % 2) {
      ratio = inAndOut(elapsedRatio);
    } else {
      ratio = inAndOut(1 - elapsedRatio);
    }

    const style = new Style({
      image: new Icon({
        src: 'data/flicc-point.svg',
        crossOrigin: 'anonymous',
        scale: (iconSize + iconSize * 0.7 * ratio) / iconSize,
      }),
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
  }
}

const doFlash = () => {
  const lastFeature = source
    .getFeatures()
    .find((feature) => feature.get('last'));
  flash(lastFeature);
  vector.on('postrender', () => {
    vector.changed();
  });
};

addRandomFeature();
addRandomFeature();
addRandomFeature();
addRandomFeature();
addRandomFeature(true);
doFlash();
