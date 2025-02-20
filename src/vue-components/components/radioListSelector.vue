<template>
    <div>
        <div class="srow">
            <h3 class="six columns">{{ $t('selectedRadioStations') }}</h3>
            <button class="six columns" :disabled="selectedRadioList.length === 0" @click="addAllRadioElements">{{ $t('createGridElementsForWebradios') }}</button>
        </div>
        <div class="srow">
            <ul class="webradioList">
                <li v-for="webradio in selectedRadioList">
                    <div class="webRadioListItem">
                        <img :src="webradio.faviconUrl"/>
                        <div class="webRadioLabel">{{webradio.radioName}}</div>
                        <div class="webRadioButtons">
                            <button class="right" @click="removeRadio(webradio)"><span class="hide-mobile">{{ $t('remove') }}</span> <i class="fas fa-trash"></i></button>
                            <button v-if="webradioPlaying !== webradio" class="right" @click="webradioPlaying = webradio; webradioService.play(webradio)"><span class="hide-mobile">{{ $t('play') }} </span><i class="fas fa-play"></i></button>
                            <button v-if="webradioPlaying === webradio" class="right" @click="webradioPlaying = null; webradioService.stop()"><span class="hide-mobile">{{ $t('stop') }}</span> <i class="fas fa-pause"></i></button>
                            <button class="right" @click="moveWebradioUp(webradio)"><span class="hide-mobile">{{ $t('up') }}</span> <i class="fas fa-arrow-up"></i></button>
                        </div>
                    </div>
                </li>
            </ul>
            <div v-if="selectedRadioList.length === 0">{{ $t('noSelectedRadioStationsUseSearchBar') }}</div>
        </div>

        <div class="srow">
            <h3 class="four columns">{{ $t('webradioSearch') }}</h3>
            <span id="poweredby" class="eight columns">
                <i18n path="radioSearchPoweredBy" tag="span">
                    <template v-slot:radioLink>
                        <a href="https://www.radio-browser.info/gui/#!/" target="_blank">radio-browser.info</a>
                    </template>
                </i18n>
            </span>
        </div>
        <div class="srow">
            <div class="four columns">
                <label for="searchwebradios" class="normal-text">{{ $t('searchTerm') }}</label>
                <i class="fas fa-info-circle hide-mobile" :title="$t('byDefaultSearchesForRadioStationNameAdvanced')"></i>
            </div>
            <input id="searchwebradios" class="eight columns" type="text" v-model="webradioSearch" @input="searchWebradios($event)"/>
        </div>
        <div class="srow">
            <ul class="webradioList">
                <li v-for="webradio in webradioSearchResults">
                    <div class="webRadioListItem">
                        <img :src="webradio.faviconUrl"/>
                        <div class="webRadioLabel">{{webradio.radioName}}</div>
                        <div class="webRadioButtons">
                            <button class="right" @click="selectedRadioList.push(webradio); modelChanged();" :disabled="selectedRadioList.map(el => el.radioId).indexOf(webradio.radioId) > -1"><span class="hide-mobile">{{ $t('select') }}</span> <i class="fas fa-plus"></i></button>
                            <button v-if="webradioPlaying !== webradio" class="right" @click="webradioPlaying = webradio; webradioService.play(webradio)"><span class="hide-mobile">{{ $t('play') }} </span><i class="fas fa-play"></i></button>
                            <button v-if="webradioPlaying === webradio" class="right" @click="webradioPlaying = null; webradioService.stop()"><span class="hide-mobile">{{ $t('stop') }} </span><i class="fas fa-pause"></i></button>
                        </div>
                    </div>
                </li>
            </ul>
            <div v-show="webradioSearchResults.length === 0 && webradioSearch && !webradioSearching && !webradioSearchError">{{ $t('noRadioStationsFoundTryAnOtherSearchTerm') }}</div>
            <div v-show="webradioSearchError"><span>{{ $t('searchingFailedNoConnectionToInternet') }}</span> <a href="javascript:;" @click="searchWebradios">{{ $t('retry') }}</a></div>
            <div style="display: flex; margin-top: 0.5em" v-show="webradioSearchResults.length > 0">
                <button @click="prevSearchResults" :disabled="webradioStartIndex === 0" style="flex-grow: 1;"><i class="fas fa-arrow-left"></i> <span class="hide-mobile">{{ $t('previousPage') }}</span></button>
                <button @click="nextSearchResults" :disabled="!hasMoreWebradios" style="flex-grow: 1;"><span class="hide-mobile">{{ $t('nextPage') }}</span> <i class="fas fa-arrow-right"></i></button>
            </div>
        </div>
    </div>
</template>

