import OverviewMap from 'ol/control/OverviewMap';
import {getBottomLeft, getTopRight} from 'ol/extent';

class CustomOverviewMap extends OverviewMap {
  constructor(options) {
    super(options);
    this.options = options;

  }
  validateExtent_() {

  }
  updateBox_(){
    var map = this.getMap();
    var ovmap = this.ovmap_;

    if (!map.isRendered() || !ovmap.isRendered()) {
      return;
    }

    var mapSize = /** @type {import("../size.js").Size} */ (map.getSize());

    var view = map.getView();

    var ovview = ovmap.getView();

    var rotation = view.getRotation();

    var overlay = this.boxOverlay_;
    var box = this.boxOverlay_.getElement();

    var extent = view.calculateExtent(mapSize);
    var ovresolution = ovview.getResolution();
    var bottomLeft = getBottomLeft(extent);
    var topRight = getTopRight(extent);
    // set position using bottom left coordinates
    var rotateBottomLeft = this.calculateCoordinateRotate_(rotation, bottomLeft);

    // // try reset box location
    // let ovmapSize = this.ovmap_.getSize();
    // let ovextent = ovview.calculateExtent(ovmapSize);
    // let ratioX = (ovextent[2] - ovextent[0])/this.options.imageSize[0];
    // let ratioY = (ovextent[3] - ovextent[1])/this.options.imageSize[1];
    // rotateBottomLeft = [rotateBottomLeft[0] / ratioX,rotateBottomLeft[1] / ratioY];


    overlay.setPosition(rotateBottomLeft);

    // set box size calculated from map extent size and overview map resolution
    if (box) {
      box.style.width = Math.abs((bottomLeft[0] - topRight[0]) / ovresolution) + 'px';
      box.style.height = Math.abs((topRight[1] - bottomLeft[1]) / ovresolution) + 'px';
    }
  }
}


export default CustomOverviewMap;
