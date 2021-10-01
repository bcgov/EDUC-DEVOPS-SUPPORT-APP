<template>
  <v-container>
    <section id="dailyStats">
    <v-row class="pt-10">
      <v-col cols="12">
        <v-row>
        <div class="text-sm-h5 ml-3">Stuck Sagas</div>
        </v-row>
      </v-col>
      <v-col
        v-for="(type, key) in sagaTypes"
        v-bind:key="key"
        cols="12" md="4">
        <v-card
          class="mx-auto"
          outlined
          color="secondaryBackground"
          elevation="2"
        >
          <v-list-item three-line>
            <v-list-item-content>
              <div class="text-overline mb-4">
                {{ type.text }} Saga Api
              </div>
              <v-progress-circular
                v-if="showLoading(type.value)"
                indeterminate
              ></v-progress-circular>
              <v-list-item-title v-else class="text-h5 mb-1">
                {{ type.stuckCount }}
              </v-list-item-title>
            </v-list-item-content>
          </v-list-item>
          <v-card-actions>
            <v-btn @click="viewStuck(type.value)">View Sagas</v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
    </section>
    <section id="sagaSearch">
      <v-row class="pt-10 mb-4">
          <div class="text-sm-h5 ml-3">Search Sagas</div>
      </v-row>
      <v-row>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-select
            v-model="selectedSagaType"
            :items="sagaTypes"
            label="Saga Type"
            small-chips
            outlined></v-select>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-select
            v-model="searchCriteria.sagaName"
            :items="sagaNames"
            small-chips
            multiple
            clearable
            label="Saga Name"
            outlined></v-select>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-select
            v-model="searchCriteria.sagaState"
            :items="sagaStates"
            label="Saga State"
            small-chips
            multiple
            clearable
            outlined
            ></v-select>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-select
            v-model="searchCriteria.status"
            :items="sagaStatuses"
            label="Saga Statuses"
            small-chips
            multiple
            clearable
            outlined></v-select>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-text-field
            v-model="searchCriteria.createDate.from"
            outlined
            hint="YYYY/MM/DD"
            :rules="[(v)=>(isValidDate(v)) || !v || 'Must be valid date YYYY/MM/DD']"
            label="Create Date From"></v-text-field>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-text-field
            v-model="searchCriteria.createDate.end"
            outlined
            hint="YYYY/MM/DD"
            :rules="[(v)=>(isValidDate(v)) || !v || 'Must be valid date YYYY/MM/DD']"
            label="Create Date To"
          ></v-text-field>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-text-field
            v-model="searchCriteria.sagaId"
            outlined
            :rules="[(v)=>(isValidGuid(v)) || !v || 'Must be a valid guid']"
            label="Saga ID"></v-text-field>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-text-field
            v-model="searchCriteria.updateDate.from"
            outlined
            hint="YYYY/MM/DD"
            :rules="[(v)=>(isValidDate(v)) || !v || 'Must be valid date YYYY/MM/DD']"
            label="Update Date From"></v-text-field>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-text-field
            v-model="searchCriteria.updateDate.end"
            outlined
            hint="YYYY/MM/DD"
            :rules="[(v)=>(isValidDate(v)) || !v || 'Must be valid date YYYY/MM/DD']"
            label="Update Date To"></v-text-field>
        </v-col>
        <v-col class="py-0" md="4" sm="6" cols="12">
          <v-checkbox
            v-model="searchCriteria.retryCount"
            class="mt-0 pt-0"
            label="Has Retries"
          ></v-checkbox>
        </v-col>
        <v-spacer></v-spacer>
        <v-col class="pt-0" md="2" sm="6" cols="12">
          <v-btn
            @click="clearSearchCriteria"
            width="100%">Clear</v-btn>
        </v-col>
        <v-col class="py-0" md="2" sm="6" cols="12">
          <v-btn
            @click="search"
            :loading="searchLoading"
            width="100%">Search</v-btn>
        </v-col>
      </v-row>
      <v-row class="pb-16">
        <v-col cols="12">
          <v-card color="secondaryBackground">
            <v-data-table
              id="resultsTable"
              :headers="sagaHeaders"
              :items="searchResponse.content"
              :page.sync="pageNumber"
              :items-per-page="searchResponse.size"
              hide-default-footer
              :loading="searchLoading"
              @click:row="openSaga"
            ></v-data-table>
            <v-row
              class="py-2 pagination"
              no-gutters
              justify="end"
            >
              <v-col cols="4">
                <v-pagination
                  v-model="pageNumber"
                  color="#38598A"
                  :length="searchResponse.totalPages
                "></v-pagination>
              </v-col>
              <v-col cols="4" id="currentItemsDisplay">
                Showing {{ showingFirstNumber }} to {{ showingEndNumber }} of {{ searchResponse.totalElements || 0 }}
              </v-col>
            </v-row>
          </v-card>
        </v-col>
      </v-row>
    </section>
  </v-container>
