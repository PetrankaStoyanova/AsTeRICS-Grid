<template>
    <div v-if="gridElement">
        <div class="srow">
            <label class="three columns">{{ $t('newAction') }}</label>
            <select id="selectActionType" v-focus="" class="four columns" v-model="selectedNewAction"
                style="margin-bottom: 0.5em">
                <option v-for="type in actionTypes" :value="type.getModelName()">{{ type.getModelName() | translate }}
                </option>
            </select>
            <button class="four columns" @click="addAction()"><i class="fas fa-plus" /> <span>{{ $t('addAction')
            }}</span></button>
        </div>
        <div class="srow">
            <h2 for="actionList" class="twelve columns" style="margin-top: 1em; font-size: 1.2em">{{
                    $t('currentActions')
            }}</h2>
        </div>
        <ul id="actionList">
            <span v-show="gridElement.actions.length == 0" class="srow">
                <i18n path="noActionsDefinedClickOnAdd" tag="span">
                    <template v-slot:addAction>
                        <i class="fas fa-plus" /> <span class="hide-mobile">{{ $t('addAction') }}</span>
                    </template>
                </i18n>
            </span>
            <li v-for="action in gridElement.actions" class="srow">
                <div class="srow" style="margin-top: 0">
                    <div class="four columns" style="margin-bottom: 1em">
                        <span v-show="editActionId !== action.id">{{ action.modelName | translate }}</span>
                        <span v-show="editActionId === action.id">
                            <b>{{ action.modelName | translate }}</b> <a class="black" href="javascript:;"
                                @click="openHelp()"><i class="fas fa-question-circle"></i></a>
                        </span>
                    </div>
                    <div class="eight columns actionbtns">
                        <button @click="editAction(action)"><i class="far fa-edit" />
                            <span class="hide-mobile" v-show="editActionId !== action.id">{{ $t('edit') }}</span>
                            <span class="hide-mobile" v-show="editActionId === action.id">{{ $t('endEdit') }}</span>
                        </button>
                        <button @click="deleteAction(action)"><i class="far fa-trash-alt" /> <span
                                class="hide-mobile">{{ $t('delete') }}</span></button>
                        <button v-if="GridElementClass.canActionClassBeTested(action.modelName)"
                            @click="testAction(action)"><i class="fas fa-bolt" /> <span class="hide-mobile">{{
                                    $t('test')
                            }}</span></button>
                    </div>
                </div>
                <div v-if="editActionId === action.id" style="margin-top: 1.5em; margin-bottom: 1em">
                    <div v-if="action.modelName == 'GridActionSpeak'">
                        <div class="srow">
                            <div class="four columns">
                                <label for="selectLang" class="normal-text">{{ $t('language') }}</label>
                            </div>
                            <select class="eight columns" id="selectLang" v-model="action.speakLanguage">
                                <option :value="undefined">{{ $t('automaticCurrentLanguage') }}</option>
                                <option v-for="lang in voiceLangs" :value="lang.code">
                                    {{ lang | extractTranslation }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div v-if="action.modelName == 'GridActionSpeakCustom'">
                        <div class="srow">
                            <div class="four columns">
                                <label for="selectLang2" class="normal-text">{{ $t('language') }}</label>
                            </div>
                            <select class="eight columns" id="selectLang2" v-model="action.speakLanguage">
                                <option :value="undefined">{{ $t('automaticCurrentLanguage') }}</option>
                                <option v-for="lang in voiceLangs" :value="lang.code">
                                    {{ lang | extractTranslation }}
                                </option>
                            </select>
                        </div>
                        <div class="srow">
                            <div class="four columns">
                                <label for="inCustomText" class="normal-text">{{ $t('textToSpeak') }}</label>
                            </div>
                            <input class="eight columns" id="inCustomText" type="text"
                                v-model="action.speakText[currentLang]" />
                        </div>
                    </div>
                    <div v-if="action.modelName == 'GridActionNavigate'">
                        <div class="srow">
                            <input id="navigateBackChkbox" type="checkbox" v-model="action.toLastGrid" />
                            <label for="navigateBackChkbox" class="normal-text">{{ $t('navigateToLastOpenedGrid')
                            }}</label>
                        </div>
                        <div class="srow">
                            <input id="addToCollectChk" type="checkbox" v-model="action.addToCollectElem" />
                            <label for="addToCollectChk" class="normal-text">{{
                                    $t('addThisElementToCollectionElementsDespiteNav')
                            }}</label>
                        </div>
                        <div class="srow">
                            <div class="four columns">
                                <label for="selectGrid" class="normal-text">{{ $t('navigateToGrid') }}</label>
                            </div>
                            <select class="eight columns" id="selectGrid" type="text" v-model="action.toGridId"
                                :disabled="action.toLastGrid">
                                <option v-for="grid in grids" :value="grid.id">
                                    {{ grid.label | extractTranslation }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div v-if="action.modelName == 'GridActionARE'">
                        <edit-are-action :action="action" :grid-data="gridData" />
                    </div>
                    <div v-if="action.modelName == 'GridActionPredict'">
                        <div class="srow" v-show="gridElement.type === GridElementClass.ELEMENT_TYPE_COLLECT">
                            <div class="eight columns">
                                <input id="chkSuggestOnChange" type="checkbox" v-model="action.suggestOnChange">
                                <label for="chkSuggestOnChange" class="normal-text">{{ $t('refreshSuggestionsOnChange')
                                }}</label>
                            </div>
                        </div>
                        <div class="srow">
                            <div class="four columns">
                                <label for="comboUseDict" class="normal-text">{{ $t('dictionaryToUse') }}</label>
                            </div>
                            <select class="eight columns" id="comboUseDict" v-model="action.dictionaryKey">
                                <option :value="undefined">{{ $t('allDictionaries') }}</option>
                                <option v-for="id in dictionaryKeys" :value="id">
                                    {{ id }}
                                </option>
                            </select>
                        </div>
                    </div>
                    <div v-if="action.modelName == 'GridActionCollectElement'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="selectCollectElmAction" class="four columns normal-text">{{
                                        $t('performActionOnCollectElement')
                                }}</label>
                                <select id="selectCollectElmAction" class="eight columns" v-model="action.action">
                                    <option v-for="elmAction in collectActions" :value="elmAction">
                                        {{ elmAction | translate }}
                                    </option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <div v-if="action.modelName == 'GridActionWebradio'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="selectRadioElmAction" class="four columns normal-text">{{
                                        $t('webRadioAction')
                                }}</label>
                                <select id="selectRadioElmAction" class="eight columns" v-model="action.action">
                                    <option v-for="elmAction in webradioActions" :value="elmAction">
                                        {{ elmAction | translate }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="srow"
                            v-show="action.action === 'WEBRADIO_ACTION_START' || action.action === 'WEBRADIO_ACTION_TOGGLE'">
                            <div class="twelve columns">
                                <label for="selectRadio" class="four columns normal-text">{{ $t('webadioToPlay')
                                }}</label>
                                <select id="selectRadio" class="eight columns" v-model="action.radioId"
                                    @change="selectedRadioChanged(action.radioId)">
                                    <option value="" selected>{{ $t('automaticLastPlayed') }}</option>
                                    <option v-for="webradio in gridData.webRadios" :value="webradio.radioId">
                                        {{ webradio.radioName }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="srow">
                            <accordion :acc-label="$t('manageWebradioList')"
                                :acc-open="gridData.webRadios.length === 0 ? 'true' : 'false'" class="twelve columns">
                                <radio-list-selector v-model="gridData"></radio-list-selector>
                            </accordion>
                        </div>
                    </div>
                    <div v-if="action.modelName === 'GridActionYoutube'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="ytActions" class="four columns normal-text">{{ $t('youtubeVideoAction')
                                }}</label>
                                <select id="ytActions" class="eight columns" v-model="action.action">
                                    <option v-for="elmAction in GridActionYoutube.actions" :value="elmAction">
                                        {{ elmAction | translate }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="srow"
                            v-show="[GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
                            <div class="twelve columns">
                                <label for="ytPlayType" class="four columns normal-text">{{ $t('playType') }}</label>
                                <select id="ytPlayType" class="eight columns" v-model="action.playType">
                                    <option
                                        v-for="playType in Object.keys(GridActionYoutube.playTypes).filter(t => t !== GridActionYoutube.playTypes.YT_PLAY_RELATED)"
                                        :value="playType">{{ playType | translate }}</option>
                                </select>
                            </div>
                        </div>
                        <div
                            v-show="action.playType && [GridActionYoutube.actions.YT_PLAY, GridActionYoutube.actions.YT_TOGGLE, GridActionYoutube.actions.YT_RESTART].indexOf(action.action) !== -1">
                            <div class="srow" v-show="action.playType !== GridActionYoutube.playTypes.YT_PLAY_RELATED">
                                <div class="twelve columns">
                                    <label for="ytList" class="four columns normal-text">
                                        <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_VIDEO">{{
                                                $t('videoLink')
                                        }}</span>
                                        <span v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_SEARCH">{{
                                                $t('youtubeSearchQuery')
                                        }}</span>
                                        <span
                                            v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_PLAYLIST">{{
                                                    $t('youtubePlaylistLink')
                                            }}</span>
                                        <span
                                            v-show="action.playType === GridActionYoutube.playTypes.YT_PLAY_CHANNEL">{{
                                                    $t('youtubeChannelLink')
                                            }}</span>
                                    </label>
                                    <input id="ytList" type="text" class="eight columns" v-model="action.data" />
                                </div>
                            </div>
                            <div class="srow">
                                <input id="showCC" type="checkbox" v-model="action.showCC" />
                                <label for="showCC" class="normal-text">{{ $t('showVideoSubtitlesIfAvailable')
                                }}</label>
                            </div>
                            <div class="srow">
                                <input id="playMuted" type="checkbox" v-model="action.playMuted" />
                                <label for="playMuted" class="normal-text">{{ $t('startVideoMuted') }}</label>
                            </div>
                            <div class="srow">
                                <input id="afterNav" type="checkbox" v-model="action.performAfterNav" />
                                <label for="afterNav" class="normal-text">{{ $t('performActionAfterNavigation')
                                }}</label>
                            </div>
                        </div>
                        <div class="srow"
                            v-show="[GridActionYoutube.actions.YT_STEP_FORWARD, GridActionYoutube.actions.YT_STEP_BACKWARD].indexOf(action.action) !== -1">
                            <div class="twelve columns">
                                <label for="stepSeconds" class="four columns normal-text">{{ $t(action.action) }} {{
                                        $t('secondsBracket')
                                }}</label>
                                <input id="stepSeconds" type="number" class="eight columns" v-model="action.stepSeconds"
                                    min="0" />
                            </div>
                        </div>
                        <div class="srow"
                            v-show="[GridActionYoutube.actions.YT_VOLUME_UP, GridActionYoutube.actions.YT_VOLUME_DOWN].indexOf(action.action) !== -1">
                            <div class="twelve columns">
                                <label for="stepVolume" class="four columns normal-text">{{ $t(action.action) }} {{
                                        $t('percentBracket')
                                }}</label>
                                <input id="stepVolume" type="number" class="eight columns" v-model="action.stepVolume"
                                    min="0" max="100" />
                            </div>
                        </div>
                    </div>
                    <div v-if="action.modelName === 'GridActionChangeLang'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="changeLang" class="four columns normal-text">{{
                                        $t('changeApplicationLanguageTo')
                                }}</label>
                                <select id="changeLang" class="eight columns" v-model="action.language">
                                    <option :value="undefined">{{ $t('systemLanguage') }}</option>
                                    <option v-for="lang in (selectFromAllLanguages ? allLanguages : gridLanguages)"
                                        :value="lang.code">
                                        {{ lang | extractTranslation }}
                                    </option>
                                </select>
                            </div>
                        </div>
                        <div class="srow">
                            <div class="offset-by-four eight columns">
                                <input id="selectFromAllLangs" type="checkbox" v-model="selectFromAllLanguages" />
                                <label for="selectFromAllLangs" class="normal-text">{{
                                        $t('showAllLanguagesForSelection')
                                }}</label>
                            </div>
                        </div>
                    </div>
                    <div v-if="action.modelName === 'GridActionOpenWebpage'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="openUrl" class="four columns normal-text">{{ $t('webpageUrl') }}</label>
                                <input id="openUrl" type="text" class="eight columns" v-model="action.openURL" />
                            </div>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="webpageCloseTimeout" class="four columns normal-text">{{
                                        $t('automaticallyCloseTimeoutInSeconds')
                                }}</label>
                                <input id="webpageCloseTimeout" type="number" min="0" class="eight columns"
                                    v-model="action.timeoutSeconds" />
                            </div>
                        </div>
                    </div>


                    <div v-if="action.modelName === 'GridActionTurnOnShelly'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="turn" class="four columns normal-text">{{ $t('turn') }}</label>
                                <!--.<input id="method" type="text" class="eight columns" v-model="action.method"/>..-->
                                <select id="turn" class="eight columns" v-model="action.turn">
                                    <option>{{ $t('turnOn') }}</option>
                                    <option>{{ $t('turnOff') }}</option>
                                    <option>{{ $t('turnToggle') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="httpHttps" class="four columns normal-text">{{ $t('httpHttps')
                                }}</label>
                                <select id="httpHttps" class="eight columns" v-model="action.httpHttps">
                                    <option>{{ $t('http') }}</option>
                                    <option>{{ $t('https') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="shellyIP" class="four columns normal-text">{{ $t('inputIpAddress')
                                }}</label>
                                <input id="shellyIP" type="text" class="eight columns" v-model="action.shellyIP" />
                            </div>
                        </div>
                    </div>


                    <div v-if="action.modelName === 'GridActionKeyValueRequest'">
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="method" class="four columns normal-text">{{ $t('method') }}</label>
                                <!--.<input id="method" type="text" class="eight columns" v-model="action.method"/>..-->

                                <select id="method" class="eight columns" v-model="action.method">
                                    <option>{{ $t('getMethod') }}</option>
                                    <option>{{ $t('postMethod') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="urlRequest" class="four columns normal-text">{{ $t('urlRequest')
                                }}</label>
                                <input id="urlRequest" type="text" class="eight columns" v-model="action.urlRequest" />
                            </div>
                        </div>
                        <div class="srow">
                            <div class="twelve columns">
                                <label for="format" class="four columns normal-text">{{ $t('format') }}</label>
                                <!--.<input id="method" type="text" class="eight columns" v-model="action.method"/>..-->

                                <select id="format" class="eight columns" v-model="action.format">
                                    <option>{{ $t('body') }}</option>
                                    <option>{{ $t('params') }}</option>
                                </select>
                            </div>
                        </div>
                        <div class="srow">
                            <div v-if="action.format === 'Body'">
                                <div class="srow">
                                    <div class="twelve columns">
                                        <label for="bodyData" class="four columns normal-text">{{ $t('bodyData')
                                        }}</label>
                                        <input id="bodyData" type="text" class="eight columns"
                                            v-model="action.bodyData" />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div v-if="action.format === 'Parameters'">
                            <div class="srow">
                                <div class="twelve columns">


                                    <label for=" keyParameter" class="four columns normal-text">{{
                                            $t('keyParameter')
                                    }}</label>
                                    <input id="keyParameter" type="text" class="eight columns"
                                        v-model="action.keyParameter" />


                                </div>
                            </div>
                            <div class="srow">
                                <div class="twelve columns">
                                    <label for="valueParameter" class="four columns normal-text">{{
                                            $t('valueParameter')
                                    }}</label>
                                    <input id="valueParameter" type="text" class="eight columns"
                                        v-model="action.valueParameter" />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import { dataService } from '../../js/service/data/dataService'
import { actionService } from './../../js/service/actionService'
import { speechService } from './../../js/service/speechService'
import { predictionService } from "../../js/service/predictionService";
import { i18nService } from "../../js/service/i18nService";
import { GridActionNavigate } from "../../js/model/GridActionNavigate";
import './../../css/modal.css';
import { GridElement } from "../../js/model/GridElement";
import { GridData } from "../../js/model/GridData";
import EditAreAction from "./editActionsSub/editAREAction.vue";
import { GridActionCollectElement } from "../../js/model/GridActionCollectElement";
import { helpService } from "../../js/service/helpService";
import { GridActionWebradio } from "../../js/model/GridActionWebradio";
import Accordion from "../components/accordion.vue";
import { imageUtil } from "../../js/util/imageUtil";
import { GridImage } from "../../js/model/GridImage";
import RadioListSelector from "../components/radioListSelector.vue";
import { GridActionYoutube } from "../../js/model/GridActionYoutube";

export default {
    props: ['gridElement', 'gridData'],
    data: function () {
        return {
            grids: null,
            GridElementClass: GridElement,
            editActionId: null,
            selectedNewAction: GridElement.getActionTypes()[0].getModelName(),
            actionTypes: GridElement.getActionTypes(),
            voiceLangs: speechService.getVoicesLangs(),
            dictionaryKeys: predictionService.getDictionaryKeys(),
            collectActions: GridActionCollectElement.getActions(),
            webradioActions: GridActionWebradio.getActions(),
            currentLang: i18nService.getCurrentLang(),
            allLanguages: i18nService.getAllLanguages(),
            gridLanguages: null,
            selectFromAllLanguages: false,
            GridActionYoutube: GridActionYoutube,
            GridElement: GridElement
        }
    },
    components: {
        RadioListSelector,
        Accordion,
        EditAreAction
    },
    methods: {
        selectedRadioChanged(radioId) {
            let faviconUrl = this.gridData.webRadios.filter(el => el.radioId === radioId)[0].faviconUrl;
            if (faviconUrl) {
                imageUtil.urlToBase64(faviconUrl).then(base64 => {
                    if (base64) {
                        this.gridElement.image = new GridImage({ data: base64 });
                    }
                });
            }
        },
        deleteAction(action) {
            this.gridElement.actions = this.gridElement.actions.filter(a => a.id != action.id);
        },
        editAction(action) {
            if (this.editActionId !== action.id) {
                this.editActionId = action.id;
            } else {
                this.editActionId = null;
            }
        },
        endEditAction() {
            this.editActionId = null;
        },
        testAction(action) {
            actionService.testAction(this.gridElement, action, new GridData(this.gridData));
        },
        addAction() {
            let thiz = this;
            let newAction = JSON.parse(JSON.stringify(GridElement.getActionInstance(this.selectedNewAction)));

            if (newAction.modelName === GridActionNavigate.getModelName()) {

                newAction.toGridId = this.grids[0].id;
            }
            thiz.gridElement.actions.push(newAction);
            thiz.editActionId = newAction.id;
        },
        openHelp() {
            helpService.openHelp();
        }
    },
    mounted() {
        let thiz = this;
        let langKeys = Object.keys(thiz.gridData.label);
        thiz.gridLanguages = thiz.allLanguages.filter(lang => langKeys.indexOf(lang.code) !== -1);
        dataService.getGrids().then(grids => {
            thiz.grids = grids;
            thiz.grids = thiz.grids.sort((a, b) => i18nService.getTranslation(a.label).localeCompare(i18nService.getTranslation(b.label)));
        });
        helpService.setHelpLocation('05_actions', '#edit-actions-modal');
    },
    beforeDestroy() {
        helpService.setHelpLocation('02_navigation', '#edit-view');
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

[v-cloak] {
    display: none !important;
}

.normal-text {
    font-weight: normal;
}

.actionbtns button {
    width: 32%;
    padding: 0;
}
</style>