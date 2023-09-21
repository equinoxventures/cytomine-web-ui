<!-- Copyright (c) 2009-2022. Authors: see NOTICE file.

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.-->

<template>
<div class="map-container" @click="isActiveImage = true" ref="container">
  <template v-if="!loading && zoom !== null">
    <vl-map
      :data-projection="projectionName"
      :load-tiles-while-animating="true"
      :load-tiles-while-interacting="true"
      :keyboard-event-target="document"
      @pointermove="projectedMousePosition = $event.coordinate"
      @mounted="updateKeyboardInteractions"
      ref="map"
    >

      <vl-view
        :center.sync="center"
        :zoom.sync="zoom"
        :rotation.sync="rotation"
        :max-zoom="maxZoom"
        :max-resolution="Math.pow(2, image.zoom)"
        :extent="extent"
        :projection="projectionName"
        @mounted="viewMounted()"
        ref="view"
      />

      <vl-layer-tile :extent="extent" @mounted="addOverviewMap" ref="baseLayer">
        <vl-source-zoomify
          :projection="projectionName"
          :urls="baseLayerURLs"
          :size="imageSize"
          :extent="extent"
          crossOrigin="Anonymous"
          ref="baseSource"
          @mounted="setBaseSource()"
          :transition="0"
        />
      </vl-layer-tile>

      <vl-layer-image>
        <vl-source-raster
          v-if="baseSource && colorManipulationOn"
          :sources="[baseSource]"
          :operation="operation"
          :lib="lib"
        />
      </vl-layer-image>

      <annotation-layer
        v-for="layer in selectedLayers"
        :key="'layer-'+layer.id"
        :index="index"
        :layer="layer"
      />

      <select-interaction v-if="activeSelectInteraction" :index="index" />
      <draw-interaction v-if="activeDrawInteraction" :index="index" :mousePosition="projectedMousePosition" :zoom="zoom"
                        :AnnotationLineColorConfig="AnnotationLineColorConfig" :WebhookConfig="WebhookConfig" :MillimeterConfig="MillimeterConfig"/>
      <modify-interaction v-if="activeModifyInteraction" :index="index" />

    </vl-map>

    <div class="ol-zoom ol-unselectable ol-control ">
      <dvi class="mass">
        <button
          v-tooltip="'2x'"
          class="button"
          :class="{'is-selected': magnification === 2}"
          @click="setMagnification(2)"
        >
          <span class="icon text" >2x</span>
        </button>
        <button
          v-tooltip="'4x'"
          class="button"
          :class="{'is-selected': magnification === 4}"
          @click="setMagnification(4)"
        >
          <span class="icon text" >4x</span>
        </button>
        <button
          v-tooltip="'8x'"
          class="button"
          :class="{'is-selected': magnification === 8}"
          @click="setMagnification(8)"
        >
          <span class="icon text" >8x</span>
        </button>
        <button
          v-tooltip="'16x'"
          class="button"
          :class="{'is-selected': magnification === 16}"
          @click="setMagnification(16)"
        >
          <span class="icon text" >16x</span>
        </button>
        <button
          v-tooltip="'32x'"
          class="button"
          :class="{'is-selected': magnification === 32}"
          @click="setMagnification(32)"
        >
          <span class="icon text" >32x</span>
        </button>
        <button
          v-tooltip="'64x'"
          class="button"
          :class="{'is-selected': magnification === 64}"
          @click="setMagnification(64)"
        >
          <span class="icon text" >64x</span>
        </button>

      </dvi>
    </div>



    <div v-if="configUI['project-tools-main']" class="draw-tools">
      <draw-tools :index="index" @screenshot="takeScreenshot()" @snapshot="takeSnapshot()"/>
    </div>

    <div class="panels">
      <ul>
        <li>
          <a @click="$emit('close')" class="close">
            <i class="fas fa-times-circle"></i>
          </a>
        </li>

        <template v-if="isPanelDisplayed('hide-tools')">
          <li v-if="isPanelDisplayed('info')">
            <a @click="togglePanel('info')" :class="{active: activePanel === 'info'}">
              <i class="fas fa-info"></i>
            </a>
            <information-panel class="panel-options" v-show="activePanel === 'info'" :index="index" />
          </li>

          <li v-if="isPanelDisplayed('digital-zoom')">
            <a @click="togglePanel('digital-zoom')" :class="{active: activePanel === 'digital-zoom'}">
              <i class="fas fa-search"></i>
            </a>
            <digital-zoom class="panel-options" v-show="activePanel === 'digital-zoom'" :index="index"
                          @resetZoom="$refs.view.animate({zoom: image.zoom})"
                          @fitZoom="fitZoom" />
          </li>

          <li v-if="isPanelDisplayed('link') && nbImages > 1">
            <a @click="togglePanel('link')" :class="{active: activePanel === 'link'}">
              <i class="fas fa-link"></i>
            </a>
            <link-panel class="panel-options" v-show="activePanel === 'link'" :index="index" />
          </li>

          <li v-if="isPanelDisplayed('color-manipulation')">
            <a @click="togglePanel('colors')" :class="{active: activePanel === 'colors'}">
              <i class="fas fa-adjust"></i>
            </a>
            <color-manipulation class="panel-options" v-show="activePanel === 'colors'" :index="index" />
          </li>

          <li v-if="isPanelDisplayed('image-layers')">
            <a @click="togglePanel('layers')" :class="{active: activePanel === 'layers'}">
              <i class="fas fa-copy"></i>
            </a>
            <layers-panel class="panel-options" v-show="activePanel === 'layers'"
              :index="index" :layers-to-preload="layersToPreload"
            />
          </li>

          <li v-if="isPanelDisplayed('ontology') && terms && terms.length > 0">
            <a @click="togglePanel('ontology')" :class="{active: activePanel === 'ontology'}">
              <i class="fas fa-hashtag"></i>
            </a>
            <ontology-panel class="panel-options" v-show="activePanel === 'ontology'" :index="index" />
          </li>

          <li  v-if="isPanelDisplayed('property')">
            <a @click="togglePanel('properties')" :class="{active: activePanel === 'properties'}">
              <i class="fas fa-tag"></i>
            </a>
            <properties-panel class="panel-options" v-show="activePanel === 'properties'" :index="index" />
          </li>

          <li v-if="isPanelDisplayed('follow')">
            <a @click="togglePanel('follow')" :class="{active: activePanel === 'follow'}">
              <i class="fas fa-street-view"></i>
            </a>
            <follow-panel class="panel-options" v-show="activePanel === 'follow'" :index="index" :view="$refs.view" />
          </li>

          <li v-if="isPanelDisplayed('review') && canEdit">
            <a @click="togglePanel('review')" :class="{active: activePanel === 'review'}">
              <i class="fas fa-check-circle"></i>
            </a>
            <review-panel class="panel-options" v-show="activePanel === 'review'" :index="index" />
          </li>
        </template>
      </ul>
    </div>

    <image-controls :index="index" class="image-controls-wrapper" />

    <div class="broadcast" v-if="imageWrapper.tracking.broadcast">
      <i class="fas fa-circle"></i> {{$t('live')}}
    </div>

    <rotation-selector class="rotation-selector-wrapper" :index="index" />

    <scale-line :image="image" :zoom="zoom" :mousePosition="projectedMousePosition" />

    <annotations-container :index="index" @centerView="centerViewOnAnnot" />

    <div class="custom-overview" ref="overview">
    </div>
  </template>


