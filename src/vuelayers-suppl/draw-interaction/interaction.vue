<script>
import { noModifierKeys, shiftKeyOnly } from 'ol/events/condition';
import DrawInteraction from 'ol/interaction/Draw';
import { merge as mergeObs } from 'rxjs';
import { map as mapObs } from 'rxjs/operators';
import interaction from 'vuelayers-c/lib/mixin/interaction';
import stylesContainer from 'vuelayers-c/lib/mixin/styles-container';
import { GEOMETRY_TYPE } from 'vuelayers-c/lib/ol-ext/consts';
import { initFeature } from 'vuelayers-c/lib/ol-ext/feature';
import { createStyle } from 'vuelayers-c/lib/ol-ext/style';
import {  defaultEditStyle } from './style';
import { isCollection, isVectorSource } from 'vuelayers-c/lib/ol-ext/util';
import observableFromOlEvent from 'vuelayers-c/lib/rx-ext/from-ol-event';
import { hasInteraction } from 'vuelayers-c/lib/util/assert';
import { camelCase, isFunction, mapValues, upperFirst } from 'vuelayers-c/lib/util/minilo';
import mergeDescriptors from 'vuelayers-c/lib/util/multi-merge-descriptors';
import { makeWatchers } from 'vuelayers-c/lib/util/vue-helpers';

const transformType = type => upperFirst(camelCase(type));
/**
 * @vueProps
 */
const props = {
  /**
   * Target source or collection identifier from IdentityMap.
   * @type {String}
   */
  source: {
    type: String,
    required: true,
  },
  /**
   * The maximum distance in pixels between "down" and "up" for a "up" event to be considered a "click" event and
   * actually add a point/vertex to the geometry being drawn. Default is 6 pixels. That value was chosen for the
   * draw interaction to behave correctly on mouse as well as on touch devices.
   * @type {number}
   */
  clickTolerance: {
    type: Number,
    default: 6,
  },
  /**
   * Pixel distance for snapping to the drawing finish.
   * @type {number}
   */
  snapTolerance: {
    type: Number,
    default: 12,
  },
  /**
   * Drawing type ('Point', 'LineString', 'Polygon', 'MultiPoint', 'MultiLineString', 'MultiPolygon' or 'Circle').
   * @type {string}
   */
  type: {
    type: String,
    required: true,
    validator: value => Object.values(GEOMETRY_TYPE).includes(transformType(value)),
  },
  /**
   * Stop click, singleclick, and doubleclick events from firing during drawing.
   * @type {boolean}
   */
  stopClick: {
    type: Boolean,
    default: false,
  },
  /**
   * The number of points that can be drawn before a polygon ring or line string is finished.
   * @type {number|undefined}
   */
  maxPoints: Number,
  /**
   * The number of points that must be drawn before a polygon ring or line string can be finished.
   * Default is `3` for polygon rings and `2` for line strings.
   * @type {number|undefined}
   */
  minPoints: Number,
  /**
   * A function that takes an ol.MapBrowserEvent and returns a boolean to indicate whether the drawing can be finished.
   * @type {function|undefined}
   */
  finishCondition: Function,
  /**
   * Function that is called when a geometry's coordinates are updated.
   * @type {function|undefined}
   */
  geometryFunction: Function,
  /**
   * Name of the geometry attribute for newly created features.
   * @type {string}
   */
  geometryName: {
    type: String,
    default: 'geometry',
  },
  /**
   * A function that takes an `ol.MapBrowserEvent` and returns a boolean to indicate whether that event should be handled.
   * By default `ol.events.condition.noModifierKeys`, i.e. a click, adds a vertex or deactivates freehand drawing.
   * @type {function|undefined}
   */
  condition: {
    type: Function,
    default: noModifierKeys,
  },
  /**
   * Operate in freehand mode for lines, polygons, and circles. This makes the interaction always operate in
   * freehand mode and takes precedence over any `freehandCondition` option.
   * @type {boolean}
   */
  freehand: {
    type: Boolean,
    default: false,
  },
  /**
   * Condition that activates freehand drawing for lines and polygons. This function takes an `ol.MapBrowserEvent` and
   * returns a boolean to indicate whether that event should be handled. The default is `ol.events.condition.shiftKeyOnly`,
   * meaning that the Shift key activates freehand drawing.
   * @type {function|undefined}
   */
  freehandCondition: {
    type: Function,
    default: shiftKeyOnly,
  },
  /**
   * Wrap the world horizontally on the sketch overlay.
   * @type {boolean}
   */
  wrapX: {
    type: Boolean,
    default: false,
  },
  annotationDrawLineColor: {
    type: String,
  },
  activeTool: {
    type: String,
  }
};
const computed = {
  computedLineColor() {
    return this.annotationDrawLineColor || '#0099FF';
  }
};
/**
 * @vueMethods
 */
