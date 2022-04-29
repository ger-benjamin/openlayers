import Feature from '../src/ol/Feature.js';
import LineString from '../src/ol/geom/LineString.js';
import Map from '../src/ol/Map.js';
import OSM from '../src/ol/source/OSM.js';
import Point from '../src/ol/geom/Point.js';
import VectorSource from '../src/ol/source/Vector.js';
import View from '../src/ol/View.js';
import {Fill, Icon, RegularShape, Stroke, Style} from '../src/ol/style.js';
import {Tile as TileLayer, Vector as VectorLayer} from '../src/ol/layer.js';
import {fromLonLat} from '../src/ol/proj.js';

const color = '#48d1cc';
const iconSize = 20;

const map = new Map({
  layers: [],
  target: document.getElementById('map'),
  view: new View({
    center: fromLonLat([2.896372, 44.6024]),
    zoom: 3,
  }),
});

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

const features = [madrid, rome, paris, london, berlin];

const vectorSource = new VectorSource({
  features: features,
});

const getGeometry = function (lineGeometry, viewResolution) {
  const sx = lineGeometry.getFirstCoordinate()[0];
  const sy = lineGeometry.getFirstCoordinate()[1];
  const ex = lineGeometry.getLastCoordinate()[0];
  const ey = lineGeometry.getLastCoordinate()[1];
  const diffX = sx - ex;
  const diffY = sy - ey;
  const orientation = Math.abs(Math.atan(diffY / diffX));
  const projection = map.getView().getProjection();
  const resolution = projection.getPointResolutionFunc()(
    viewResolution,
    lineGeometry.getLastCoordinate()
  );
  const shift = iconSize * resolution;
  const shiftedX = Math.cos(orientation) * shift * Math.sign(diffX);
  const shiftedY = Math.sin(orientation) * shift * Math.sign(diffY);
  return new LineString([
    [sx - shiftedX, sy - shiftedY],
    [ex + shiftedX, ey + shiftedY],
  ]);
};

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

function getLineStyle(feature, resolution) {
  const geometry = getGeometry(feature.getGeometry(), resolution);
  const styles = [
    new Style({
      geometry,
      stroke: new Stroke({color, width: 4}),
    }),
  ];
  geometry.forEachSegment(function (start, end) {
    const dx = end[0] - start[0];
    const dy = end[1] - start[1];
    const rotation = Math.atan2(dy, dx);
    const gravityCenter = (Math.sqrt(3) / 6) * iconSize;
    // arrows
    styles.push(
      new Style({
        geometry: new Point(end),
        image: new RegularShape({
          fill: new Fill({color}),
          radius: iconSize / 2,
          points: 3,
          angle: Math.PI / 2,
          displacement: [-gravityCenter, 0],
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
      scale: iconSize / 20,
    }),
  }),
});

const osm = new TileLayer({
  source: new OSM(),
});

map.addLayer(osm);
map.addLayer(vectorLayer);
map.addLayer(lineVectorLayer);