</div>
</template>

<script>
import {get} from '@/utils/store-helpers';
import _ from 'lodash';

import AnnotationLayer from './AnnotationLayer';
import RotationSelector from './RotationSelector';
import ScaleLine from './ScaleLine';
import DrawTools from './DrawTools';
import ImageControls from './ImageControls';
import AnnotationsContainer from './AnnotationsContainer';

import InformationPanel from './panels/InformationPanel';
import DigitalZoom from './panels/DigitalZoom';
import ColorManipulation from './panels/ColorManipulation';
import LinkPanel from './panels/LinkPanel';
import LayersPanel from './panels/LayersPanel';
import OntologyPanel from './panels/OntologyPanel';
import PropertiesPanel from './panels/PropertiesPanel';
import FollowPanel from './panels/FollowPanel';
import ReviewPanel from './panels/ReviewPanel';

import SelectInteraction from './interactions/SelectInteraction';
import DrawInteraction from './interactions/DrawInteraction';
import ModifyInteraction from './interactions/ModifyInteraction';

import {addProj, createProj, getProj} from 'vuelayers-c/lib/ol-ext';

import View from 'ol/View';
import OverviewMap from 'ol/control/OverviewMap';
import {KeyboardPan, KeyboardZoom, MouseWheelZoom} from 'ol/interaction';
import {noModifierKeys, targetNotEditable} from 'ol/events/condition';
import WKT from 'ol/format/WKT';

import {ImageConsultation, Annotation, AnnotationType, UserPosition, SliceInstance} from 'cytomine-client-c';

import {constLib, operation} from '@/utils/color-manipulation.js';

