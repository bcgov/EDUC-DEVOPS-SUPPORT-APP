<template>
  <v-container class="pt-15">
    <v-row>
      <div class="text-sm-h5 ml-3">Saga Details for Saga ID: {{ id }}</div>
        <v-btn
          icon
          small
          color="primary lighten-2"
          @click="copyId"
        >
          <v-icon>mdi-content-copy</v-icon>
        </v-btn>
    </v-row>
    <v-timeline
      class="my-10"
      align-top
      dense
    >
      <v-timeline-item
        v-for="(item, i) in sagaEventObjects"
        :key="i"
        :color="iconColor(i === sagaEventObjects.length-1)"
      >
        <v-card
          color="secondary"
        >
          <v-card-title class="secondary text-h6 white--text">
            {{ getEventState(item) }}
          </v-card-title>
          <v-card-text :class="$vuetify.theme.dark?'black':'white'">
            <v-col>
              <v-row>
                <v-col cols="4">Event Outcome:</v-col>
                <v-col cols="8"><strong>{{ item.sagaEventOutcome || item.status }}</strong></v-col>
              </v-row>
              <v-row>
                <v-col cols="4">Update User:</v-col>
                <v-col><strong>{{ item.updateUser }}</strong></v-col>
              </v-row>
              <v-row>
                <v-col cols="4">Update Date:</v-col>
                <v-col><strong>{{ item.updateDate }}</strong></v-col>
              </v-row>
              <v-row>
                <v-col cols="4">Event Response:</v-col>
                <v-col><strong>{{ item.sagaEventResponse || item.payload }}</strong></v-col>
              </v-row>
            </v-col>
            <v-btn
              v-if="i === sagaEventObjects.length-1 && !isEndState"
              @click="editModal=true"
            >
              Edit Payload
            </v-btn>
          </v-card-text>
        </v-card>
      </v-timeline-item>
    </v-timeline>
    <v-dialog
      v-model="editModal"
    >
      <v-card>
        <v-card-title class="secondary text-h6 white--text">
          Modify Saga Payload
        </v-card-title>
        <v-card-text class="pt-4 pb-0">
          <v-textarea
            v-model="modifiedSagaPayload"
            outlined
            ref="requestInfoDialogTextArea">
          </v-textarea>
        </v-card-text>
      
        <v-divider></v-divider>
      
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn
            outlined
            @click="rerunSaga"
          >
            Rerun Saga
          </v-btn>
          <v-btn
            @click="editModal = false"
          >
            Cancel
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>
<script>
  import {SAGA_STATUS_ENUM} from "../../constants/SagaStatusEnum";
  import {BACKEND_ROUTES} from "../../constants/routes";
  import {isValidGuid} from "../../common/validation";
  import axios from 'axios';
  import alertMixin from "../../mixins/alertMixin";

  export default {
    name: "SagaDetails",
    props: {
      sagaId: {
        type: String,
        required: true
      },
      sagaType: {
        type: String,
        required: true
      }
    },
    mixins: [alertMixin],
    data: () => ({
      dialog: false,
      editModal: false,
      id: null,
      modifiedSagaPayload: null,
      sagaObject: {},
      sagaEventObjects: [],
    }),
    mounted() {
      this.id = this.sagaId;
      if(this.id) {
        this.getEvents();
      }
    },
    computed: {
      isEndState() {
        return this.sagaObject?.status === SAGA_STATUS_ENUM.COMPLETED || this.sagaObject?.status === SAGA_STATUS_ENUM.FORCE_STOPPED;
      }
    },
    methods: {
      copyId () {
        navigator.clipboard.writeText(this.id);
      },
      getEventState(sagaEvent) {
        return sagaEvent?.sagaEventState?.replaceAll('_', ' ') || sagaEvent?.status.replaceAll('_', ' ');
      },
      getEvents() {
        axios.get(BACKEND_ROUTES.SAGAS.BASE + '/' + this.id, {params: {sagaType: this.sagaType}})
          .then(response => {
            let tempSagaEventObjects = response.data.eventData.sort((a,b) => a.updateDate > b.updateDate ? 1 : b.updateDate > a.updateDate ? -1 : 0);
            this.sagaObject = response.data.sagaData;
            this.sagaEventObjects = tempSagaEventObjects;
            this.modifiedSagaPayload = this.sagaObject?.payload;
          }).catch(error => {
            console.log(error);
            if (error?.response?.status === 404) {
              this.setWarningAlert('Could not find given saga id :: ' + this.id)
            } else {
              this.setFailureAlert('An error occurred while attempting to get saga events. Please try again later.')
            }
        });
      },
      iconColor(isLastItem) {
        if(!isLastItem) {
          return 'success';
        } else {
          if (this.isEndState) {
            return 'success';
          } else if (this.sagaObject?.retryCount) {
            return 'error';
          } else {
            return 'warning';
          }
        }
      },
      isValidGuid,
      rerunSaga() {
        this.sagaObject.payload = this.modifiedSagaPayload;
        axios.put(`${BACKEND_ROUTES.SAGAS.BASE}/${this.id}`, {sagaObject: this.sagaObject, sagaType: this.sagaType})
        .then(() => {
          this.setSuccessAlert('The saga payload has been successfully updated. Refresh the page to watch for updates.');
          this.getEvents();
        })
        .catch(e => {
          console.log(e);
          if (e?.response?.status === 409) {
            this.setFailureAlert('Failed to update saga payload. It has been updated by another process. Please refresh the page to see the changes.')
          }
          this.setFailureAlert('Failed to update the saga payload. Please check the logs.')
        })
        .finally(()=>{this.editModal = false;})
      }
    }
  }
</script>

<style scoped>

</style>
