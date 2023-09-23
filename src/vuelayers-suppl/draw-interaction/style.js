import { GEOMETRY_TYPE } from 'vuelayers-c/src/ol-ext/consts';

/**
 * @return {Object<GEOMETRY_TYPE, VlStyle[]>}
 */
export function defaultEditStyle (color,activeTools) {
  /** @type {Object<GEOMETRY_TYPE, VlStyle[]>} */
  let styles = {};
  let white = [255, 255, 255, 1];
  let width = 3;
  let opacity = 0.5;
  if(activeTools === 'draw-snapshot'){
    opacity = 0;
    width = 2.5;
  }
  styles[GEOMETRY_TYPE.LINE_STRING] = [
    {
      strokeColor: white,
      strokeWidth: width + 2,
    }, {
      strokeColor: color,
      strokeWidth: width,
    },
  ];
  styles[GEOMETRY_TYPE.MULTI_LINE_STRING] =
    styles[GEOMETRY_TYPE.LINE_STRING];

  styles[GEOMETRY_TYPE.POLYGON] = [
    {
      fillColor: [255, 255, 255, opacity],
    },
  ].concat(styles[GEOMETRY_TYPE.LINE_STRING]);
  styles[GEOMETRY_TYPE.MULTI_POLYGON] =
    styles[GEOMETRY_TYPE.POLYGON];

  styles[GEOMETRY_TYPE.CIRCLE] =
    styles[GEOMETRY_TYPE.POLYGON].concat(
      styles[GEOMETRY_TYPE.LINE_STRING],
    );

  styles[GEOMETRY_TYPE.POINT] = [
    {
      imageRadius: width * 2,
      fillColor: color,
      strokeColor: white,
      strokeWidth: width / 2,
      zIndex: Infinity,
    },
  ];
  styles[GEOMETRY_TYPE.MULTI_POINT] =
    styles[GEOMETRY_TYPE.POINT];

  styles[GEOMETRY_TYPE.GEOMETRY_COLLECTION] =
    styles[GEOMETRY_TYPE.POLYGON].concat(
      styles[GEOMETRY_TYPE.LINE_STRING],
      styles[GEOMETRY_TYPE.POINT],
    );

  return styles;
}
