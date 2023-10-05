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
  <vl-overlay v-if="startPoint[0] > 0 && this.activeTool === 'line' && this.DrawingLines" :position="lineTextPosition">
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
  <vl-overlay v-if="startPoint[0] > 0 && this.activeTool === 'rectangle'" :position="rectangularLengthPosition">
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
    :annotationDrawLineColor="AnnotationLineColorConfig.value"
    :activeTool="activeTool"
    :max-points="maxPoint"
    @drawend="drawEndHandler"
    @drawstart="drawStart"
  />
</div>
</template>

<script>
import {get} from '@/utils/store-helpers';

import Polygon, {fromCircle as polygonFromCircle} from 'ol/geom/Polygon';
import WKT from 'ol/format/WKT';

import {Annotation, AnnotationType, Cytomine} from 'cytomine-client-c';
import {Action} from '@/utils/annotation-utils.js';
import LineString from 'ol/geom/LineString';
import Circle from 'ol/geom/Circle';
import {getBottomRight, getTopLeft} from 'ol/extent';

export default {
  name: 'draw-interaction',
  props: {
    index: String,
    mousePosition: Array,
    zoom: Number,
    AnnotationLineColorConfig: Object,
    WebhookConfig:Object,
    MillimeterConfig:Object,
    map: Object,
    drawing: Boolean,
  },
  data() {
    return {
      format: new WKT(),
      startPoint: [0,0],
      nowCoordinates:[[0,0],[0,0]],
      mouseNowPosition: Array,
      mouseEndDrawn: false,
      items: [],
      DrawingLines: false,
      undoTime: 0,
      maxPoint:undefined,
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
      for (let i = 0; i < this.nowCoordinates.length - 2 ; i++) {
        const deltaX = this.nowCoordinates[i+1][0] - this.nowCoordinates[i][0];
        const deltaY = this.nowCoordinates[i+1][1] - this.nowCoordinates[i][1];
        items.push({
          position: [(this.nowCoordinates[i][0] + this.nowCoordinates[i+1][0])/2, (this.nowCoordinates[i][1] + this.nowCoordinates[i+1][1])/2],
          lineShowLength: this.computeShowLength(Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(2)),
        });
      }
      if(this.undoTime > 0){
        this.updateUndoTime(0);
      }
      else if (this.items.length > items.length){
        return this.items;
      }
      this.updateItems(items);
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
    project: get('currentProject/project'),
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
      this.updateDrawMaxPoint(this.imageWrapper.draw.activeTool === 'arrow');
      return this.imageWrapper.draw.activeTool;
    },
    activeEditTool() {
      return this.imageWrapper.draw.activeEditTool;
    },
    selectedFeature() {
      return this.$store.getters[this.imageModule + 'selectedFeature'];
    },
    host() {
      return Cytomine.instance.host;
    },
    drawType() {
      switch(this.activeTool) {
        case 'point':
          return 'Point';
        case 'line':
        case 'arrow':
        case 'freehand-line':
          return 'LineString';
        case 'rectangle':
        case 'draw-snapshot':
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
      return this.activeTool === 'freehand-polygon' || this.activeTool === 'freehand-line' || this.activeTool === 'circle' ||
        this.activeTool === 'rectangle' || this.drawCorrection;
    },
    drawGeometryFunction() {
      switch(this.activeTool){
        case 'rectangle':
        case 'draw-snapshot':
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
        case 'arrow':
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
    updateDrawMaxPoint(arrow){
      this.maxPoint = arrow ? 2 : undefined;
    },
    updateUndoTime(times){
      this.undoTime = times;
    },
    updateDrawing(newDrawing) {
      this.$emit('update:drawing', newDrawing);
    },
    updateItems(items){
      this.items = items;
    },
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
        if (this.MillimeterConfig.value || length > 1000) {
          length /= 1000;
          unit = this.$t('mm');
        }
        return `${length.toFixed(2)} ${unit}`;
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
      this.items = [];
      this.DrawingLines = true;
      this.undoTime = 0;
      this.mouseEndDrawn = false;
      this.updateDrawing(true);
    },
    clearDrawnFeatures() {
      this.$refs.olSourceDrawTarget.clear();
    },

    async drawEndHandler({feature}) {
      this.DrawingLines = false;
      this.mouseEndDrawn = true;
      this.updateDrawing(false);
      if(this.activeTool === 'draw-snapshot'){
        if(this.nbActiveLayers > 0){
          await this.endDrawSnapshot(feature);
        }
        this.clearDrawnFeatures();
        return;
      }
      if(this.drawCorrection) {
        await this.endCorrection(feature);
      }
      else if(this.nbActiveLayers > 0) {
        await this.endDraw(feature);
      }

      this.clearDrawnFeatures();
    },

    async endDrawSnapshot(drawnFeature) {
      try {
        let location=this.getWktLocation(drawnFeature);
        let geometry = this.format.readGeometry(location);
        let extent = geometry.getExtent();
        const date = new Date();
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        let snapshotName = 'project_' + this.project.name +'_image_' + this.image.filename +
          '__' +`${year}-${month}-${day}_${hours}:${minutes}:${seconds}`+'.jpg';
        let topLeft = this.map.$map.getPixelFromCoordinate(getTopLeft(extent));
        let bottomRight = this.map.$map.getPixelFromCoordinate(getBottomRight(extent));
        let canvas = document.querySelector('.ol-viewport > canvas');
        let exportCanvas = document.createElement('canvas');
        // Subtract 4 pixels (2 for top and 2 for bottom) from the height
        exportCanvas.height = bottomRight[1] - topLeft[1] - 4;
        // Subtract 4 pixels (2 for left and 2 for right) from the width
        exportCanvas.width = bottomRight[0] - topLeft[0] - 4;
        let context = exportCanvas.getContext('2d');
        context.drawImage(
          canvas,
          topLeft[0] + 2, // Start 2 pixels to the right
          topLeft[1] + 2, // Start 2 pixels down
          bottomRight[0] - topLeft[0] - 4, // End 2 pixels before the right edge
          bottomRight[1] - topLeft[1] - 4, // End 2 pixels before the bottom edge
          0, 0,
          bottomRight[0] - topLeft[0] - 4, // Width is 4 pixels less
          bottomRight[1] - topLeft[1] - 4  // Height is 4 pixels less
        );
        const formData = new FormData();
        formData.append('location', location );
        formData.append('image', this.image.id);
        formData.append('slice', this.slice.id);
        formData.append('width', this.image.width);
        formData.append('height', this.image.height);
        formData.append('snapshotName', snapshotName);
        formData.append('domainClassName', this.image.class);
        exportCanvas.toBlob(async (blob) => {
          const file= new File([blob], snapshotName, { type: 'image/jpeg' });
          formData.append('files[]', file);
          let uploadData = await Cytomine.instance.api.post('/sliceSnapshot.json', formData);
          await this.webhookSnapshot(snapshotName,exportCanvas,uploadData,location);
        }, 'image/jpeg');
        this.$notify({type: 'success', text: this.$t(`Success get snapshot ${snapshotName}`)});
      }
      catch (error){
        this.$notify({type: 'error', text: this.$t(`error: ${error}`)});
      }
    },
    async webhookSnapshot(imageName,canvas,uploadData,location){
      let webhookUrl = this.WebhookConfig.value;
      if(webhookUrl.length===0){
        return;
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
            id: uploadData.data.id,
            url: this.host + uploadData.data.url,
            previewURL: this.host + `/#/project/${this.project.id}/image/${this.image.id}/snapshot/${location}`,
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
    shortkeyHandler(key) {
      switch(key) {
        case 'tool-finish-line':
          this.$refs.olDrawInteraction.$interaction.finishDrawing();
          return;
        case 'tool-undo':
          if(this.activeTool === 'line' && this.nowCoordinates.length > 0){
            this.$refs.olDrawInteraction.$interaction.removeLastPoint();
            this.updateUndoTime(1);
            if(this.nowCoordinates.length === 1){
              this.$refs.olDrawInteraction.$interaction.removeLastPoint();
              this.DrawingLines = false;
              this.updateDrawing(false);
            }

            return;
          }
      }
    },
    async endDraw(drawnFeature) {
      for (const layer of this.activeLayers) {
        const idx = this.activeLayers.indexOf(layer);
        let location = this.getWktLocation(drawnFeature).toString();
        if(this.activeTool === 'arrow'){
          location = this.addArrow(location);
        }

        let annot = new Annotation({
          location: location,
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
          if(idx === this.nbActiveLayers - 1 && this.activeTool !== 'arrow') {
            this.$eventBus.$emit('selectAnnotation', {index: this.index, annot});
          }
          this.$store.commit(this.imageModule + 'addAction', {annot, type: Action.CREATE});
        }
        catch(err) {
          console.log(err);
          this.$notify({type: 'error', text: this.$t('notif-error-annotation-creation')});
        }
      }
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
    addArrow(location){
      let locationArray = location.replace('LINESTRING(', '').replace(')', '').split(',').map(function(point){
        return point.trim().split(' ').map(Number);
      });

      let dx = locationArray[1][0] - locationArray[0][0];
      let dy = locationArray[1][1] - locationArray[0][1];

      let frac = 0.1; // control arrow size
      let distant = 0.4;
      let arrowLength = 0.8;
      let arrow1 = [locationArray[1][0] - frac * (dx * arrowLength - dy * distant), locationArray[1][1] - frac * (dy * arrowLength + dx * distant)];
      let arrow2 = [locationArray[1][0] - frac * (dx * arrowLength + dy * distant), locationArray[1][1] - frac * (dy * arrowLength - dx * distant)];
      let arrowMid = [((arrow1[0] + arrow2[0]) / 2 + locationArray[1][0])/2,((arrow1[1] + arrow2[1]) / 2 + locationArray[1][1])/2];
      return 'LINESTRING('
        + locationArray[0].join(' ') + ', '
        + locationArray[1].join(' ') + ', '
        + arrow1.join(' ') + ', '
        + arrowMid.join(' ') + ', '
        + arrow2.join(' ') + ', '
        + locationArray[1].join(' ')
        + ')';
    },
    getWktLocation(feature) {
      // transform circle to circular polygon
      let geometry = feature.getGeometry();
      if (geometry.getType() === 'Circle') {
        feature.setGeometry(polygonFromCircle(geometry));
      }
      return this.format.writeFeature(feature);
    },
  },

  mounted() {
    this.$eventBus.$on('shortkeyEvent', this.shortkeyHandler);
  },
  beforeDestroy() {
    this.$eventBus.$off('shortkeyEvent', this.shortkeyHandler);
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