import constants from '@/utils/constants.js';
import {SnapshotFile,Configuration,SnapshotFileCollection,Cytomine} from 'cytomine-client-c';
import CustomMouseWheelZoom from '@/components/viewer/newModuls/CustomMouseWheelZoom';


export default {
  name: 'cytomine-image',
  props: {
    index: String
  },
  components: {

    AnnotationLayer,

    RotationSelector,
    ScaleLine,
    DrawTools,
    ImageControls,
    AnnotationsContainer,

    InformationPanel,
    DigitalZoom,
    ColorManipulation,
    LinkPanel,
    LayersPanel,
    OntologyPanel,
    PropertiesPanel,
    FollowPanel,
    ReviewPanel,

    SelectInteraction,
    DrawInteraction,
    ModifyInteraction
  },
  data() {
    return {
      minZoom: 0,

      projectedMousePosition: [0, 0],

      baseSource: null,
      routedAnnotation: null,
      selectedAnnotation: null,

      timeoutSavePosition: null,

      loading: true,

      overview: null,

      format: new WKT(),
      WebhookConfig: new Configuration({key: constants.CONFIG_KEY_WEBHOOK_URL, value: '', readingRole: 'all'}),
      ScrollZoomConfig: new Configuration({key: constants.CONFIG_KEY_SCROLL_ZOOM, value: '', readingRole: 'all'}),
      AnnotationLineColorConfig: new Configuration({key: constants.CONFIG_KEY_ANNOTATION_LINE_COLOR, value: '', readingRole: 'all'}),
      MillimeterConfig: new Configuration({key: constants.CONFIG_KEY_MILLIMETER, value: '', readingRole: 'all'}),
      snapshotFiles: [],
    };
  },
  computed: {
    document() {
      return document;
    },
    routedAction() {
      return this.$route.query.action;
    },
    host() {
      return Cytomine.instance.host;
    },
    project: get('currentProject/project'),
    configUI: get('currentProject/configUI'),
    viewerModule() {
      return this.$store.getters['currentProject/currentViewerModule'];
    },
    imageModule() {
      return this.$store.getters['currentProject/imageModule'](this.index);
    },
    viewerWrapper() {
      return this.$store.getters['currentProject/currentViewer'];
    },
    nbImages() {
      return Object.keys(this.viewerWrapper.images).length;
    },
    imageWrapper() {
      return this.viewerWrapper.images[this.index];
    },
    image() {
      return this.imageWrapper.imageInstance;
    },
    slice() {
      return this.imageWrapper.activeSlice;
    },
    canEdit() {
      return this.$store.getters['currentProject/canEditImage'](this.image);
    },
    projectionName() {
      return `CYTO-${this.image.id}`;
    },
    terms() {
      return this.$store.getters['currentProject/terms'];
    },
    selectedLayers() {
      return this.imageWrapper.layers.selectedLayers || [];
    },
    isActiveImage: {
      get() {
        return this.viewerWrapper.activeImage === this.index;
      },
      set(value) {
        if(value) {
          if(this.viewerWrapper) {
            this.$store.commit(this.viewerModule + 'setActiveImage', this.index);
          }
        }
        else {
          throw new Error('Cannot unset active map');
        }
      }
    },
    magnification() {
      let magnification = Math.pow(2, this.zoom - this.image.zoom) * this.image.magnification;
      return Math.round(magnification * 10) / 10;
    },
    activePanel() {
      return this.imageWrapper.activePanel;
    },
    activeTool() {
      return this.imageWrapper.draw.activeTool;
    },
    activeEditTool() {
      return this.imageWrapper.draw.activeEditTool;
    },
    maxZoom() {
      return this.$store.getters[this.imageModule + 'maxZoom'];
    },

    center: {
      get() {
        return this.imageWrapper.view.center;
      },
      set(value) {
        this.$store.dispatch(this.viewerModule + 'setCenter', {index: this.index, center: value});
      }
    },
    zoom: {
      get() {
        return this.imageWrapper.view.zoom;
      },
      set(value) {
        this.$store.dispatch(this.viewerModule + 'setZoom', {index: this.index, zoom: Number(value)});
      }
    },
    rotation: {
      get() {
        return this.imageWrapper.view.rotation;
      },
      set(value) {
        this.$store.dispatch(this.viewerModule + 'setRotation', {index: this.index, rotation: Number(value)});
      }
    },

    viewState() {
      return {center: this.center, zoom: this.zoom, rotation: this.rotation};
    },

    extent() {
      return [0, 0, this.image.width, this.image.height];
    },
    imageSize() {
      return [this.image.width, this.image.height];
    },

    baseLayerURLs() {
      let filterPrefix = this.imageWrapper.colors.filter || '';
      let params = `&tileIndex={tileIndex}&z={z}&mimeType=${this.slice.mime}`;
      return  [`${filterPrefix}${this.slice.imageServerUrl}/slice/tile?fif=${this.slice.path}${params}`];
    },

    colorManipulationOn() {
      return this.imageWrapper.colors.brightness !== 0 || this.imageWrapper.colors.contrast !== 0
                || this.imageWrapper.colors.hue !== 0 || this.imageWrapper.colors.saturation !== 0;
    },
    operation() {
      return operation;
    },
    lib() {
      return {
        ...constLib,
        brightness: this.imageWrapper.colors.brightness,
        contrast: this.imageWrapper.colors.contrast,
        saturation: this.imageWrapper.colors.saturation,
        hue: this.imageWrapper.colors.hue
      };
    },

    layersToPreload() {
      let layers = [];
      let annot = this.selectedAnnotation || this.routedAnnotation;
      if(annot) {
        layers.push(annot.type === AnnotationType.REVIEWED ? -1 : annot.user);
      }
      if(this.routedAction === 'review' && !layers.includes(-1)) {
        layers.push(-1);
      }
      return layers;
    },

    overviewCollapsed() {
      return this.overview ? this.overview.getCollapsed() : this.imageWrapper.view.overviewCollapsed;
    },

    correction() {
      return ['correct-add', 'correct-remove'].includes(this.activeEditTool);
    },
    activeSelectInteraction() {
      return this.activeTool === 'select';
    },
    activeDrawInteraction() {
      return !this.activeSelectInteraction || this.correction;
    },
    activeModifyInteraction() {
      return this.activeSelectInteraction && this.activeEditTool && !this.correction;
    },
    idealZoom() {
      let container = this.$refs.container;
      let idealZoom = this.maxZoom;
      let factor = this.maxZoom - this.image.zoom;
      let mapWidth = this.image.width * Math.pow(2, factor);
      let mapHeight = this.image.height * Math.pow(2, factor);
      while(mapWidth > container.clientWidth || mapHeight > container.clientHeight) {
        mapWidth /= 2;
        mapHeight /= 2;
        idealZoom --;
      }
      return idealZoom;
    }
  },
  watch: {
    viewState() {
      this.savePosition();
    },
    overviewCollapsed(value) {
      this.$store.commit(this.imageModule + 'setOverviewCollapsed', value);
    }
  },
  methods: {
    setInitialZoom() {
      if(this.zoom !== null) {
        return; // not the first time the viewer is opened => zoom was already initialized
      }
      this.zoom = this.idealZoom;
    },
    setMagnification(magnification){
      this.zoom = Math.log(magnification / this.image.magnification) / Math.log(2) + this.image.zoom;
    },
    async updateMapSize() {
      await this.$nextTick();
      if(this.$refs.map) {
        this.$refs.map.updateSize();
      }
    },

    async updateKeyboardInteractions() {
      await this.$refs.map.$createPromise; // wait for ol.Map to be created

      this.$refs.map.$map.getInteractions().forEach(interaction => {
        if(interaction instanceof KeyboardPan || interaction instanceof KeyboardZoom) {
          interaction.condition_ = (mapBrowserEvent) => {
            return noModifierKeys(mapBrowserEvent)
              && targetNotEditable(mapBrowserEvent)
              && this.isActiveImage
              && !mapBrowserEvent.originalEvent.target.classList.contains('ql-editor');
          };
        }
      });
      if(!this.ScrollZoomConfig.value){
        this.$nextTick(() => {
          const interactions = this.$refs.map.$map.getInteractions();
          const mouseWheelZoomInteraction = interactions.getArray().find(interaction => interaction instanceof MouseWheelZoom);
          if(mouseWheelZoomInteraction) {
            interactions.remove(mouseWheelZoomInteraction);
          }
          const interaction = new CustomMouseWheelZoom();
          this.$refs.map.$map.addInteraction(interaction);
        });
      }


    },

    async viewMounted() {
      await this.$refs.view.$createPromise; // wait for ol.View to be created
      if(this.$route.params.idSnapshot){
        let geometry = this.format.readGeometry(this.$route.params.idSnapshot);
        await this.$refs.view.fit(geometry, {duration:500, padding: [10, 10, 10, 10], maxZoom: this.image.zoom});
      }
      if(this.routedAnnotation) {
        await this.centerViewOnAnnot(this.routedAnnotation, 500);
      }
      await this.savePosition();
    },

    async setBaseSource() {
      await this.$refs.baseSource.$createPromise;
      this.baseSource = this.$refs.baseSource.$source;
    },

    async addOverviewMap() {
      if(!this.isPanelDisplayed('overview')) {
        return;
      }

      await this.$refs.map.$createPromise; // wait for ol.Map to be created
      await this.$refs.baseLayer.$createPromise; // wait for ol.Layer to be created

      let map = this.$refs.map.$map;

      this.overview = new OverviewMap({
        view: new View({projection: this.projectionName}),
        layers: [this.$refs.baseLayer.$layer],
        tipLabel: this.$t('overview'),
        target: this.$refs.overview,
        collapsed: this.imageWrapper.view.overviewCollapsed
      });
      map.addControl(this.overview);

      this.overview.getOverviewMap().on(('click'), (evt) => {
        let size = map.getSize();
        map.getView().centerOn(evt.coordinate, size, [size[0]/2, size[1]/2]);
      });
    },

    toggleOverview() {
      if (this.overview) {
        this.overview.setCollapsed(!this.imageWrapper.view.overviewCollapsed);
      }
    },

    togglePanel(panel) {
      this.$store.commit(this.imageModule + 'togglePanel', panel);
    },

    savePosition: _.debounce(async function() {
      if(this.$refs.view) {
        let extent = this.$refs.view.$view.calculateExtent(); // [minX, minY, maxX, maxY]
        try {
          await UserPosition.create({
            image: this.image.id,
            slice: this.slice.id,
            zoom: this.zoom,
            rotation: this.rotation,
            bottomLeftX: Math.round(extent[0]),
            bottomLeftY: Math.round(extent[1]),
            bottomRightX: Math.round(extent[2]),
            bottomRightY: Math.round(extent[1]),
            topLeftX: Math.round(extent[0]),
            topLeftY: Math.round(extent[3]),
            topRightX: Math.round(extent[2]),
            topRightY: Math.round(extent[3]),
            broadcast: this.imageWrapper.tracking.broadcast
          });
        }
        catch(error) {
          console.log(error);
          this.$notify({type: 'error', text: this.$t('notif-error-save-user-position')});
        }

        clearTimeout(this.timeoutSavePosition);
        this.timeoutSavePosition = setTimeout(this.savePosition, constants.SAVE_POSITION_IN_IMAGE_INTERVAL);
      }
    }, 500),

    fitZoom() {
      this.$refs.view.animate({
        zoom: this.idealZoom,
        center: [this.image.width/2, this.image.height/2]
      });
    },

    async centerViewOnAnnot(annot, duration) {

      if (annot.image === this.image.id) {
        if (!annot.location) {
          //in case annotation location has not been loaded
          annot = await Annotation.fetch(annot.id);
        }

        let geometry = this.format.readGeometry(annot.location);
        await this.$refs.view.fit(geometry, {duration, padding: [10, 10, 10, 10], maxZoom: this.image.zoom});

        // HACK: center set by view.fit() is incorrect => reset it manually
        this.center = (geometry.getType() === 'Point') ? geometry.getFirstCoordinate()
          : [annot.centroid.x, annot.centroid.y];
        // ---
      }
    },

    async selectAnnotationHandler({index, annot, center=false, showComments=false}) {
      if (this.index === index && annot.image === this.image.id) {
        try {
          let sliceChange = false;
          if (!annot.slice) {
            //in case annotation slice has not been loaded
            annot = await Annotation.fetch(annot.id);
          }

          if(annot.slice !== this.slice.id) {
            let slice = await SliceInstance.fetch(annot.slice);
            await this.$store.dispatch(this.imageModule + 'setActiveSlice', slice);
            this.$eventBus.$emit('reloadAnnotations', {idImage: this.image.id, hard: true});
            sliceChange = true;
          }

          if (showComments) {
            this.$store.commit(this.imageModule + 'setShowComments', annot);
          }

          this.selectedAnnotation = annot; // used to pre-load annot layer
          this.$store.commit(this.imageModule + 'setAnnotToSelect', annot);
          this.$eventBus.$emit('selectAnnotationInLayer', {index, annot});

          if (center) {
            await this.viewMounted();
            let duration = (sliceChange) ? undefined : 500;
            await this.centerViewOnAnnot(annot, duration);
          }
        }
        catch(error) {
          console.log(error);
          this.$notify({type: 'error', text: this.$t('notif-error-target-annotation')});
        }
      }
    },

    isPanelDisplayed(panel) {
      return this.configUI[`project-explore-${panel}`];
    },
    shortkeyHandler(key) {
      if(!key.startsWith('toggle-all-') && !this.isActiveImage) { // shortkey should only be applied to active map
        return;
      }

      key = key.replace('toggle-all-', 'toggle-');
      switch(key) {
        case 'toggle-information':
          if (this.isPanelDisplayed('info')){
            this.togglePanel('info');
          }
          return;
        case 'toggle-zoom':
          if (this.isPanelDisplayed('digital-zoom')) {
            this.togglePanel('digital-zoom');
          }
          return;
        case 'toggle-link':
          if (this.isPanelDisplayed('link') && this.nbImages > 1) {
            this.togglePanel('link');
          }
          return;
        case 'toggle-filters':
          if (this.isPanelDisplayed('color-manipulation')) {
            this.togglePanel('colors');
          }
          return;
        case 'toggle-layers':
          if (this.isPanelDisplayed('image-layers')) {
            this.togglePanel('layers');
          }
          return;
        case 'toggle-ontology':
          if (this.isPanelDisplayed('ontology') && this.terms && this.terms.length > 0) {
            this.togglePanel('ontology');
          }
          return;
        case 'toggle-properties':
          if (this.isPanelDisplayed('property')) {
            this.togglePanel('properties');
          }
          return;
        case 'toggle-broadcast':
          if (this.isPanelDisplayed('follow')) {
            this.togglePanel('follow');
          }
          return;
        case 'toggle-review':
          if (this.isPanelDisplayed('review') && this.canEdit) {
            this.togglePanel('review');
          }
          return;
        case 'toggle-overview':
          if (this.isPanelDisplayed('overview')) {
            this.toggleOverview();
          }
          return;
      }
    },

    async takeScreenshot() {

      // Use of css percent values and html2canvas results in strange behavior
      // Set image container as actual height in pixel (not in percent) to avoid image distortion when retrieving canvas
      let containerHeight = document.querySelector('.map-container').clientHeight;
      document.querySelector('.map-container').style.height = containerHeight+'px';

      let a = document.createElement('a');
      a.href = await this.$html2canvas(document.querySelector('.ol-unselectable'), {type: 'dataURL'});
      let imageName = 'image_' + this.image.id.toString() + '_project_' + this.image.project.toString() + '.png';
      a.download = imageName;
      a.click();
      document.querySelector('.map-container').style.height = '';
    },
    async takeSnapshot() {
      try {
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        let imageName = 'project_' + this.project.name +'_image_' + this.image.filename +
          '__' +`${year}-${month}-${day}_${hours}:${minutes}:${seconds}`+'.jpg';
        let containerHeight = document.querySelector('.map-container').clientHeight;
        document.querySelector('.map-container').style.height = containerHeight+'px';
        const canvas = await this.$html2canvas(document.querySelector('.ol-unselectable'));
        canvas.toBlob(async (blob) => {
          const file= new File([blob], imageName, { type: 'image/jpeg' });
          let snapshotFile = new SnapshotFile({file: file, filename: imageName},this.imageWrapper.imageInstance).save();
          await this.$emit(snapshotFile);
        }, 'image/jpeg');
        document.querySelector('.map-container').style.height = '';
        this.$notify({type: 'success', text: this.$t(`Success get snapshot ${imageName}`)});
        await this.webhookSnapshot(imageName,canvas);
      }
      catch (error){
        this.$notify({type: 'error', text: this.$t(`error: ${error}`)});
      }
    },
    async webhookSnapshot(imageName,canvas){
      let webhookUrl = this.WebhookConfig.value;
      if(webhookUrl.length===0){
        return;
      }
      let snapshotID = '';
      let snapshotURL;
      for (let i = 0; i < 10; i++) {
        await new Promise((resolve) => {
          setTimeout(resolve, 200);
        }).then(result =>{
          console.log(result);
        }).catch(error=>{
          console.log(error);
        });
        this.snapshotFiles = (await SnapshotFileCollection.fetchAll({object: this.image})).array;
        for (let i = 0; i < this.snapshotFiles.length; i++) {
          let file = this.snapshotFiles[i];
          if (file.filename === imageName) {
            snapshotID = file.id.toString();
            snapshotURL = this.host + file.url;
          }
        }
        if(snapshotID.length > 0){
          break;
        }
      }
      const urls = webhookUrl.split(';');
      for (let i = 0; i < urls.length; i++) {
        let url = urls[i];
        if (!/^(http|https):\/\//.test(url)) {
          url = 'http://' + url;
        }
        const project = {
          project: {
            id: this.image.project.toString(),
            name: this.project.name
          },
          image: {
            id: this.image.id.toString(),
            name: this.image.filename,
            thunmbnail:this.image.previewURL()
          },
          snapshot: {
            id: snapshotID,
            URL: snapshotURL,
            pxLeft: canvas.height.toString()+'px',
            pxTop: canvas.width.toString()+'px',
          },
          sendUrl: url,
        };
        try {
          let data = await Cytomine.instance.api.post('/webhook.json', project);
          this.$notify({type: 'success', text: data.data});
        }
        catch (error) {
          this.$notify({type: 'error', text: error});
        }
      }

    },
  },
  async created() {
    if(!getProj(this.projectionName)) { // if image opened for the first time
      let projection = createProj({code: this.projectionName, units: 'pixels', extent: this.extent});
      addProj(projection);
    }

    if(this.routedAction === 'review') {
      this.togglePanel('review');
      if(!this.image.inReview) {
        try {
          let clone = await this.image.clone().review();
          this.$store.commit(this.imageModule + 'setImageInstance', clone);
        }
        catch(error) {
          console.log(error);
          this.$notify({type: 'error', text: this.$t('notif-error-start-review')});
        }
      }
      this.$store.commit(this.imageModule + 'setReviewMode', true);
    }

    // remove all selected features in order to reselect them when they will be added to the map (otherwise,
    // issue with the select interaction)
    this.selectedLayers.forEach(layer => {
      this.$store.commit(this.imageModule + 'removeLayerFromSelectedFeatures', {layer, cache: true});
    });

    let annot = this.imageWrapper.routedAnnotation;
    if (!annot) {
      let idRoutedAnnot = this.$route.params.idAnnotation;
      if (idRoutedAnnot) {
        try {
          annot = await Annotation.fetch(idRoutedAnnot);
        }
        catch (error) {
          console.log(error);
          this.$notify({type: 'error', text: this.$t('notif-error-target-annotation')});
        }
      }
    }

    if (annot) {
      try {
        if (annot.image === this.image.id) {
          if (annot.slice !== this.slice.id) {
            let slice = await SliceInstance.fetch(annot.slice);
            await this.$store.dispatch(this.imageModule + 'setActiveSlice', slice);
          }
          this.routedAnnotation = annot;
          if (this.routedAction === 'comments') {
            this.$store.commit(this.imageModule + 'setShowComments', annot);
          }
          this.$store.commit(this.imageModule + 'setAnnotToSelect', annot);
        }

        this.$store.commit(this.imageModule + 'clearRoutedAnnotation');
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('notif-error-target-annotation')});
      }
    }
    await this.$store.dispatch(this.imageModule + 'updatedAnnotationColor');
    await this.$store.dispatch(this.imageModule + 'setNoTermStyle');
    try {
      await this.MillimeterConfig.fetch();
    }
    catch(error) {
      // no set
    }
    try {
      await this.AnnotationLineColorConfig.fetch();
    }
    catch(error) {
      // no set
    }
    try {
      await this.WebhookConfig.fetch();
    }
    catch(error) {
      // no webhook message currently set
    }
    try {
      await this.ScrollZoomConfig.fetch();
    }
    catch (error) {
      // no set
    }
    try {
      await new ImageConsultation({image: this.image.id}).save();
    }
    catch(error) {
      console.log(error);
      this.$notify({type: 'error', text: this.$t('notif-error-save-image-consultation')});
    }

    this.loading = false;
  },
  mounted() {
    this.$eventBus.$on('updateMapSize', this.updateMapSize);
    this.$eventBus.$on('shortkeyEvent', this.shortkeyHandler);
    this.$eventBus.$on('selectAnnotation', this.selectAnnotationHandler);
    this.setInitialZoom();
  },
  beforeDestroy() {
    this.$eventBus.$off('updateMapSize', this.updateMapSize);
    this.$eventBus.$off('shortkeyEvent', this.shortkeyHandler);
    this.$eventBus.$off('selectAnnotation', this.selectAnnotationHandler);
    clearTimeout(this.timeoutSavePosition);
  }
};
</script>

