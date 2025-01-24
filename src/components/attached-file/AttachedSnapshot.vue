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
<div class="snapshot-files-wrapper">
  <template v-if="!loading">
    <em v-if="error">{{$t('error-attached-snapshot')}}</em>
    <template v-else-if="snapshotFiles.length > 0">
      <span class="file-item" v-for="(file, index) in snapshotFiles" :key="file.id">
        <a @click="openView(file,index) ">{{file.filename}}</a>
        <button v-if="canEdit" class="delete is-small" @click="confirmDeletion(file, index)"></button>
        <template v-if="index < snapshotFiles.length - 1">,</template>
      </span>
    </template>
    <em v-else>{{$t('no-attached-snapshot')}} </em>
    <button v-if="canEdit" class="button is-small" @click="displayModal()">{{$t('button-add')}}</button>
  </template>
  <snapshot-metadata-modal
    :active.sync="isMetadataModalActive"
    :image="object"
    :metadata-error="metadataError"
    :properties="properties"
    :file="file"
    :index="index"
    :snapshotFiles="snapshotFiles"
    :project="this.project"
  />
</div>
</template>

<script>
import {Cytomine,SnapshotFileCollection} from 'cytomine-client-c';
import AttachedSnapshotModal from './AttachedSnapshotModal.vue';
import SnapshotMetadataModal from '@/components/image/SnapshotMetadataModal.vue';


export default {
  name: 'attached-snapshot',
  components: {SnapshotMetadataModal},
  props: {
    object: {type: Object},
    canEdit: {type: Boolean, default: true},
    metadataError: Boolean,
    properties: Object,
    project: Object,
  },
  data() {
    return {
      loading: true,
      error: false,
      snapshotFiles: [],
      isMetadataModalActive: false,
      file: null,
      index: null,
    };
  },
  computed: {
    host() {
      return Cytomine.instance.host;
    }
  },
  methods: {
    openView(file,index){
      this.isMetadataModalActive=true;
      this.file = file;
      this.index = index;
    },
    displayModal() {
      // required to use programmatic modal because the description is sometimes displayed in elements with a
      // CSS transform (e.g. popover) that conflict with the fixed position of the modal
      // (http://meyerweb.com/eric/thoughts/2011/09/12/un-fixing-fixed-elements-with-css-transforms/)

      this.$buefy.modal.open({
        parent: this,
        component: AttachedSnapshotModal,
        props: {object: this.object},
        hasModalCard: true,
        events: {'addSnapshotFile': this.addSnapshotFile}
      });
    },
    addSnapshotFile(snapshotFiles) {
      this.snapshotFiles.push(snapshotFiles);
    },
    confirmDeletion(snapshotFile, idx) {
      this.$buefy.dialog.confirm({
        title: this.$t('confirm-deletion'),
        message: this.$t('confirm-deletion-attached-snapshot', {filename: snapshotFile.filename}),
        type: 'is-danger',
        confirmText: this.$t('button-confirm'),
        cancelText: this.$t('button-cancel'),
        onConfirm: () => this.deleteAttachedFile(snapshotFile, idx)
      });
    },
    async deleteAttachedFile(snapshotFile, idx) {
      try {
        await snapshotFile.delete();
        this.snapshotFiles.splice(idx, 1);
        this.$notify({
          type: 'success',
          text: this.$t('notif-success-attached-snapshot-deletion', {filename: snapshotFile.filename})
        });
      }
      catch(error) {
        console.log(error);
        this.$notify({
          type: 'error',
          text: this.$t('notif-error-attached-snapshot-deletion', {filename: snapshotFile.filename})
        });
      }
    }
  },
  async created() {
    try {
      this.snapshotFiles = (await SnapshotFileCollection.fetchAll({object: this.object})).array;
    }
    catch(error) {
      console.log(error);
      this.error = true;
    }
    this.loading = false;
  }

};
</script>

<style scoped>
.snapshot-files-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.file-item {
  margin-right: 0.5em;
}

.file-item .delete {
  margin-left: 0.4rem;
  margin-right: 0.1rem;
  position: relative;
  top: 2px;
}

.button {
  margin-left: 0.5em;
}
</style>
