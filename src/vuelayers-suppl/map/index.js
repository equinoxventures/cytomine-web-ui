import { pick } from 'vuelayers/lib/util/minilo';
import View from './view.vue';

function plugin (Vue, options = {}) {
  if (plugin.installed) {
    return;
  }
  plugin.installed = true;

  options = pick(options, 'dataProjection');
  Object.assign(View, options);

  Vue.component(View.name, View);
}

export default plugin;

export {
  View,
  plugin as install,
};
