import {flatgeobuf} from 'flatgeobuf/dist/flatgeobuf.min.js';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import GeoJSON from '../src/ol/format/GeoJSON.js';
import LayerGroup from '../src/ol/layer/Group.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import RenderFeature from '../src/ol/render/Feature.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

const metersOnCH = 1.45;
// ================= init map ===============
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

// ============== init WegGL style ==============
const resolutionPerZoom = Array(35)
  .fill(null)
  .map((_, index) => {
    const meters = Math.floor(200 / map.getView().getResolutionForZoom(index));
    return [index, Math.max(meters, 1)];
  })
  .flat();

// const radius = (100 * metersOnCH) / 2;
const getStyle = (index) => {
  const prop = index === 0 ? 'population' : `population${index + 1}`;
  const predefinedStyles = {
    'squares': {
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
        ['get', prop],
        0,
        '#003fff',
        5000,
        '#5aca5b',
        10000,
        '#ffce00',
        15000,
        '#ff0000',
      ],
      'shape-stroke-color': [
        'match',
        ['get', 'hover'],
        1,
        '#ff3f3f',
        '#006688',
      ],
    },
  };
  return predefinedStyles['squares'];
};

// ======= Get feature content on hover ========
const selected = null;
map.on('pointermove', function (ev) {
  // if (selected !== null) {
  //   selected.set('hover', 0);
  //   selected = null;
  // }

  map.forEachFeatureAtPixel(ev.pixel, function (feature) {
    // feature.set('hover', 1);
    console.log(feature.get('population3'));
    // selected = feature;
    return true;
  });
});

// ============ Init layers ===============
const geojson = new GeoJSON({
  dataProjection: 'EPSG:4326',
  featureProjection: 'EPSG:3857',
  featureClass: RenderFeature,
});
const source = new VectorSource({
  //  //url: `data/100geojson/${index}.geojson`,
  url: `data/100k10prop.geojson`,
  format: geojson,
});
const webGLLayers = new LayerGroup();
Array(10)
  .fill()
  .forEach((_, index) => {
    const style = getStyle(index);
    console.log(style);
    const layer = new WebGLVectorLayer({
      style,
      source,
      //source: new VectorSource({
      //  //url: `data/100geojson/${index}.geojson`,
      //  url: `data/100k10prop.geojson`,
      //  format: geojson,
      //}),
    });
    // const source = new VectorSource({});
    // const loader = flatgeobuf.createLoader(source, `data/100geojson/${index}.geojson`);
    // source.setLoader(loader);
    // const layer = new WebGLVectorLayer({
    //   style,
    //   source,
    // });
    layer.setVisible(index === 0);
    webGLLayers.getLayers().push(layer);
  });
map.addLayer(webGLLayers);

// ============ show style in ui ===============
const editor = document.getElementById('style-editor');
const textStyle = JSON.stringify(getStyle(2), null, 2);
editor.value = textStyle;

// ============== set layer shown ==============
const input = document.getElementById('dataset-chooser');
let sliderValue = parseInt(input.value);
input.onchange = (event) => {
  webGLLayers.getLayers().item(sliderValue).setVisible(false);
  sliderValue = parseInt(event.target.value);
  webGLLayers.getLayers().item(sliderValue).setVisible(true);
  // const layer = new WebGLVectorLayer({
  //   style,
  //   source: new VectorSource({
  //     url: `data/100geojson/${sliderValue}.geojson`,
  //     format: geojson,
  //   }),
  // });
  // webGLLayers.getLayers().clear();
  // webGLLayers.getLayers().push(layer);
};
