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
<div>
  <div class="box">
    <h2>{{$t('welcome-message')}}</h2>
    <cytomine-quill-editor v-model="welcomeConfig.value" />
    <p class="has-text-right">
      <button class="button is-link" @click="save">{{$t('button-save')}}</button>
    </p>
  </div>
  <div class="box">
    <h2>{{'webhook'}}</h2>
    <h3>
      {{'Snapshot Webhook URL:'}}
      <input type="text" v-model="WebhookConfig.value" class="url-input">
      <button class="button is-new-link" @click="saveUrl">{{$t('button-save')}}</button>
    </h3>
  </div>
</div>
</template>


<script>
import CytomineQuillEditor from '@/components/form/CytomineQuillEditor';
import {Configuration} from 'cytomine-client-c';
import constants from '@/utils/constants.js';

export default {
  name: 'admin-configuration',
  components: {CytomineQuillEditor},
  data() {
    return {
      welcomeConfig: new Configuration({key: constants.CONFIG_KEY_WELCOME, value: '', readingRole: 'all'}),
      WebhookConfig: new Configuration({key: constants.CONFIG_KEY_WEBHOOK, value: '', readingRole: 'all'})
    };
  },
  methods: {
    async save() {
      try {
        if(!this.welcomeConfig.value) {
          await this.welcomeConfig.delete();
        }
        else {
          await this.welcomeConfig.save();
        }
        this.$notify({type: 'success', text: this.$t('notif-success-welcome-message-update')});
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('notif-error-welcome-message-update')});
      }
    },
    async saveUrl() {
      try {
        if(!this.WebhookConfig.value) {
          await this.WebhookConfig.delete();
        }
        else {
          await this.WebhookConfig.save();
        }
        this.$notify({type: 'success', text: this.$t('Webhook URL message successfully updated\n')});
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: this.$t('Failed to update the Webhook URL message')});
      }
    }
  },
  async created() {
    try {
      await this.welcomeConfig.fetch();
    }
    catch(error) {
      // no welcome message currently set
    }
    try {
      await this.WebhookConfig.fetch();
    }
    catch(error) {
      // no webhook message currently set
    }
  }
};
</script>

<style scoped>
>>> .cytomine-quill-editor {
  min-height: 25em !important;
  max-height: 25em !important;
}

.button.is-link {
  margin-top: 1em;
}
.button.is-new-link {
  @extend .button.is-link;
  background-color: #3273dc;
  border-color: transparent;
  color: #fff;
  float: right;
}


.url-input {
  margin-left: 1em;
  flex: 1;
  width: 87%;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}

</style>
