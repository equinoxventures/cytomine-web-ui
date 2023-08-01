import OverviewMap from 'ol/control/OverviewMap';

class CustomOverviewMap extends OverviewMap {
  validateExtent_() {
    this.updateBox_();
  }
}


export default CustomOverviewMap;