const methods = {
  /**
   * @return {Promise<Draw>}
   * @protected
   */
  async createInteraction () {
    let sourceIdent = this.makeIdent(this.source);
    let source = await this.$identityMap.get(sourceIdent, this.$options.INSTANCE_PROMISE_POOL);

    if (isFunction(source.getFeatures)) {
      let features = source.getFeatures();
      if (isCollection(features)) {
        source = features;
      }
    }

    return new DrawInteraction({
      source: isVectorSource(source) ? source : undefined,
      features: isCollection(source) ? source : undefined,
      clickTolerance: this.clickTolerance,
      snapTolerance: this.snapTolerance,
      type: transformType(this.type),
      stopClick: this.stopClick,
      maxPoints: this.maxPoints,
      minPoints: this.minPoints,
      finishCondition: this.finishCondition,
      style: this.createStyleFunc(),
      geometryFunction: this.geometryFunction,
      geometryName: this.geometryName,
      condition: this.condition,
      freehand: this.freehand,
      freehandCondition: this.freehandCondition,
      wrapX: this.wrapX,
    });
  },
  /**
   * @return {function(feature: Feature): Style}
   * @protected
   */
  getDefaultStyles () {
    const defaultStyles = mapValues(defaultEditStyle(this.computedLineColor,this.activeTool), styles => styles.map(createStyle));
    return function __selectDefaultStyleFunc (feature) {
      if (feature.getGeometry()) {
        return defaultStyles[feature.getGeometry().getType()];
      }
    };
  },
  /**
   * @returns {Object}
   * @protected
   */
  getServices () {
    return mergeDescriptors(
      interaction.methods.getServices.call(this),
      stylesContainer.methods.getServices.call(this),
    );
  },
  /**
   * @return {Interaction|undefined}
   * @protected
   */
  getStyleTarget () {
    return this.$interaction;
  },
  /**
   * @return {void}
   * @protected
   */
  mount () {
    interaction.methods.mount.call(this);
  },
  /**
   * @return {void}
   * @protected
   */
  unmount () {
    interaction.methods.unmount.call(this);
  },
  /**
   * @param {Array<{style: Style, condition: (function|boolean|undefined)}>|function(feature: Feature): Style|Vue|undefined} styles
   * @return {void}
   * @protected
   */
  setStyle (styles) {
    if (styles !== this._styles) {
      this._styles = styles;
      this.scheduleRefresh();
    }
  },
  /**
   * @return {void}
   * @protected
   */
  subscribeAll () {
    subscribeToInteractionChanges.call(this);
  },

};
// todo other props?
const watch = makeWatchers(['source', 'type'], () => function () {
  this.scheduleRecreate();
});

/**
 * @alias module:draw-interaction/interaction
 * @title vl-interaction-draw
 * @vueProto
 */
export default {
  name: 'vl-interaction-draw',
  mixins: [interaction, stylesContainer],
  props,
  methods,
  watch,
  computed,
  stubVNode: {
    empty: false,
    attrs () {
      return {
        class: this.$options.name,
      };
    },
  },
};

/**
 * @return {void}
 * @private
 */
function subscribeToInteractionChanges () {
  hasInteraction(this);

  const drawEvents = mergeObs(
    observableFromOlEvent(this.$interaction, 'drawstart')
      .pipe(
        mapObs(evt => {
          initFeature(evt.feature);
          return evt;
        }),
      ),
    observableFromOlEvent(this.$interaction, 'drawend'),
  );
  this.subscribeTo(drawEvents, evt => {
    ++this.rev;
    this.$emit(evt.type, evt);
  });
}
</script>
