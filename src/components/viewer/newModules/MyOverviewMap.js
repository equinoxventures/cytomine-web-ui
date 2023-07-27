import OverviewMap from 'ol/control/OverviewMap';

class CustomOverviewMap extends OverviewMap {
  constructor(options = {}) {
    super(options);
    // 你可以在这里添加你自己的构造器逻辑
  }

  // 重写你需要修改的方法
  // setMap(map) {
  //   // 你的自定义逻辑
  // }

  // 你也可以添加自己的方法
  myOwnMethod() {
    // 自定义的逻辑
  }
}
export default CustomOverviewMap;