<style lang="scss">
@import '~vuelayers-c/lib/style.css';

$backgroundPanelBar: #555;
$widthPanelBar: 2.8rem;
$backgroundPanel: #f2f2f2;
$colorPanelLink: #eee;
$colorHoverPanelLink: white;
$colorBorderPanelLink: #222;
$colorOpenedPanelLink: #6c95c8;
$colorActiveIcon: #fff;

.map-container {
  display:flex;
  position: relative;
  width: 100%;
  height: 100%;
}

.map {
  flex-grow: 1;
}

.draw-tools {
  position: absolute;
  top: 0.7em;
  left: 3.5rem;
  right: $widthPanelBar;
  z-index: 30;
}
.mass {
  position: absolute;
  top: 50px;
  left: 2px;
  right: $widthPanelBar;
  z-index: 30;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  width: 30px;
  .button{
      width: 22px;
      height: 22px;
      border-color: #dbdbdb;
  }
  .button.is-selected {
    background-color: #6899d0;
    color: $colorActiveIcon;
    path {
      stroke: $colorActiveIcon;
    }
  }
}
.broadcast {
  position: absolute;
  right: 4.5rem;
  top: 0.7em;
  text-transform: uppercase;
  font-weight: 600;
  background-color: #EE4242;
  color: white;
  padding: 0.25em 0.75em 0.25em 0.55em;
  border-radius: 5px;
  border: 2px solid white;

  i.fas {
    margin-right: 0.3em;
  }
}

