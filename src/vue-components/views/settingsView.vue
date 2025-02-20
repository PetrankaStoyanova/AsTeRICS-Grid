<template>
    <div class="overflow-content">
        <header-icon full-header="true"></header-icon>
        <div class="srow content spaced" v-if="show">
            <div class="srow">
                <h2 class="six columns">{{ $t('generalSettings') }}</h2>
                <div v-if="saveSuccess" style="padding-top: 1.7em;"><i class="fas fa-check" style="color: green"></i> <span>{{ $t('allChangesSaved') }}</span></div>
            </div>
            <div class="srow">
                <div class="ten columns">
                    <h3 class="mt-0">{{ $t('applicationLanguage') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="inLanguage">{{ $t('selectLanguage') }}</label>
                        <select class="five columns" id="inLanguage" v-model="langCode" @change="saveLangCode()">
                            <option value="">{{ $t('automatic') }}</option>
                            <option v-for="lang in allLanguages.filter(lang => ['de', 'en'].indexOf(lang.code) !== -1 || gridLanguages.indexOf(lang.code) !== -1)" :value="lang.code">{{lang | extractTranslation}} ({{lang.code}})</option>
                        </select>
                    </div>
                    <div class="srow">
                        <span class="fa fa-info-circle"></span>
                        <span class="break-word">
                        {{ $t('gridsCanBeTranslatedToEveryLanguage') }}
                    </span>
                    </div>
                    <div class="srow" style="margin-bottom: 0.5em">
                        <span class="fa fa-info-circle"></span>
                        <span class="break-word">
                        <i18n path="ifTheTranslationForYourLanguageIsNotAvailable" tag="span">
                            <template v-slot:crowdin>
                                <a href="https://crowdin.com/project/asterics-grid" target="_blank">crowdin.com</a>
                            </template>
                        </i18n>
                    </span>
                    </div>
                </div>
            </div>
            <div class="srow">
                <div class="ten columns">
                    <h3>{{ $t('voice') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="inVoice">
                            <span>{{ $t('preferredVoice') }}</span>
                        </label>
                        <select id="inVoice" class="five columns" v-model="selectedVoiceName" @change="saveVoice()">
                            <option value="">{{ $t('automatic') }}</option>
                            <option v-for="voice in voices" :value="voice.name">{{voice.name}}</option>
                        </select>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="testText">
                            <span>{{ $t('testText') }}</span>
                        </label>
                        <input id="testText" class="five columns" type="text" v-model="testText">
                        <button id="testVoice" class="three columns" @click="testSpeak">{{ $t('test') }}</button>
                    </div>
                </div>
            </div>
            <div class="srow">
                <div class="ten columns">
                    <h3>{{ $t('miscellaneous') }}</h3>
                    <div class="srow">
                        <input id="chkSyncNavigation" type="checkbox" v-model="syncNavigation" @change="saveSyncNavigation()"/>
                        <label for="chkSyncNavigation">{{ $t('synchronizeNavigationAndLockedState') }}</label>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="unlockPass">{{ $t('passcodeForUnlockingUserInterface') }}</label>
                        <input class="five columns" id="unlockPass" type="number" v-model="unlockPasscode" @input="unlockPasscode = unlockPasscode.substring(0, 6); savePasscode()" :placeholder="$t('noPasscodeBracket')"/>
                        <button class="three columns" @click="unlockPasscode = null; savePasscode()">{{ $t('reset') }}</button>
                    </div>
                </div>
            </div>
            <div class="srow">
                <div class="ten columns">
                    <h3>{{ $t('colors') }}</h3>
                    <div class="srow">
                        <label class="three columns" for="elemColor">
                            <span>{{ $t('defaultGridElementColor') }}</span>
                        </label>
                        <input id="elemColor" v-model="elemColor" class="five columns" type="color" @change="event => localStorageService.save(localStorageService.COLOR_DEFAULT_ELEM_BACKGROUND, event.target.value)">
                        <button class="three columns" @click="elemColor = '#add8e6'; localStorageService.save(localStorageService.COLOR_DEFAULT_ELEM_BACKGROUND, elemColor)">{{ $t('reset') }}</button>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="appColor">
                            <span>{{ $t('defaultGridBackgroundColor') }}</span>
                        </label>
                        <input id="appColor" v-model="gridBackgroundColor" class="five columns" type="color" @change="event => localStorageService.save(localStorageService.COLOR_DEFAULT_GRID_BACKGROUND, event.target.value)">
                        <button class="three columns" @click="gridBackgroundColor = '#ffffff'; localStorageService.save(localStorageService.COLOR_DEFAULT_GRID_BACKGROUND, gridBackgroundColor)">{{ $t('reset') }}</button>
                    </div>
                    <div class="srow">
                        <label class="three columns" for="colorScheme">
                            <span>{{ $t('colorSchemeForCategories') }}</span>
                        </label>
                        <select id="colorScheme" class="five columns" v-model="colorScheme" @change="event => localStorageService.save(localStorageService.COLOR_SCHEME, event.target.value)">
                            <option v-for="scheme in constants.DEFAULT_COLOR_SCHEMES" :value="scheme.name">{{scheme.name | translate}}</option>
                        </select>
                    </div>
                    <div class="srow">
                        <div class="five columns offset-by-three d-flex" style="height: 1.5em">
                            <div class="flex-grow-1" v-for="color in constants.DEFAULT_COLOR_SCHEMES.filter(s => s.name === colorScheme)[0].colors" :style="`background-color: ${color};`"></div>
                        </div>
                    </div>
                    <div class="srow">
                        <input id="colorSchemeActive" type="checkbox" v-model="colorSchemeActive" @change="event => localStorageService.save(localStorageService.COLOR_SCHEME_ACTIVATED, colorSchemeActive)"/>
                        <label for="colorSchemeActive">
                            <span>{{ $t('activateColorCategoriesOfGridElements') }}</span>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import {dataService} from "../../js/service/data/dataService";
    import HeaderIcon from '../../vue-components/components/headerIcon.vue'
    import {speechService} from "../../js/service/speechService";
    import {util} from "../../js/util/util";
    import {localStorageService} from "../../js/service/data/localStorageService";
    import {constants} from "../../js/util/constants.js";

    export default {
        components: {HeaderIcon},
        props: [],
        data() {
            return {
                metadata: null,
                show: false,
                langCode: '',
                gridLanguages: [],
                allLanguages: i18nService.getAllLanguages(),
                currentLang: i18nService.getCurrentLang(),
                saveSuccess: null,
                speechService: speechService,
                syncNavigation: localStorageService.shouldSyncNavigation(),
                unlockPasscode: localStorageService.getUnlockPasscode(),
                voices: speechService.getVoices(),
                selectedVoiceName: speechService.getPreferredVoiceName(),
                testText: i18nService.t('thisIsAnEnglishSentence'),
                i18nService: i18nService,
                localStorageService: localStorageService,
                elemColor: localStorageService.get(localStorageService.COLOR_DEFAULT_ELEM_BACKGROUND) || '#add8e6', //default: "lightblue"
                gridBackgroundColor: localStorageService.get(localStorageService.COLOR_DEFAULT_GRID_BACKGROUND) || '#ffffff',
                colorScheme: localStorageService.get(localStorageService.COLOR_SCHEME) || constants.DEFAULT_COLOR_SCHEMES[0].name,
                colorSchemeActive: localStorageService.get(localStorageService.COLOR_SCHEME_ACTIVATED) !== 'false',
                constants: constants
            }
        },
        methods: {
            saveLangCode() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    i18nService.setLanguage(this.langCode);
                    this.saveSuccess = true;
                }, 300, 'SAVE_LANG');
            },
            saveVoice() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    speechService.setPreferredVoiceName(this.selectedVoiceName);
                    this.saveSuccess = true;
                }, 300, 'SAVE_VOICE');
            },
            saveSyncNavigation() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    localStorageService.setShouldSyncNavigation(this.syncNavigation);
                    this.saveSuccess = true;
                }, 300, 'SAVE_NAV');
            },
            savePasscode() {
                this.saveSuccess = undefined;
                util.debounce(() => {
                    localStorageService.setUnlockPasscode(this.unlockPasscode);
                    this.saveSuccess = true;
                }, 500, 'SAVE_UNLOCK');
            },
            testSpeak() {
                speechService.speak(this.testText, null , this.selectedVoiceName);
            }
        },
        mounted() {
            let thiz = this;
            dataService.getMetadata().then(metadata => {
                thiz.metadata = JSON.parse(JSON.stringify(metadata));
                thiz.show = true;
            });
            dataService.getGrids(false, true).then(grids => {
                let languages = grids.reduce((total, grid) => {
                    total = total.concat(Object.keys(grid.label));
                    return total.concat(grid.gridElements.reduce((t2, gridElem) => {
                        return t2.concat(Object.keys(gridElem.label));
                    }, []));
                }, []);
                thiz.gridLanguages = [...new Set(languages)];
            });
            thiz.langCode = i18nService.getCustomLanguage();
        }
    }
</script>

<style scoped>
    .content {
        display: flex;
        flex-direction: column;
        flex: 1 0 auto;
    }
    .fa-info-circle {
        color: #266697;
        margin-right: 0.5em;
    }
    .fa-check {
        color: green;
    }
    h2 {
        margin-bottom: 0.5em;
    }
    h3 {
        margin-bottom: 0.5em;
    }
    .srow {
        margin-bottom: 1.5em;
    }
</style>