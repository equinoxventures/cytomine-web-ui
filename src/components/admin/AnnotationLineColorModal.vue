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
  <form @submit.prevent="save()">
    <cytomine-modal-card :title="$t('Select annotation color')" class="term-modal">

      <sketch-picker v-model="color" :presetColors="presetColors" />

      <template #footer>
        <button class="button" type="button" @click="$parent.close()">
          {{$t('button-cancel')}}
        </button>
        <button class="button is-link" @click="$parent.close() ">
          {{$t('button-save')}}
        </button>
      </template>
    </cytomine-modal-card>
  </form>
</template>

<script>
import {Sketch} from 'vue-color';
import CytomineModalCard from '@/components/utils/CytomineModalCard';

export default {
  name: 'annotation-line-color-modal',
  props: {
    annotationLineColor: {
      type: Object,
      required: true
    }
  },
  components: {
    'sketch-picker': Sketch,
    CytomineModalCard
  },
  data() {
    return {
      color: null,
    };
  },
  computed: {
    presetColors() {
      return [
        '#F44E3B',
        '#FB9E00',
        '#FCDC00',
        '#68BC00',
        '#16A5A5',
        '#0099FF',
        '#7B10D8',
        '#F06292',
        '#000',
        '#777',
        '#FFF'
      ];
    }
  },
  methods: {
    randomColor() {
      return '#' + (Math.random().toString(16) + '0000000').slice(2, 8);
    },
    async save() {
      this.annotationLineColor.value = this.color.hex;
      await this.annotationLineColor.save();
      // this.$emit('color-changed', this.color.hex);
    },
  },
  async created() {
    this.color = {hex: this.annotationLineColor.value ? this.annotationLineColor.value : this.randomColor()};
  }
};
</script>