.panels {
  background: $backgroundPanelBar;
  display: flex;
  font-size: 0.9em;

  > ul {
    padding: 0;
    margin: 0;

    > li {
      position: relative;

      > a {
        position: relative;
        display: block;
        width: $widthPanelBar;
        padding: 0.35rem 0.8rem;
        font-size: 1.25rem;
        color: $colorPanelLink;
        border-bottom: 1px solid $colorBorderPanelLink;
        text-decoration: none;
        text-align:center;

        &:hover {
          color: $colorHoverPanelLink;
        }

        &.active {
          background: $backgroundPanel;
          color: $colorOpenedPanelLink;
        }

        &.close {
          color: #ffc4c4;
          :hover {
            color: #ff7070;
          }
        }
      }
    }
  }
}

.panel-options {
  position: absolute;
  bottom: -1.75em;
  right: $widthPanelBar;
  width: 24em;
  min-height: 10em;
  background: $backgroundPanel;
  padding: 0.75em;
  border-radius: 5px 0 0 5px;
  z-index: 100;

  h1 {
    font-size: 1.1rem;
    padding-top: 0.3rem !important;
    padding-bottom: 1rem !important;
  }

  table {
    background: none;
    width: 100%;
  }
}

.panels li:nth-child(-n+7) .panel-options {
  bottom: -7.5em;
  min-height: 13em;
}

