<template>
    <div class="modal">
        <div class="modal-mask">
            <div class="modal-wrapper">
                <div class="modal-container" @keyup.27="$emit('close')" @keyup.ctrl.enter="save()">
                    <a class="inline close-button" href="javascript:void(0);" @click="$emit('close')"><i class="fas fa-times"/></a>
                    <div class="modal-header">
                        <h1 name="header">
                            {{ $t('exportGridsToPdfGrids') }}
                        </h1>
                    </div>

                    <div class="modal-body">
                        <div class="srow">
                            <label class="two columns" for="selectGrid">{{ $t('selectGrid') }}</label>
                            <select class="four columns" id="selectGrid" v-model="selectedGrid" @change="selectedGridChanged">
                                <option :value="null">{{ $t('allGrids') }}</option>
                                <option v-for="elem in graphList" :value="elem.grid">{{elem.grid.label | extractTranslation}}</option>
                            </select>
                            <div class="four columns">
                                <img v-if="selectedGrid && selectedGrid.thumbnail" :src="selectedGrid.thumbnail.data">
                            </div>
                        </div>
                        <div class="srow" v-show="selectedGrid && allChildren && allChildren.length > 0">
                            <input id="exportConnected" type="checkbox" v-model="options.exportConnected"/>
                            <label for="exportConnected" >
                                <span>{{ $t('exportAllChildGrids') }}</span>
                                <span>({{allChildren ? allChildren.length : 0}} <span>{{ $t('grids') }}</span>)</span>
                            </label>
                        </div>
                        <div class="srow">
                            <input id="showLinks" type="checkbox" v-model="options.showLinks"/>
                            <label for="showLinks">{{ $t('insertLinksBetweenPages') }}</label>
                        </div>
                        <div class="srow">
                            <input id="printBackground" type="checkbox" v-model="options.printBackground"/>
                            <label for="printBackground">{{ $t('printBackgroundColor') }}</label>
                        </div>
                        <div class="srow">
                            <input id="showRegister" type="checkbox" v-model="options.showRegister"/>
                            <label for="showRegister">{{ $t('printIndexAtSideEdge') }}</label>
                        </div>
                    </div>

                    <div class="modal-footer">
                        <div class="button-container srow">
                            <button class="six columns" @click="$emit('close')" :title="$t('keyboardEsc')">
                                <i class="fas fa-times"/> <span>{{ $t('cancel') }}</span>
                            </button>
                            <button class="six columns" @click="save()" :title="$t('keyboardCtrlEnter')">
                                <i class="fas fa-check"/> <span>{{ $t('downloadPdf') }}</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    import {i18nService} from "../../js/service/i18nService";
    import './../../css/modal.css';
    import {dataService} from "../../js/service/data/dataService";
    import {gridUtil} from "../../js/util/gridUtil";
    import {printService} from "../../js/service/printService";
    import {MainVue} from "../../js/vue/mainVue";

    export default {
        props: ['gridsData'],
        data: function () {
            return {
                selectedGrid: null,
                globalGridId: null,
                graphList: [],
                allChildren: null,
                options: {
                    exportConnected: true,
                    printBackground: false,
                    showLinks: true,
                    showRegister: false
                }
            }
        },
        methods: {
            save() {
                let exportGrids = null;
                if (!this.selectedGrid) {
                    exportGrids = this.graphList.map(elem => elem.grid);
                } else {
                    exportGrids = this.options.exportConnected ? [this.selectedGrid].concat(this.allChildren) : [this.selectedGrid];
                }
                let exportIds = exportGrids.map(grid => grid.id);
                Promise.resolve().then(async () => {
                    if (exportGrids.length > this.gridsData.length / 2) {
                        return dataService.getGrids(true, true);
                    } else {
                        let grids = [];
                        for (let i = 0; i < exportIds.length; i++) {
                            let fullGrid = await dataService.getGrid(exportIds[i]);
                            grids.push(fullGrid);
                        }
                        return Promise.resolve(grids);
                    }
                }).then((grids) => {
                    grids = exportIds.map(id => grids.filter(grid => grid.id === id)[0]);
                    printService.gridsToPdf(grids, {
                        printBackground: this.options.printBackground,
                        showLinks: this.options.showLinks,
                        showRegister: this.options.showRegister,
                        progressFn: (progress, text, abortFn) => {
                            MainVue.showProgressBar(progress, {
                                header: i18nService.t('creatingPDFFile'),
                                text: text,
                                cancelFn: abortFn,
                                closable: true
                            })
                        }
                    });
                    this.$emit('close');
                });
            },
            selectedGridChanged() {
                if (!this.selectedGrid) {
                    return;
                }
                this.allChildren = gridUtil.getAllChildrenRecursive(this.graphList, this.selectedGrid.id);
            }
        },
        mounted() {
            dataService.getGlobalGrid().then(globalGrid => {
                this.globalGridId = globalGrid ? globalGrid.id : null;
                this.graphList = gridUtil.getGraphList(this.gridsData, this.globalGridId);
            });
        }
    }
</script>

<style scoped>
    .srow {
        margin-top: 1em;
    }
</style>