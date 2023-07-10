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
<div>
  <vl-layer-vector>
    <vl-source-vector :ident="drawSourceName" ref="olSourceDrawTarget" />
  </vl-layer-vector>


  <!-- show line length -->
  <vl-overlay v-if="startPoint[0] > 0 && this.activeTool === 'line' " :position="lineTextPosition">
    <div class="overlay">
      <div class="draw-content">
        <div class="line-text-new">{{ lineShowLength }}</div>
      </div>
    </div>
  </vl-overlay>

  <template v-for="(item, index) in lineItems" >
    <vl-overlay
      :key="index"
      v-if="startPoint[0] > 0 && activeTool === 'line'"
      :position="item.position"
    >
      <div class="overlay">
        <div class="draw-content">
          <div class="line-text">{{ item.lineShowLength }}</div>
        </div>
      </div>
    </vl-overlay>
  </template>


  <!-- show radius and length -->
  <vl-overlay v-if="startPoint[0] > 0 && this.activeTool === 'circle' " :position="circleCenterPosition">
    <div class="overlay">
      <div class="draw-content">
        <div class="line-text">{{ lineShowLength }}</div>
        <div class="dashed-line" :style="{width: (lineLength/this.image.magnification*this.magnification).toFixed(0) + 'px' }"></div>
      </div>
    </div>
  </vl-overlay>

  <!-- show rectangular length -->
  <vl-overlay v-if="startPoint[0] > 0 && this.activeTool === 'rectangle' " :position="rectangularLengthPosition">
    <div class="overlay">
      <div class="draw-content">
        <div class="line-text ">{{ rectangularShowLength }}</div>
        <div class="dashed-line" :style="{ width: rectangularLengthPixel + 'px' }"></div>
      </div>
    </div>
  </vl-overlay>
  <vl-overlay v-if="startPoint[0] > 0 && this.activeTool === 'rectangle' " :position="rectangularWidthPosition">
    <div class="overlay">
      <div class="draw-content">
        <div class="rectangular-width-line-text" :style="{transform: `translate(-50%,${rectangularWidthPixel/2}px)`}">{{ rectangularShowWidth }}</div>
        <div class="rectangular-width-dashed-line" :style="{ height: rectangularWidthPixel + 'px' }"></div>
      </div>
    </div>
  </vl-overlay>



  <vl-interaction-draw
    v-if="nbActiveLayers > 0 || drawCorrection"
    ref="olDrawInteraction"
    :source="drawSourceName"
    :type="drawType"
    :freehand="drawFreehand"
    :freehand-condition="undefined"
    :geometry-function="drawGeometryFunction"
    @drawend="drawEndHandler"
    @drawstart="drawStart"
  />
</div>
</template>

<script>
import {get} from '@/utils/store-helpers';

import Polygon, {fromCircle as polygonFromCircle} from 'ol/geom/Polygon';
import WKT from 'ol/format/WKT';

import {Annotation, AnnotationType} from 'cytomine-client-c';
import {Action} from '@/utils/annotation-utils.js';
import LineString from 'ol/geom/LineString';
import Circle from 'ol/geom/Circle';