.panels li:nth-child(-n+3) .panel-options {
  top: -1.75em;
  bottom: auto;
  min-height: 7.5em;
}

.panels li:nth-child(4) .panel-options {
  top: -5.5em;
  bottom: auto;
}
.text {
  font-size: 9px ;
  font-weight: 400;
}
/* ----- CUSTOM STYLE FOR OL CONTROLS ----- */

.ol-zoom, .ol-rotate {
  background: none !important;
  z-index: 20;
}

.ol-rotate:not(.custom) {
  display: none;
}
.rotation-selector-wrapper.rotation-selector-wrapper{
  top: 200px;
}

.ol-control button {
  background: white !important;
  color: black !important;
  border-radius: 0 !important;
  box-shadow: 0 0 1px #777;
  margin: 0 !important;
  width: 22px;
  height: 22px;
  &:hover {
    box-shadow: 0 0 1px black;
    cursor: pointer;
  }
}


/* ----- Rotation selector ----- */
.rotation-selector-wrapper {
  position: absolute;
  left: .5em;
  top: 5rem;
  z-index: 20;
}

.custom-overview {
  position: absolute;
  bottom: 0.5em;
  left: 0.5em;
  background: rgba(255, 255, 255, 0.8);
  display: flex;
  flex-direction: column;
  border-radius: 4px;

  .ol-overviewmap {
    position: static;
    background: none;
  }

  .ol-overviewmap:not(.ol-collapsed) button {
    bottom: 2px !important;
  }

  .image-name {
    font-size: 0.8em;
    padding: 2px 5px;
    width: 158px;
    word-wrap: break-word;

    &.hidden {
      display: none;
    }
  }
}

/* ----- Image controls ----- */
.image-controls-wrapper {
  position: absolute;
  bottom: 1.5rem;
  left: 20%;
  right: calc(#{$widthPanelBar} + 20%);
  z-index: 5;
}

/* ----- Annotation list ----- */
.annotations-table-wrapper {
  position: absolute;
  bottom: 0;
  left: 0;
  right: $widthPanelBar;
  z-index: 40;
  pointer-events: none;
}
</style>
