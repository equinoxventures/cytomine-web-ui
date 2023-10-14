

<template>
  <div>

    <vl-overlay v-show="annotGeometry === 'circle'" :position="annotCenter">
      <div class="overlay">
        <div class="draw-content">
          <div class="line-text">{{ radiusShowLength }}</div>
          <div class="dashed-line" :style="{width: (radiusLength/image.magnification*magnification).toFixed(2) + 'px' }"></div>
        </div>
      </div>
    </vl-overlay>

    <!-- show rectangular length -->
    <vl-overlay v-show="annotGeometry === 'rectangle'" :position="rectangularLengthPosition">
      <div class="overlay">
        <div class="draw-content">
          <div class="line-text ">{{ rectangularShowLength }}</div>
          <div class="dashed-line" :style="{ width: rectangularLengthPixel + 'px' }"></div>
        </div>
      </div>
    </vl-overlay>
    <vl-overlay v-show="annotGeometry === 'rectangle'" :position="rectangularWidthPosition">
      <div class="overlay">
        <div class="draw-content">
          <div class="rectangular-width-line-text" :style="{transform: `translate(-50%,${rectangularWidthPixel/4}px)`}">{{ rectangularShowWidth }}</div>
          <div class="rectangular-width-dashed-line" :style="{ height: rectangularWidthPixel + 'px' }"></div>
        </div>
      </div>
    </vl-overlay>


    <div v-show="annotGeometry === 'line'">
      <template v-for="(item, index) in lineItems" >
        <vl-overlay :key="index" :position="item.position">
          <div class="overlay">
            <div class="draw-content">
              <div class="line-text">{{ item.lineShowLength }}</div>
            </div>
          </div>
        </vl-overlay>
      </template>
    </div>
  </div>
</template>

<script>


import WKT from 'ol/format/WKT';

export default {
  name: 'show-dimension',
  props: {
    image: Object,
    annotation: Object,
    magnification: Number,
    MillimeterConfig: Object,
  },
  components: {

  },
  data() {
    return {
    };
  },
  computed: {
    annotLocation() {
      let format = new WKT();
      return format.readGeometry(this.annotation.location);
    },
    annotCoordinates() {
      return this.annotLocation.getType() === 'Polygon' ? this.annotLocation.getCoordinates()[0] : this.annotLocation.getCoordinates();
    },
    annotGeometry() {
      return this.annotation.geometry;
    },
    radiusLength() {
      if (this.annotGeometry !== 'circle') return 0;
      return Math.sqrt(
        Math.pow(this.annotCoordinates[0][0] - this.annotation.centroid.x, 2) +
        Math.pow(this.annotCoordinates[0][1] - this.annotation.centroid.y, 2)
      ).toFixed(4);
    },
    annotCenter() {
      if (this.annotGeometry !== 'circle') return 0;
      return [this.annotation.centroid.x + this.radiusLength / 2, this.annotation.centroid.y];
    },
    radiusShowLength() {
      if (this.annotGeometry !== 'circle') return 0;
      return this.computeShowLength(this.radiusLength);
    },
    rectangularLength() {
      if (this.annotGeometry !== 'rectangle') return 0;
      return Math.abs(this.annotCoordinates[0][0] - this.annotCoordinates[1][0]);
    },
    rectangularWidth() {
      if (this.annotGeometry !== 'rectangle') return 0;
      return Math.abs(this.annotCoordinates[0][1] - this.annotCoordinates[2][1]);
    },
    rectangularShowLength() {
      if (this.annotGeometry !== 'rectangle') return 0;
      return this.computeShowLength(this.rectangularLength);
    },
    rectangularShowWidth() {
      if (this.annotGeometry !== 'rectangle') return 0;
      return this.computeShowLength(this.rectangularWidth);
    },
    rectangularLengthPosition() {
      return this.calculateRectanglePosition(this.rectangularLength,2, 4);
    },

    rectangularWidthPosition() {
      return this.calculateRectanglePosition(this.rectangularWidth,4, 2);
    },
    rectangularLengthPixel() {
      if (this.annotGeometry !== 'rectangle') return 0;
      return (this.rectangularLength/this.image.magnification*this.magnification).toFixed(4);
    },
    rectangularWidthPixel() {
      if (this.annotGeometry !== 'rectangle') return 0;
      return (this.rectangularWidth/this.image.magnification*this.magnification).toFixed(4);
    },
    lineItems() {
      if (this.annotGeometry !== 'line') return [];
      const items = [];
      for (let i = 0; i < this.annotCoordinates.length - 1; i++) {
        const deltaX = this.annotCoordinates[i+1][0] - this.annotCoordinates[i][0];
        const deltaY = this.annotCoordinates[i+1][1] - this.annotCoordinates[i][1];
        items.push({
          position: [(this.annotCoordinates[i][0] + this.annotCoordinates[i+1][0])/2, (this.annotCoordinates[i][1] + this.annotCoordinates[i+1][1])/2],
          lineShowLength: this.computeShowLength(Math.sqrt(deltaX * deltaX + deltaY * deltaY).toFixed(4)),
        });
      }
      return items;
    },
  },
  methods: {
    calculateRectanglePosition(length,lengthDivisor, widthDivisor) {
      if (this.annotGeometry !== 'rectangle') return 0;

      if ( this.annotCoordinates[0][0] < this.annotCoordinates[1][0]){
        if (this.annotCoordinates[0][1] > this.annotCoordinates[2][1]){
          return [this.annotCoordinates[0][0] + length / lengthDivisor, this.annotCoordinates[0][1] - this.rectangularWidth / widthDivisor];
        }
        else {
          return [this.annotCoordinates[0][0] + length / lengthDivisor, this.annotCoordinates[0][1] + this.rectangularWidth / widthDivisor];
        }
      }
      else {
        if (this.annotCoordinates[0][1] > this.annotCoordinates[2][1]){
          return [this.annotCoordinates[0][0] - length / lengthDivisor, this.annotCoordinates[0][1] - this.rectangularWidth / widthDivisor];
        }
        else {
          return [this.annotCoordinates[0][0] - length / lengthDivisor, this.annotCoordinates[0][1] + this.rectangularWidth / widthDivisor];
        }
      }
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
  },
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
</style>
