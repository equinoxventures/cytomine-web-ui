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
      <input type="text" v-model="WebhookConfigUrl.value" class="url-input">
      <button class="button is-new-link" @click="saveUrl">{{$t('button-save')}}</button>
    </h3>
    <h4 style="height: 10px;"></h4>
    <h3>
      {{'Snapshot Webhook Username:'}}
      <input type="text" v-model="WebhookConfigUsername.value" class="account-input">
      <span class="spaced">{{'Snapshot Webhook Password:'}}</span>
      <input :type="passwordFieldType" v-model="WebhookConfigPassword.value" class="account-input">
      <button type="button" @click="togglePasswordField">
        <i v-if="passwordFieldType === 'password'" class="fa fa-eye"></i>
        <i v-else class="fa fa-eye-slash"></i>
      </button>
      <button class="button is-new-link" @click="saveAccount">{{$t('button-save')}}</button>
    </h3>
  </div>
  <div class="box">
    <h2>{{'Aesthetics'}}</h2>
    <h3>
      {{'Default is to transition to µm when less than 1mm:'}}
      <button
        :class="['button millimeter', MillimeterConfig.value ? 'is-success' : 'is-danger']"
        @click="ShowMillimeter"
      >
        {{ MillimeterConfig.value ? $t('enable') : $t('disable') }}      </button>
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
      WebhookConfigUrl: new Configuration({key: constants.CONFIG_KEY_WEBHOOK_URL, value: '', readingRole: 'all'}),
      WebhookConfigUsername: new Configuration({key: constants.CONFIG_KEY_WEBHOOK_USERNAME, value: '', readingRole: 'all'}),
      WebhookConfigPassword: new Configuration({key: constants.CONFIG_KEY_WEBHOOK_PASSWORD, value: '', readingRole: 'all'}),
      MillimeterConfig: new Configuration({key: constants.CONFIG_KEY_MILLIMETER, value: '', readingRole: 'all'}),
      passwordFieldType: 'password',
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
        if(!this.WebhookConfigUrl.value) {
          await this.WebhookConfigUrl.delete();
        }
        else {
          await this.WebhookConfigUrl.save();
        }
        this.$notify({type: 'success', text: 'Webhook URL message successfully updated\n'});
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: 'Failed to update the Webhook URL message'});
      }
    },
    async saveAccount() {
      try {
        if(!this.WebhookConfigUsername.value && !this.WebhookConfigPassword.value) {
          await this.WebhookConfigUsername.delete();
          await this.WebhookConfigPassword.delete();
        }
        else {
          await this.WebhookConfigUsername.save();
          await this.WebhookConfigPassword.save();
        }
        this.$notify({type: 'success', text: 'Webhook account message successfully updated\n'});
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: 'Failed to update the Webhook account message'});
      }
    },
    async ShowMillimeter() {
      try {
        if(this.MillimeterConfig.value) {
          this.MillimeterConfig.value = '';
          await this.MillimeterConfig.delete();
        }
        else {
          this.MillimeterConfig.value = 'true';
          await this.MillimeterConfig.save();
        }
        this.$notify({type: 'success', text: 'Millimeter config successfully updated'});
      }
      catch(error) {
        console.log(error);
        this.$notify({type: 'error', text: 'Failed to update the millimeter config message'});
      }
    },
    togglePasswordField() {
      this.passwordFieldType = this.passwordFieldType === 'password' ? 'text' : 'password';
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
      await this.WebhookConfigUrl.fetch();
    }
    catch(error) {
      // no webhook message currently set
    }
    try {
      await this.WebhookConfigUsername.fetch();
      await this.WebhookConfigPassword.fetch();
    }
    catch(error) {
      //no set
    }
    try {
      await this.MillimeterConfig.fetch();
    }
    catch(error) {
      // no set
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
.button.millimeter{
  @extend .button;
  margin-left: 1em;
  margin-top: -2.5px;
}

.url-input {
  margin-left: 1em;
  flex: 1;
  width: 85%;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.account-input {
  margin-left: 1em;
  flex: 1;
  width: 30%;
  padding: 0.5em;
  border: 1px solid #ccc;
  border-radius: 4px;
}
.spaced {
  margin-left: 10em;
}
</style>
