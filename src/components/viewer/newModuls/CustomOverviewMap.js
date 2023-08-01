import OverviewMap from 'ol/control/OverviewMap';

class CustomOverviewMap extends OverviewMap {
  constructor(options) {
    super(options);
    this.options = options;

  }
  validateExtent_() {
    this.updateBox_();
    var ovmap = this.ovmap_;
    var ovview = ovmap.getView();
    var imageSize = this.options.imageSize;
    var imageCenter = [imageSize[0]/2,imageSize[1]/2];
    ovview.setCenter(imageCenter);

  }
}


export default CustomOverviewMap;