export default {
  name: 'draw-interaction',
  props: {
    index: String,
    mousePosition: Array,
    zoom: Number,
  },
  data() {
    return {
      format: new WKT(),
      startPoint: [0,0],
      nowCoordinates:[[0,0],[0,0]],
      mouseNowPosition: Array,
      mouseEndDrawn: false,
    };

  },
  computed: {

    nowMousePosition(){
      if(!this.mouseEndDrawn){
        this.updateMousePosition();
      }
      return this.mouseNowPosition;
    },
    magnification() {
      let magnification = Math.pow(2, this.zoom - this.image.zoom) * this.image.magnification;
      return Math.round(magnification * 100) / 100;
    },
    circleCenterPosition(){
      return [
        (this.startPoint[0] + this.lineLength/2) ,
        this.startPoint[1]
      ];
    },
    lineTextPosition() {
      return [
        (this.nowCoordinates[this.nowCoordinates.length - 2 ][0] + this.nowMousePosition[0]) / 2,
        (this.nowCoordinates[this.nowCoordinates.length - 2 ][1] + this.nowMousePosition[1]) / 2
      ];
    },
    lineItems(){
      const items = [];
      for (let i = 0; i < this.nowCoordinates.length -2 ; i++) {
        const deltaX = this.nowCoordinates[i+1][0] - this.nowCoordinates[i][0];
        const deltaY = this.nowCoordinates[i+1][1] - this.nowCoordinates[i][1];
        items.push({
          position: [(this.nowCoordinates[i][0] + this.nowCoordinates[i+1][0])/2, (this.nowCoordinates[i][1] + this.nowCoordinates[i+1][1])/2],
          lineShowLength: this.computeShowLength(Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(2)),
        });
      }
      return items;
    },
    lineLength(){
      const deltaX = this.nowMousePosition[0] - this.nowCoordinates[this.nowCoordinates.length - 2 ][0];
      const deltaY = this.nowMousePosition[1] - this.nowCoordinates[this.nowCoordinates.length - 2 ][1];
      return  Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(2);
    },
    lineShowLength() {
      return this.computeShowLength(this.lineLength);
    },
    rectangularLength(){
      return Math.abs(this.nowMousePosition[0] - this.startPoint[0]) ;
    },
    rectangularWidth(){
      return Math.abs(this.nowMousePosition[1] - this.startPoint[1]) ;
    },
    rectangularShowLength(){
      return this.computeShowLength(this.rectangularLength);
    },
    rectangularShowWidth(){
      return this.computeShowLength(this.rectangularWidth);
    },
    rectangularLengthPixel(){
      return (this.rectangularLength/this.image.magnification*this.magnification).toFixed(0);
    },
    rectangularWidthPixel(){
      return (this.rectangularWidth/this.image.magnification*this.magnification).toFixed(0);
    },
    rectangularLengthPosition(){
      if ((this.nowMousePosition[0] - this.startPoint[0]<0)){
        if((this.nowMousePosition[1] - this.startPoint[1]<0)){
          return [
            (this.startPoint[0] - this.rectangularLength/2) ,
            (this.startPoint[1] - this.rectangularWidth/4)
          ];
        }
        else {
          return [
            (this.startPoint[0] - this.rectangularLength/2) ,
            (this.startPoint[1] + this.rectangularWidth/4)
          ];
        }
      }
      else {
        if((this.nowMousePosition[1] - this.startPoint[1]<0)){
          return [
            (this.startPoint[0] + this.rectangularLength/2) ,
            (this.startPoint[1] - this.rectangularWidth/4)
          ];
        }
        else {
          return [
            (this.startPoint[0] + this.rectangularLength/2) ,
            (this.startPoint[1] + this.rectangularWidth/4)
          ];
        }
      }
    },
    rectangularWidthPosition(){
      if ((this.nowMousePosition[1] - this.startPoint[1]<0)){
        if(this.nowMousePosition[0] - this.startPoint[0]<0){
          return [
            (this.startPoint[0] - this.rectangularLength/4) ,
            (this.startPoint[1] - this.rectangularWidth/2)
          ];
        }
        else {
          return [
            (this.startPoint[0] + this.rectangularLength/4) ,
            (this.startPoint[1] - this.rectangularWidth/2)
          ];
        }
      }
      else {
        if(this.nowMousePosition[0] - this.startPoint[0]<0){
          return [
            (this.startPoint[0] - this.rectangularLength/4) ,
            (this.startPoint[1] + this.rectangularWidth/2)
          ];
        }
      }
      return [
        (this.startPoint[0] + this.rectangularLength/4) ,
        (this.startPoint[1] + this.rectangularWidth/2)
      ];
    },

    currentUser: get('currentUser/user'),
    imageModule() {
      return this.$store.getters['currentProject/imageModule'](this.index);
    },
    imageWrapper() {
      return this.$store.getters['currentProject/currentViewer'].images[this.index];
    },
    rotation() {
      return this.imageWrapper.view.rotation;
    },
    termsToAssociate() {
      return this.imageWrapper.draw.termsNewAnnots;
    },
    tracksToAssociate() {
      return this.imageWrapper.draw.tracksNewAnnots;
    },
    image() {
      return this.imageWrapper.imageInstance;
    },
    slice() {
      return this.imageWrapper.activeSlice;
    },
    activeTool() {
      return this.imageWrapper.draw.activeTool;
    },
    activeEditTool() {
      return this.imageWrapper.draw.activeEditTool;
    },
    selectedFeature() {
      return this.$store.getters[this.imageModule + 'selectedFeature'];
    },
    drawType() {
      switch(this.activeTool) {
        case 'point':
          return 'Point';
        case 'line':
        case 'freehand-line':
          return 'LineString';
        case 'rectangle':
        case 'circle':
          return 'Circle';
        case 'polygon':
        case 'freehand-polygon':
        case 'select': // correct mode
          return 'Polygon';
        default:
          return ''; // Should not happen
      }
    },
    drawCorrection() {
      return this.activeTool === 'select';
    },
    drawFreehand() {
      return this.activeTool === 'freehand-polygon' || this.activeTool === 'freehand-line' || this.drawCorrection;
    },
    drawGeometryFunction() {
      switch(this.activeTool){
        case 'rectangle':
          return (coordinates, geometry) => {
            this.nowCoordinates = coordinates;
            let rotatedCoords = this.rotateCoords(coordinates, this.rotation);
            let [firstCorner, thirdCorner] = rotatedCoords;
            let secondCorner = [thirdCorner[0], firstCorner[1]];
            let fourthCorner = [firstCorner[0], thirdCorner[1]];
            let rotatedBoxCoordinates = [firstCorner, secondCorner, thirdCorner, fourthCorner, firstCorner];
            let boxCoordinates = [this.rotateCoords(rotatedBoxCoordinates, -this.rotation)];
            if(geometry) {
              geometry.setCoordinates(boxCoordinates);
            }
            else {
              geometry = new Polygon(boxCoordinates);
            }
            return geometry;
          };
        case 'line':
          return (coordinates, geometry) => {
            this.nowCoordinates = coordinates;
            if(geometry) {

              geometry.setCoordinates(coordinates);
            }
            else {
              geometry = new LineString(coordinates);
            }
            return geometry;
          };
        case 'circle':
          return (coordinates, geometry) => {
            this.nowCoordinates = coordinates;
            if(geometry) {
              const dx = coordinates[1][0] - coordinates[0][0];
              const dy = coordinates[1][1] - coordinates[0][1];
              geometry.setCenterAndRadius(coordinates[0],Math.sqrt(dx * dx + dy * dy));
            }
            else {
              geometry = new Circle(coordinates);
            }
            return geometry;
          };
        default:
          return null;
      }
    },
    layers() {
      return this.imageWrapper.layers.selectedLayers || [];
    },
    activeLayers() {
      return this.layers.filter(layer => layer.drawOn);
    },
    nbActiveLayers() {
      return this.activeLayers.length;
    },
    drawSourceName() {
      return `draw-target-${this.index}`;
    }
  },

  watch: {
    activeTool() {
      this.startPoint[0] = 0;
      this.$refs.olDrawInteraction.scheduleRecreate();
    },
  },

  methods: {
    updateMousePosition(){
      this.mouseNowPosition = this.mousePosition;
      this.mouseNowPosition = this.nowCoordinates[this.nowCoordinates.length - 1];
      this.startPoint = this.nowCoordinates[0];
    },
    computeShowLength(Length){
      let resolution = this.image.physicalSizeX ? this.image.physicalSizeX : 1;
      let length = Length * resolution;

      if(this.image.physicalSizeX) {
        let unit = this.$t('um');
        if (length > 1000) {
          length /= 1000;
          unit = this.$t('mm');
        }
        return `${length.toFixed(3)} ${unit}`;
      }
      else {
        return `${Math.round(length*1000) / 1000} ${this.$t('pixels')}`;
      }
    },
    rotateCoords(coords, theta) {
      let cosTheta = Math.cos(theta);
      let sinTheta = Math.sin(theta);
      return coords.map(([x, y]) => [x*cosTheta + y*sinTheta, -x*sinTheta + y*cosTheta]);
    },
    drawStart(){
      this.startPoint=this.mousePosition;
      this.mouseEndDrawn = false;
    },
    clearDrawnFeatures() {
      this.$refs.olSourceDrawTarget.clear();
    },

    async drawEndHandler({feature}) {
      this.mouseEndDrawn = true;
      if(this.drawCorrection) {
        await this.endCorrection(feature);
      }
      else if(this.nbActiveLayers > 0) {
        await this.endDraw(feature);
      }

      this.clearDrawnFeatures();
    },

    async endDraw(drawnFeature) {
      this.activeLayers.forEach(async (layer, idx) => {
        let annot = new Annotation({
          location: this.getWktLocation(drawnFeature),
          image: this.image.id,
          slice: this.slice.id,
          user: layer.id,
          term: this.termsToAssociate,
          track: this.tracksToAssociate
        });

        try {
          await annot.save();
          annot.userByTerm = this.termsToAssociate.map(term => ({term, user: [this.currentUser.id]}));
          this.$eventBus.$emit('addAnnotation', annot);
          if(idx === this.nbActiveLayers - 1) {
            this.$eventBus.$emit('selectAnnotation', {index: this.index, annot});
          }
          this.$store.commit(this.imageModule + 'addAction', {annot, type: Action.CREATE});
        }
        catch(err) {
          console.log(err);
          this.$notify({type: 'error', text: this.$t('notif-error-annotation-creation')});
        }
      });
    },

    async endCorrection(feature) {
      if(!this.selectedFeature) {
        return;
      }
      try {
        let annot = this.selectedFeature.properties.annot;
        let correctedAnnot = await Annotation.correctAnnotations({
          location: this.getWktLocation(feature),
          review: annot.type === AnnotationType.REVIEWED,
          remove: (this.activeEditTool === 'correct-remove'),
          annotation: annot.id
        });
        if(correctedAnnot) {
          correctedAnnot.userByTerm = annot.userByTerm; // copy terms from initial annot
          correctedAnnot.track = annot.track;
          correctedAnnot.annotationTrack = annot.annotationTrack;
          this.$store.commit(this.imageModule + 'addAction', {annot: correctedAnnot, type: Action.UPDATE});
          this.$eventBus.$emit('editAnnotation', correctedAnnot);
        }
      }
      catch(err) {
        console.log(err);
        this.$notify({type: 'error', text: this.$t('notif-error-annotation-correction')});
      }
    },

    getWktLocation(feature) {
      // transform circle to circular polygon
      let geometry = feature.getGeometry();
      if (geometry.getType() === 'Circle') {
        feature.setGeometry(polygonFromCircle(geometry));
      }
      return this.format.writeFeature(feature);
    },
  }
};
</script>


<style>

.dashed-line {
  height: 1px;
  border-top: 1px dashed #333;
  margin-top: 1px;
  margin-bottom: 1px;
  position: relative;
}
.rectangular-width-dashed-line {
  width: 1px;
  border-left: 1px dashed #333;
  margin-left: 1px;
  margin-bottom: 1px;
  position: relative;
}
.rectangular-width-line-text {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.4);
  padding: 0 4px;
  white-space: nowrap;
  left: 50%;

}

.overlay {
  position: relative;
}
.draw-content {
  position: absolute;
  transform: translate(-50%, -50%);
}
.line-text {
  position: absolute;
  background-color: rgba(255, 255, 255, 0.4);
  padding: 0 4px;
  white-space: nowrap;
  left: 50%;
  transform: translate(-50%, -50%);
}

.line-text-new{
  position: absolute;
  background-color: rgba(255, 255, 255, 0.4);
  padding: 0 4px;
  margin-top: -20px;
  white-space: nowrap;
  left: 50%;
  transform: translate(-50%, -50%);
}
</style>
