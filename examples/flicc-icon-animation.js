import Feature from '../src/ol/Feature.js';
import Icon from '../src/ol/style/Icon.js';
import Map from '../src/ol/Map.js';
import Point from '../src/ol/geom/Point.js';
import View from '../src/ol/View.js';
import {Circle, Fill, Style} from '../src/ol/style.js';
import {
  Cluster as ClusterSource,
  OSM,
  Vector as VectorSource,
} from '../src/ol/source.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';
import {getVectorContext} from '../src/ol/render.js';
import {inAndOut} from '../src/ol/easing.js';

const iconSize = 20;

const tileLayer = new TileLayer({
  source: new OSM({
    wrapX: false,
  }),
});

const vsource = new VectorSource({
  wrapX: false,
});

const csource = new ClusterSource({
  source: vsource,
  wrapX: false,
});

const vectorX = new VectorLayer({
  source: new VectorSource(),
  style: new Style({
    image: new Circle({
      radius: 0,
      fill: new Fill({
        color: 'blue',
      }),
    }),
  }),
});
vectorX.getSource().addFeature(new Feature(new Point([0, 0])));

const vector = new VectorLayer({
  source: csource,
  style: (features) => {
    const isLast = features
      .get('features')
      .find((feature) => feature.get('last'));
    if (!isLast) {
      return new Style({
        image: new Icon({
          crossOrigin: 'anonymous',
          src: 'data/flicc-point.svg',
          scale: 1,
          color: 'blue',
        }),
      });
    } else {
      return new Style({
        image: new Icon({
          crossOrigin: 'anonymous',
          src: 'data/flicc-point.svg',
          scale: 1,
          opacity: 0.4,
        }),
      });
    }
  },
});

const map = new Map({
  layers: [tileLayer, vector, vectorX],
  target: 'map',
  view: new View({
    center: [0, 0],
    zoom: 1,
    multiWorld: true,
  }),
});

const duration = 750;
function flash(feature) {
  const start = Date.now();
  const flashGeom = feature.getGeometry().clone();
  // const listenerKey = vector.on('postrender', animate);
  vectorX.on('postrender', animate);

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

    // TODO: A cache could be great here.
    const style = new Style({
      image: new Icon({
        crossOrigin: 'anonymous',
        src: 'data/flicc-point.svg',
        scale: (iconSize + iconSize * 0.7 * ratio) / iconSize,
      }),
    });

    vectorContext.setStyle(style);
    vectorContext.drawGeometry(flashGeom);
  }
}

/**
 * TODO: in flicc, this will be done at each cluster layer changes (clusterSource.on('change')):
 * Take the clusters with last location (per search (selected or all) and target).
 * flash each cluster like here
 */
const doFlash = () => {
  // on cluster change
  const lastvFeature = vsource
    .getFeatures()
    .find((vfeature) => vfeature.get('last'));
  const lastcFeature = csource
    .getFeatures()
    .find((cfeature) => cfeature.get('features').find((f) => f.get('last')));
  if (lastcFeature) {
    flash(lastcFeature);
  } else {
    flash(lastvFeature);
  }
};

const loopRendering = () => {
  // at init only, eventually, add another layer to minimize the load.
  vectorX.on('postrender', () => {
    vectorX.changed();
  });
};

function addRandomFeature(last) {
  const x = Math.random() * 360 - 180;
  const y = Math.random() * 170 - 85;
  const geom = new Point(fromLonLat([x, y]));
  const feature = new Feature(geom);
  if (last) {
    feature.set('last', true);
  }
  vsource.addFeature(feature);
}

new Array(20).fill(0).forEach((_x) => addRandomFeature());
addRandomFeature(true);
doFlash();
loopRendering();

map.on('pointermove', (evt) => {
  const map = evt.map;
  map.forEachFeatureAtPixel(evt.pixel, (features) => {
    console.log(
      features.get('features').find((feature) => feature.get('last'))
    );
  });
});