</template>

<script>
  import {BACKEND_ROUTES} from '../../constants/routes';
  import {isValidDate, isValidGuid} from '../../common/validation';
  import alertMixin from '../../mixins/alertMixin';
  import {mapState} from 'vuex';
  import router from '../../router';
  import {DateTimeFormatterBuilder, LocalDate, ResolverStyle}  from '@js-joda/core';
  import {SAGA_STATUS_ENUM} from '../../constants/SagaStatusEnum';
  import axios from 'axios';
  import {find} from 'lodash';

  export default {
    name: 'Dashboard',
    mixins: [alertMixin],
    data: () => ({
      sagaHeaders: [
        { text: 'Saga Id', value: 'sagaId' },
        { text: 'Saga Name', value: 'sagaName' },
        { text: 'Saga State', value: 'sagaState' },
        { text: 'Status', value: 'status' },
        { text: 'Update User', value: 'updateUser' },
        { text: 'Update Date', value: 'updateDate' }
      ],
      sortParams: {
        currentSort: 'updateDate',
        currentSortAsc: false
      },
      selectedSagaType: 'penRequestBatch',
      sagaTypes: [
        {
          value:'penRequestBatch',
          text: 'Pen Request Batch',
          isLoading: false,
          stuckCount: null,
          sagaNames: [
            {
              value: 'PEN_REQUEST_BATCH_ARCHIVE_AND_RETURN_SAGA',
              text: 'ARCHIVE AND RETURN',
              states: [
                { value: 'GATHER_REPORT_DATA', text: 'GATHER REPORT DATA'},
                { value: 'GET_STUDENTS', text: 'GET STUDENTS'},
                { value: 'ARCHIVE_PEN_REQUEST_BATCH', text: 'ARCHIVE PEN REQUEST BATCH'},
                { value: 'GENERATE_PEN_REQUEST_BATCH_REPORTS', text: 'GENERATE PEN REQUEST BATCH REPORTS'},
                { value: 'SAVE_REPORTS', text: 'SAVE REPORTS'},
                { value: 'NOTIFY_PEN_REQUEST_BATCH_ARCHIVE_HAS_CONTACT', text: 'NOTIFY PEN REQUEST BATCH ARCHIVE HAS CONTACT'},
                { value: 'NOTIFY_PEN_REQUEST_BATCH_ARCHIVE_HAS_NO_SCHOOL_CONTACT', text: 'NOTIFY PEN REQUEST BATCH ARCHIVE HAS NO SCHOOL CONTACT'}
              ]
            },
            {
              value: 'PEN_REQUEST_BATCH_NEW_PEN_PROCESSING_SAGA',
              text: 'NEW PEN PROCESSING',
              states: [
                { value: 'GET_NEXT_PEN_NUMBER', text: 'GET NEXT PEN NUMBER'},
                { value: 'CREATE_STUDENT', text: 'CREATE STUDENT'},
                { value: 'ADD_POSSIBLE_MATCH', text: 'ADD POSSIBLE MATCH'},
                { value: 'UPDATE_PEN_REQUEST_BATCH_STUDENT', text: 'UPDATE PEN REQUEST BATCH STUDENT'}
              ]
            },
            {
              value: 'PEN_REQUEST_BATCH_REPOST_REPORTS_SAGA',
              text: 'REPOST REPORTS',
              states: [
                { value: 'GATHER_REPORT_DATA', text: 'GATHER REPORT DATA'},
                { value: 'GET_STUDENTS', text: 'GET STUDENTS'},
                { value: 'GENERATE_PEN_REQUEST_BATCH_REPORTS', text: 'GENERATE PEN REQUEST BATCH REPORTS'},
                { value: 'SAVE_REPORTS', text: 'SAVE_REPORTS'},
                { value: 'NOTIFY_PEN_REQUEST_BATCH_ARCHIVE_HAS_CONTACT', text: 'NOTIFY PEN REQUEST BATCH ARCHIVE HAS CONTACT'},
                { value: 'NOTIFY_PEN_REQUEST_BATCH_ARCHIVE_HAS_NO_SCHOOL_CONTACT', text: 'NOTIFY PEN REQUEST BATCH ARCHIVE HAS NO SCHOOL CONTACT'}
              ]
            },
            {
              value: 'PEN_REQUEST_BATCH_STUDENT_PROCESSING_SAGA',
              text: 'STUDENT PROCESSING',
              states: [
                { value: 'VALIDATE_STUDENT_DEMOGRAPHICS', text: 'VALIDATE STUDENT DEMOGRAPHICS'},
                { value: 'PROCESS_PEN_MATCH', text: 'PROCESS PEN MATCH'},
                { value: 'PROCESS_PEN_MATCH_RESULTS', text: 'PROCESS PEN MATCH RESULTS'}
              ]
            },
            {
              value: 'PEN_REQUEST_BATCH_USER_MATCH_PROCESSING_SAGA',
              text: 'USER MATCH PROCESSING',
              states: [
                { value: 'GET_STUDENT', text: 'GET STUDENT'},
                { value: 'UPDATE_STUDENT', text: 'UPDATE STUDENT'},
                { value: 'ADD_POSSIBLE_MATCH', text: 'ADD POSSIBLE MATCH'},
                { value: 'UPDATE_PEN_REQUEST_BATCH_STUDENT', text: 'UPDATE PEN REQUEST BATCH STUDENT'}
              ]
            },
            {
              value: 'PEN_REQUEST_BATCH_USER_UNMATCH_PROCESSING_SAGA',
              text: 'USER UNMATCH PROCESSING',
              states: [
                { value: 'DELETE_POSSIBLE_MATCH', text: 'DELETE POSSIBLE MATCH'},
                { value: 'UPDATE_PEN_REQUEST_BATCH_STUDENT', text: 'UPDATE PEN REQUEST BATCH STUDENT'}
              ]
            }
          ]
        },
        {
          value: 'studentProfile',
          text: 'Student Profile',
          isLoading: false,
          stuckCount: null,
          sagaNames: [
            {
              value: 'STUDENT_PROFILE_COMPLETE_SAGA',
              text: 'STUDENT PROFILE COMPLETE',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_PROFILE_REQUEST_DOCUMENT_METADATA', text: 'GET PROFILE REQUEST DOCUMENT METADATA'},
                { value: 'GET_STUDENT', text: 'GET STUDENT'},
                { value: 'CREATE_STUDENT', text: 'CREATE STUDENT'},
                { value: 'UPDATE_STUDENT', text: 'UPDATE STUDENT'},
                { value: 'GET_DIGITAL_ID', text: 'GET DIGITAL ID'},
                { value: 'UPDATE_DIGITAL_ID', text: 'UPDATE DIGITAL ID'},
                { value: 'GET_STUDENT_PROFILE', text: 'GET STUDENT PROFILE'},
                { value: 'UPDATE_STUDENT_PROFILE', text: 'UPDATE STUDENT PROFILE'},
                { value: 'NOTIFY_STUDENT_PROFILE_REQUEST_COMPLETE', text: 'NOTIFY STUDENT PROFILE REQUEST COMPLETE'}
              ]
            },
            {
              value: 'STUDENT_PROFILE_COMMENTS_SAGA',
              text: 'STUDENT PROFILE COMMENTS',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'ADD_STUDENT_PROFILE_COMMENT', text: 'ADD STUDENT PROFILE COMMENT'},
                { value: 'GET_STUDENT_PROFILE', text: 'GET STUDENT PROFILE'},
                { value: 'UPDATE_STUDENT_PROFILE', text: 'UPDATE STUDENT PROFILE'}
              ]
            },
            {
              value: 'STUDENT_PROFILE_REJECT_SAGA',
              text: 'STUDENT PROFILE REJECT',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_STUDENT_PROFILE', text: 'GET STUDENT PROFILE'},
                { value: 'UPDATE_STUDENT_PROFILE', text: 'UPDATE STUDENT PROFILE'},
                { value: 'NOTIFY_STUDENT_PROFILE_REQUEST_REJECT', text: 'NOTIFY STUDENT PROFILE REQUEST REJECT'}
              ]
            },
            {
              value: 'STUDENT_PROFILE_RETURN_SAGA',
              text: 'STUDENT PROFILE RETURN',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'ADD_STUDENT_PROFILE_COMMENT', text: 'ADD STUDENT PROFILE COMMENT'},
                { value: 'GET_STUDENT_PROFILE', text: 'GET STUDENT PROFILE'},
                { value: 'UPDATE_STUDENT_PROFILE', text: 'UPDATE STUDENT PROFILE'},
                { value: 'NOTIFY_STUDENT_PROFILE_REQUEST_RETURN', text: 'NOTIFY STUDENT PROFILE REQUEST RETURN'}
              ]
            },
            {
              value: 'PEN_REQUEST_COMPLETE_SAGA',
              text: 'PEN REQUEST COMPLETE',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_PEN_REQUEST_DOCUMENT_METADATA', text: 'GET PEN REQUEST DOCUMENT METADATA'},
                { value: 'GET_STUDENT', text: 'GET STUDENT'},
                { value: 'CREATE_STUDENT', text: 'CREATE STUDENT'},
                { value: 'UPDATE_STUDENT', text: 'UPDATE STUDENT'},
                { value: 'GET_DIGITAL_ID', text: 'GET DIGITAL ID'},
                { value: 'UPDATE_DIGITAL_ID', text: 'UPDATE DIGITAL ID'},
                { value: 'GET_PEN_REQUEST', text: 'GET PEN REQUEST'},
                { value: 'UPDATE_PEN_REQUEST', text: 'UPDATE PEN REQUEST'},
                { value: 'NOTIFY_STUDENT_PROFILE_REQUEST_COMPLETE', text: 'NOTIFY STUDENT PROFILE REQUEST COMPLETE'}
              ]
            },
            {
              value: 'PEN_REQUEST_COMMENTS_SAGA',
              text: 'PEN REQUEST COMMENTS',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'ADD_PEN_REQUEST_COMMENT', text: 'ADD PEN REQUEST COMMENT'},
                { value: 'GET_PEN_REQUEST', text: 'GET PEN REQUEST'},
                { value: 'UPDATE_PEN_REQUEST', text: 'UPDATE PEN REQUEST'}
              ]
            },
            {
              value: 'PEN_REQUEST_RETURN_SAGA',
              text: 'PEN REQUEST RETURN',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'ADD_PEN_REQUEST_COMMENT', text: 'ADD PEN REQUEST COMMENT'},
                { value: 'GET_PEN_REQUEST', text: 'GET PEN REQUEST'},
                { value: 'UPDATE_PEN_REQUEST', text: 'UPDATE PEN REQUEST'},
                { value: 'NOTIFY_STUDENT_PEN_REQUEST_RETURN', text: 'NOTIFY STUDENT PEN REQUEST RETURN'}
              ]
            },
            {
              value: 'PEN_REQUEST_REJECT_SAGA',
              text: 'PEN REQUEST REJECT',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_PEN_REQUEST', text: 'GET PEN REQUEST'},
                { value: 'UPDATE_PEN_REQUEST', text: 'UPDATE PEN REQUEST'},
                { value: 'NOTIFY_STUDENT_PEN_REQUEST_RETURN', text: 'NOTIFY STUDENT PEN REQUEST RETURN'}
              ]
            },
            {
              value: 'PEN_REQUEST_UNLINK_SAGA',
              text: 'PEN REQUEST UNLINK',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_DIGITAL_ID', text: 'GET DIGITAL ID'},
                { value: 'UPDATE_DIGITAL_ID', text: 'UPDATE DIGITAL ID'},
                { value: 'GET_PEN_REQUEST', text: 'GET PEN REQUEST'},
                { value: 'UPDATE_PEN_REQUEST', text: 'UPDATE PEN REQUEST'}
              ]
            }
          ]
        },
        {
          value: 'replication',
          text: 'Replication',
          isLoading: false,
          stuckCount: null,
          sagaNames: [
            {
              value: 'PEN_REPLICATION_STUDENT_UPDATE_SAGA',
              text: 'PEN REPLICATION STUDENT UPDATE',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_STUDENT', text: 'GET STUDENT'},
                { value: 'CREATE_STUDENT', text: 'CREATE STUDENT'},
                { value: 'UPDATE_STUDENT', text: 'UPDATE STUDENT'},
                { value: 'UPDATE_PEN_DEMOG', text: 'UPDATE PEN DEMOG'},
                { value: 'UPDATE_PEN_DEMOG_TRANSACTION', text: 'UPDATE PEN DEMOG TRANSACTION'}
              ]
            },
            {
              value: 'PEN_REPLICATION_STUDENT_CREATE_SAGA',
              text: 'PEN REPLICATION STUDENT CREATE',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'GET_NEXT_PEN_NUMBER', text: 'GET NEXT PEN NUMBER'},
                { value: 'CREATE_STUDENT', text: 'CREATE STUDENT'},
                { value: 'ADD_PEN_DEMOG', text: 'ADD PEN DEMOG'},
                { value: 'UPDATE_PEN_DEMOG_TRANSACTION', text: 'UPDATE PEN DEMOG TRANSACTION'}
              ]
            },
            {
              value: 'PEN_REPLICATION_POSSIBLE_MATCH_CREATE_SAGA',
              text: 'PEN REPLICATION POSSIBLE MATCH CREATE',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'ADD_POSSIBLE_MATCH', text: 'ADD POSSIBLE MATCH'},
                { value: 'CREATE_PEN_TWINS', text: 'CREATE PEN TWINS'},
                { value: 'UPDATE_PEN_TWIN_TRANSACTION', text: 'UPDATE PEN TWIN TRANSACTION'}
              ]
            },
            {
              value: 'PEN_REPLICATION_POSSIBLE_MATCH_DELETE_SAGA',
              text: 'PEN REPLICATION POSSIBLE MATCH DELETE',
              states: [
                { value: 'INITIATED', text: 'INITIATED'},
                { value: 'DELETE_POSSIBLE_MATCH', text: 'DELETE POSSIBLE MATCH'},
                { value: 'DELETE_PEN_TWINS', text: 'DELETE PEN TWINS'},
                { value: 'UPDATE_PEN_TWIN_TRANSACTION', text: 'UPDATE PEN TWIN TRANSACTION'}
              ]
            }
          ]
        }
      ],
      sagaStatuses: [
        { value: 'STARTED', text: 'STARTED'},
        { value: 'IN_PROGRESS', text: 'IN PROGRESS'},
        { value: 'COMPLETED', text: 'COMPLETED'},
        { value: 'FORCE_STOPPED', text: 'FORCE STOPPED'}
      ],
      searchCriteria: {'createDate': {}, 'updateDate': {}},
      searchLoading: false,
      searchResponse: [],
      pageNumber: 1
      
    }),
    created() {
      this.sagaTypes.forEach(x => this.getStuckStats(x.value));
    },
    watch: {
      pageNumber: {
        handler() {
          if (!this.searchLoading) {
            this.search();
          }
        }
      }
    },
    computed: {
      ...mapState('auth', ['isAuthorizedUser']),
      sagaNames() {
        let displayNames = [];
        if(!this.selectedSagaType?.length) {
          this.sagaTypes.forEach(type => displayNames = displayNames.concat(type.sagaNames));
        } else {
          this.sagaTypes.filter(x => this.selectedSagaType?.includes(x.value)).map(y => y.sagaNames).forEach(type => displayNames = displayNames.concat(type));
        }
        return displayNames.sort();
      },
      sagaStates() {
        let displayStates = [];
        if(!this.searchCriteria?.sagaName?.length) {
          this.sagaNames.forEach(name => displayStates = displayStates.concat(name.states));
        } else {
          this.sagaNames.filter(x => this.searchCriteria?.sagaName?.includes(x.value)).map(y => y.states).forEach(state => displayStates = displayStates.concat(state));
        }
        return displayStates.sort();
      },
      showingFirstNumber() {
        return ((this.pageNumber-1) * (this.searchResponse?.size || 0) + ((this.searchResponse?.numberOfElements || 0) > 0 ? 1 : 0));
      },
      showingEndNumber() {
        return ((this.pageNumber-1) * (this.searchResponse?.size || 0) + (this.searchResponse?.numberOfElements || 0));
      }
    },
    methods: {
      isValidDate,
      isValidGuid,
      getDateFormatter(pattern) {
        return (new DateTimeFormatterBuilder)
          .appendPattern(pattern)
          .toFormatter(ResolverStyle.STRICT);
      },
      clearSearchCriteria() {
        this.searchCriteria = {'createDate': {}, 'updateDate': {}};
      },
      formatDate(datetime, from='uuuuMMdd', to='uuuu/MM/dd') {
        const fromFormatter = this.getDateFormatter(from);
        const toFormatter = this.getDateFormatter(to);
        let result = datetime;
        if (datetime && datetime.length > 0) {
          try {
            const date = LocalDate.parse(datetime, fromFormatter);
            result = date.format(toFormatter);
          } catch (err) {
            console.info(`could not parse date ${datetime}: ${from} to ${to} as date provided is invalid`);
          }
        }
        return result;
      },
      getStuckStats(sagaType) {
        find(this.sagaTypes, {value: sagaType}).isLoading = true;
        let params = {
          params: {
            pageNumber: 0,
            pageSize: 1,
            searchCriteriaList: {'retryCount': 0, 'status': [SAGA_STATUS_ENUM.IN_PROGRESS, SAGA_STATUS_ENUM.STARTED]},
            sagaType: sagaType
          }
        };

        axios
          .get(BACKEND_ROUTES.SAGAS.PAGINATED, params)
          .then(response => {
            find(this.sagaTypes, {value: sagaType}).stuckCount = response.data.totalElements;
          })
          .catch(error => {
            this.setFailureAlert('An error occurred while loading saga statuses. Please try again later.');
            console.error(error.response);
          })
          .finally(() => {
            find(this.sagaTypes, {value: sagaType}).isLoading = false;
          });
      },
      openSaga(saga) {
        router.push({name: 'sagaDetails', params: {sagaId: saga.sagaId, sagaType: this.selectedSagaType}});
      },
      search() {
        this.searchLoading = true;
        this.searchResponse = [];
        let sort = {};
        sort[this.sortParams.currentSort] = this.sortParams.currentSortAsc ? 'ASC' : 'DESC';
        let params = {
          params: {
            pageNumber: this.pageNumber - 1,
            sort: sort,
            searchCriteriaList: this.searchCriteria,
            sagaType: this.selectedSagaType
          }
        };

        axios
          .get(BACKEND_ROUTES.SAGAS.PAGINATED, params)
          .then(response => {
            this.searchResponse = response.data;
          })
          .catch(error => {
            this.setFailureAlert('An error occurred while loading the search results. Please try again later.');
            console.error(error.response);
          })
          .finally(() => {
            this.searchLoading = false;
            document.getElementById('resultsTable').scrollIntoView({behavior: 'smooth'});
          });
      },
      showLoading(sagaType) {
        return find(this.sagaTypes, {value: sagaType}).isLoading;
      },
      async viewStuck(type) {
        this.$set(this.searchCriteria, 'status', [SAGA_STATUS_ENUM.IN_PROGRESS, SAGA_STATUS_ENUM.STARTED]);
        this.$set(this.searchCriteria, 'retryCount', true);
        this.selectedSagaType = type;
        this.search();
      }
    }
  }
</script>
<style>
  .pagination {
    border-top: thin solid rgba(0,0,0,0.12);
  }
</style>
