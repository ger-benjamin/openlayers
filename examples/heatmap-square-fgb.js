import {Feature, generic} from 'flatgeobuf';
import Map from '../src/ol/Map.js';
import View from '../src/ol/View.js';
import ScaleLine from '../src/ol/control/ScaleLine.js';
import * as olExtent from '../src/ol/extent.js';
import {createRenderFeature} from '../src/ol/format/Feature.js';
import LayerGroup from '../src/ol/layer/Group.js';
import TileLayer from '../src/ol/layer/Tile.js';
import WebGLVectorLayer from '../src/ol/layer/WebGLVector.js';
import {all} from '../src/ol/loadingstrategy.js';
import {transformExtent} from '../src/ol/proj.js';
import OSM from '../src/ol/source/OSM.js';
import VectorSource from '../src/ol/source/Vector.js';

//============ test ===================

const parseProperties = (feature, columns) => {
  const ColumnType = generic.ColumnType;
  const properties = {};
  if (!columns || columns.length === 0) {
    return properties;
  }
  const array = feature.propertiesArray();
  if (!array) {
    return properties;
  }
  const view = new DataView(array.buffer, array.byteOffset);
  const length = feature.propertiesLength();
  let offset = 0;
  while (offset < length) {
    const i = view.getUint16(offset, true);
    offset += 2;
    const column = columns[i];
    const name = column.name;
    switch (column.type) {
      case ColumnType.Bool: {
        properties[name] = !!view.getUint8(offset);
        offset += 1;
        break;
      }
      case ColumnType.Byte: {
        properties[name] = view.getInt8(offset);
        offset += 1;
        break;
      }
      case ColumnType.UByte: {
        properties[name] = view.getUint8(offset);
        offset += 1;
        break;
      }
      case ColumnType.Short: {
        properties[name] = view.getInt16(offset, true);
        offset += 2;
        break;
      }
      case ColumnType.UShort: {
        properties[name] = view.getUint16(offset, true);
        offset += 2;
        break;
      }
      case ColumnType.Int: {
        properties[name] = view.getInt32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.UInt: {
        properties[name] = view.getUint32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.Long: {
        properties[name] = Number(view.getBigInt64(offset, true));
        offset += 8;
        break;
      }
      case ColumnType.ULong: {
        properties[name] = Number(view.getBigUint64(offset, true));
        offset += 8;
        break;
      }
      case ColumnType.Float: {
        properties[name] = view.getFloat32(offset, true);
        offset += 4;
        break;
      }
      case ColumnType.Double: {
        properties[name] = view.getFloat64(offset, true);
        offset += 8;
        break;
      }
      case ColumnType.DateTime:
      case ColumnType.String: {
        const length = view.getUint32(offset, true);
        offset += 4;
        properties[name] = textDecoder.decode(
          array.subarray(offset, offset + length),
        );
        offset += length;
        break;
      }
      case ColumnType.Json: {
        const length = view.getUint32(offset, true);
        offset += 4;
        const str = textDecoder.decode(array.subarray(offset, offset + length));
        properties[name] = JSON.parse(str);
        offset += length;
        break;
      }
      case ColumnType.Binary: {
        const length = view.getUint32(offset, true);
        offset += 4;
        properties[name] = array.subarray(offset, offset + length);
        offset += length;
        break;
      }
      default:
        throw new Error(`Unknown type ${column.type}`);
    }
  }
  return properties;
};

const fromFeatureFn = (id, fgbFeature, header) => {
  const coordinates = fgbFeature.geometry().xyArray();
  if (!coordinates) {
    return null;
  }
  const properties = parseProperties(fgbFeature, header.columns);
  const geomObject = {
    type: 'Point',
    flatCoordinates: Array.from(coordinates),
    layout: 'XY',
  };
  return createRenderFeature({
    geometry: geomObject,
    id,
    properties,
  });
};

async function createIterator(
  url,
  srs,
  extent,
  projection,
  strategy,
  headers = {},
) {
  if (strategy === all) {
    const response = await fetch(url, {headers});
    return generic.deserialize(response.body, fromFeatureFn);
  }
  const [minX, minY, maxX, maxY] =
    srs && projection.getCode() !== srs
      ? transformExtent(extent, projection.getCode(), srs)
      : extent;
  const rect = {minX, minY, maxX, maxY};
  return generic.deserialize(url, fromFeatureFn, rect, false, headers);
}

const createLoaderRenderFeature = (
  source,
  url,
  srs = 'EPSG:4326',
  strategy = all,
  clear = false,
  headers = {},
) => {
  const loader = async (extent, _resolution, projection, success, failure) => {
    try {
      if (clear) {
        source.clear();
      }
      const it = await createIterator(
        url,
        srs,
        extent,
        projection,
        strategy,
        headers,
      );
      const features = [];
      for await (const feature of it) {
        features.push(feature);
        source.addFeature(feature);
      }
      success?.(features);
    } catch {
      failure?.();
    }
  };
  return loader;
};

const metersOnCH = 1.45;
// ================= init map ===============
const center = [770485, 5970649];
const map = new Map({
  layers: [
    new TileLayer({
      source: new OSM(),
    }),
  ],
  target: document.getElementById('map'),
  view: new View({
    center,
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
    const meters = Math.floor(99 / map.getView().getResolutionForZoom(index));
    return [index, Math.max(meters, 1)];
  })
  .flat();

// const radius = (100 * metersOnCH) / 2;
const getStyle = (index) => {
  //const prop = index === 0 ? 'population' : `population${index + 1}`;
  const prop = 'count';
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
        300,
        '#5aca5b',
        600,
        '#ffce00',
        1000,
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
    console.log(feature.get('count'));
    // selected = feature;
    return true;
  });
});

// test loading strategy
const createBufferedExtent = (coord) => {
  const extent = olExtent.boundingExtent([coord]);
  return olExtent.buffer(extent, 1000);
};
const strategy = (extent) => [createBufferedExtent(olExtent.getCenter(extent))];

// ============ Init layers ===============
const webGLLayers = new LayerGroup();
Array(2)
  .fill()
  .forEach((_, index) => {
    const style = getStyle(index);
    const source = new VectorSource({strategy});
    // const loader = createLoader(
    const loader = createLoaderRenderFeature(
      source,
      `data/fgb/test.fgb`,
      'EPSG:3857',
      strategy,
      true,
    );
    source.setLoader(loader);
    const layer = new WebGLVectorLayer({
      style,
      source,
    });
    layer.setVisible(index === 0);
    layer.setOpacity(0.5);
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