<script>
    import {webradioService} from "../../js/service/webradioService";
    import {util} from "../../js/util/util";
    import {i18nService} from "../../js/service/i18nService";
    import {GridData} from "../../js/model/GridData";
    import {GridActionWebradio} from "../../js/model/GridActionWebradio";
    import {GridImage} from "../../js/model/GridImage";
    import {imageUtil} from "../../js/util/imageUtil";

    let WEBRADIO_LIMIT = 10;

    export default {
        props: {
            value: Object
        },
        watch: {
            value: {
                handler: function(newValue) {
                    this.gridData = JSON.parse(JSON.stringify(newValue));
                    this.selectedRadioList = this.gridData.webRadios;
                },
                deep: true
            }
        },
        data() {
            return {
                gridData: null,
                selectedRadioList: [],
                webradioSearchResults: [],
                webradioSearch: null,
                webradioService: webradioService,
                webradioPlaying: null,
                webradioStartIndex: 0,
                webradioSearching: false,
                webradioSearchError: false,
                hasMoreWebradios: false
            }
        },
        methods: {
            modelChanged() {
                this.gridData.webRadios = this.selectedRadioList;
                this.$emit('input', JSON.parse(JSON.stringify(this.gridData)));
            },
            addAllRadioElements() {
                if (!confirm(i18nService.t('thisActionAddsXNewElements', this.gridData.webRadios.length))) {
                    return;
                }
                let thiz = this;
                let promises = [];
                let promiseChain = Promise.resolve();
                thiz.gridData.webRadios.forEach((radio, index) => {
                    const makeNextPromise = (currentRadio) => () => {
                        let promise = imageUtil.urlToBase64(currentRadio.faviconUrl).then(base64 => {
                            let image = base64 ? new GridImage({data: base64}) : undefined;
                            let newElement = new GridData(thiz.gridData).getNewGridElement({
                                label: i18nService.getTranslationObject(currentRadio.radioName),
                                actions: [new GridActionWebradio({
                                    radioId: currentRadio.radioId,
                                    action: GridActionWebradio.WEBRADIO_ACTION_START
                                })],
                                image: image
                            });
                            thiz.gridData.gridElements.push(newElement);
                            return Promise.resolve();
                        });
                        return promise;
                    }
                    promiseChain = promiseChain.then(makeNextPromise(radio));
                });
                promiseChain.then(() => {
                    this.modelChanged();
                });
            },
            searchWebradios(event) {
                let thiz = this;
                this.webradioSearch = event.target.value;
                thiz.webradioStartIndex = 0;
                thiz.searchWebradiosInternal();
            },
            nextSearchResults() {
                let thiz = this;
                thiz.webradioStartIndex += WEBRADIO_LIMIT;
                thiz.searchWebradiosInternal();
            },
            prevSearchResults() {
                let thiz = this;
                thiz.webradioStartIndex -= WEBRADIO_LIMIT;
                thiz.searchWebradiosInternal();
            },
            searchWebradiosInternal() {
                let thiz = this;
                thiz.webradioSearching = true;
                thiz.webradioSearchError = false;
                util.debounce(() => {
                    webradioService.search(thiz.webradioSearch, WEBRADIO_LIMIT, thiz.webradioStartIndex).then(result => {
                        thiz.hasMoreWebradios = webradioService.hasMoreSearchResults();
                        thiz.webradioSearchResults = result;
                        thiz.webradioSearching = false;
                    }).catch(error => {
                        thiz.webradioSearchError = true;
                        thiz.webradioSearching = false;
                    });
                }, 500);
            },
            moveWebradioUp(radio) {
                let index = this.selectedRadioList.indexOf(radio);
                if (index > 0) {
                    this.selectedRadioList.splice(index - 1, 0, this.selectedRadioList.splice(index, 1)[0]);
                    this.modelChanged();
                }
            },
            removeRadio(webradio) {
                webradioService.stop(webradio.radioId);
                this.selectedRadioList = this.selectedRadioList.filter(radio => radio.radioId !== webradio.radioId);
                this.modelChanged();
            }
        },
        mounted() {
            let thiz = this;
            thiz.gridData = JSON.parse(JSON.stringify(thiz.value));
            thiz.selectedRadioList = thiz.gridData.webRadios;
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }

    ul li {
        list-style: none;
        outline: 1px solid lightgray;
        padding: 0.5em;
    }

    .webradioList button {
        line-height: unset;
        margin-bottom: 0;
        padding: 0 10px;
    }

    .webradioList, .webradioList li, .webradioList li div {
        padding: 0;
        margin: 0;
    }

    .webradioList li:hover {
        background-color: #c4f0fe;
    }

    .webRadioListItem {
        display: flex;
    }

    .webRadioListItem img {
        flex-grow: 0;
        flex-shrink: 0;
        vertical-align: middle;
        height: 28px;
        width: 28px;
    }

    .webRadioLabel {
        flex-grow: 1;
        flex-shrink: 1;
        margin: 0 5px !important;
    }

    .webRadioButtons {
        flex-grow: 0;
        flex-shrink: 0;
    }

    @media (min-width: 850px) {
        #poweredby {
            margin-top: 1em;
        }
    }
</style>