/*
* Copyright (c) 2009-2022. Authors: see NOTICE file.
*
* Licensed under the Apache License, Version 2.0 (the "License");
* you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
*
*      http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS,
* WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
* See the License for the specific language governing permissions and
* limitations under the License.
*/
import Vue from 'vue';


export default {
  state() {
    return {
      showMeasurements: {},
      annotArray: {},
    };
  },
  mutations: {
    addAnnot(state,annot){
      if(['rectangle', 'circle', 'line'].includes(annot.geometry)){
        Vue.set(state.showMeasurements, annot.id, annot);
      }
    },
    removeAnnot(state, annot) {
      if (state.showMeasurements[annot.id]){
        delete state.showMeasurements[annot.id];
        state.showMeasurements = {...state.showMeasurements};
      }
    },
    updateAnnot(state, annotArray){
      state.annotArray = annotArray.filter(annot => {
        return ['rectangle', 'circle', 'line'].includes(annot.geometry);
      });
    },
    showAllMeasurements(state){
      for (let annot of state.annotArray) {
        if(['rectangle', 'circle', 'line'].includes(annot.geometry)){
          if(!Object.keys(state.showMeasurements).includes(annot.id)){
            Vue.set(state.showMeasurements, annot.id, annot);
          }
        }
      }
    },
    hideAllMeasurements(state) {
      state.showMeasurements = {};
    },

  },
  getters: {
    showMeasurements: state => state.showMeasurements,
    isAllShow: state => {
      if (Object.keys(state.showMeasurements).length === 0 && state.annotArray.length === 0) return false;
      return Object.keys(state.showMeasurements).length === state.annotArray.length;
    }
  },

};
