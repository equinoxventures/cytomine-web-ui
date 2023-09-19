import MouseWheelZoom, {Mode} from 'ol/interaction/MouseWheelZoom';
import EventType from 'ol/events/EventType';
import {DEVICE_PIXEL_RATIO, FIREFOX, SAFARI} from 'ol/has';
import ViewHint from 'ol/ViewHint';
import {easeOut} from 'ol/easing';

class CustomMouseWheelZoom extends MouseWheelZoom {
  handleEvent(mapBrowserEvent){
    if (!this.condition_(mapBrowserEvent)) {
      return true;
    }
    var type = mapBrowserEvent.type;
    if (type !== EventType.WHEEL && type !== EventType.MOUSEWHEEL) {
      return true;
    }

    mapBrowserEvent.preventDefault();

    var map = mapBrowserEvent.map;
    var wheelEvent = /** @type {WheelEvent} */ (mapBrowserEvent.originalEvent);

    if (this.useAnchor_) {
      this.lastAnchor_ = mapBrowserEvent.coordinate;
    }

    // Delta normalisation inspired by
    // https://github.com/mapbox/mapbox-gl-js/blob/001c7b9/js/ui/handler/scroll_zoom.js
    var delta;
    if (mapBrowserEvent.type == EventType.WHEEL) {
      delta = wheelEvent.deltaY;
      if(Math.abs(delta)>40){
        delta = delta/10;
      }
      if (FIREFOX &&
        wheelEvent.deltaMode === WheelEvent.DOM_DELTA_PIXEL) {
        delta /= DEVICE_PIXEL_RATIO;
      }
      if (wheelEvent.deltaMode === WheelEvent.DOM_DELTA_LINE) {
        delta *= 40;
      }
    }
    else if (mapBrowserEvent.type == EventType.MOUSEWHEEL) {
      delta = -wheelEvent.wheelDeltaY;
      if (SAFARI) {
        delta /= 3;
      }
    }



    if (delta === 0) {
      return false;
    }

    var now = Date.now();

    if (this.startTime_ === undefined) {
      this.startTime_ = now;
    }

    if (!this.mode_ || now - this.startTime_ > this.trackpadEventGap_) {
      this.mode_ = Math.abs(delta) < 15 ?
        Mode.TRACKPAD :
        Mode.WHEEL;
    }

    if (this.mode_ === Mode.TRACKPAD) {
      var view = map.getView();
      if (this.trackpadTimeoutId_) {
        clearTimeout(this.trackpadTimeoutId_);
      }
      else {
        view.setHint(ViewHint.INTERACTING, 1);
      }
      this.trackpadTimeoutId_ = setTimeout(this.decrementInteractingHint_.bind(this), this.trackpadEventGap_);
      var resolution = view.getResolution() * Math.pow(2, delta / this.trackpadDeltaPerZoom_);
      var minResolution = view.getMinResolution();
      var maxResolution = view.getMaxResolution();
      var rebound = 0;
      if (resolution < minResolution) {
        resolution = Math.max(resolution, minResolution / this.trackpadZoomBuffer_);
        rebound = 1;
      }
      else if (resolution > maxResolution) {
        resolution = Math.min(resolution, maxResolution * this.trackpadZoomBuffer_);
        rebound = -1;
      }
      if (this.lastAnchor_) {
        var center = view.calculateCenterZoom(resolution, this.lastAnchor_);
        view.setCenter(view.constrainCenter(center));
      }
      view.setResolution(resolution);

      if (rebound === 0 && this.constrainResolution_) {
        view.animate({
          resolution: view.constrainResolution(resolution, delta > 0 ? -1 : 1),
          easing: easeOut,
          anchor: this.lastAnchor_,
          duration: this.duration_
        });
      }

      if (rebound > 0) {
        view.animate({
          resolution: minResolution,
          easing: easeOut,
          anchor: this.lastAnchor_,
          duration: 500
        });
      }
      else if (rebound < 0) {
        view.animate({
          resolution: maxResolution,
          easing: easeOut,
          anchor: this.lastAnchor_,
          duration: 500
        });
      }
      this.startTime_ = now;
      return false;
    }

    this.delta_ += delta;

    var timeLeft = Math.max(this.timeout_ - (now - this.startTime_), 0);

    clearTimeout(this.timeoutId_);
    this.timeoutId_ = setTimeout(this.handleWheelZoom_.bind(this, map), timeLeft);

    return false;
  }
}

export default CustomMouseWheelZoom;
