<template>
    <div>
        <ul>
            <li v-for="(input, index) in inputs">
                <div class="srow nomargin">
                    <label class="three columns input-label" :for="input.label + index">
                        <span>{{ input.label | translate }}</span>
                        <span v-show="input.label === InputConfig.GENERAL_INPUT">{{ index + 1 }}</span>
                    </label>
                    <select :id="input.label + index" @change="typeChange(index, $event.target.value)"
                        class="five columns">
                        <option value=""><span>{{ $t('notDefined') }}</span></option>
                        <option v-for="inputEvent in inputEventTypes" :value="inputEvent.getModelName()"
                            :selected="inputEvent.getModelName() === input.modelName">
                            {{ inputEvent.getModelName() | translate }}
                        </option>
                    </select>
                    <span class="two columns" v-show="errorInputs.indexOf(input.label) > -1"><i
                            class="warn fas fa-exclamation-triangle"></i></span>
                </div>
                <div v-if="input.modelName === InputEventKey.getModelName()">
                    <div class="srow">
                        <button @click="recordKey(input, index)" class="five columns offset-by-three">
                            <i class="fas fa-keyboard"></i>
                            <span v-show="!keyRecording[input.label + index]">{{ $t('recordKey') }}</span>
                            <span v-show="keyRecording[input.label + index]">{{ $t('pressKey') }}</span>
                        </button>
                        <span class="four columns">
                            <b>{{ $t('currentKey') }}</b>
                            <span v-show="!input.keyCode">{{ $t('noKey') }}</span>
                            <span v-show="input.keyCode">{{ input.keyName + ' (' + input.keyCode + ')' }}</span>
                        </span>
                    </div>
                    <div class="srow">
                        <accordion :acc-label="$t('more')" class="nine columns offset-by-three">
                            <div class="srow">
                                <label class="one-third column" :for="'inTimeout' + index">{{ $t('timeoutMs') }}</label>
                                <input class="two-thirds column" :id="'inTimeout' + index" type="number" min="0"
                                    max="5000" step="100" v-model.number="input.timeout" @input="modelChanged" />
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'inRepeat' + index">{{ $t('repetitions')
                                }}</label>
                                <input v-show="input.holdDuration === 0" class="two-thirds column"
                                    :id="'inRepeat' + index" type="number" min="1" max="9" v-model.number="input.repeat"
                                    @input="modelChanged" />
                                <span v-show="input.holdDuration > 0" class="two-thirds column">
                                    <span>{{ $t('disabledIfHoldDurationIsSet') }}</span>
                                    <a href="javascript:;" @click="input.holdDuration = 0; modelChanged();">{{
                                            $t('enable')
                                    }}</a>
                                </span>
                            </div>
                            <div class="srow">
                                <label class="one-third column" :for="'inRepeat' + index">{{ $t('holdDurationMs')
                                }}</label>
                                <input v-show="input.repeat === 1" class="two-thirds column" :id="'inRepeat' + index"
                                    type="number" min="0" max="5000" step="100" v-model.number="input.holdDuration"
                                    :disabled="input.repeat > 1" @input="modelChanged" />
                                <span v-show="input.repeat > 1" class="two-thirds column">
                                    <span>{{ $t('disabledIfRepetitionsAreSet') }}</span>
                                    <a href="javascript:;" @click="input.repeat = 1; modelChanged();">{{ $t('enable')
                                    }}</a>
                                </span>
                            </div>
                        </accordion>
                    </div>
                </div>
                <div v-if="input.modelName === InputEventARE.getModelName()">
                    <div class="srow">
                        <button @click="recordAREEvent(input, index)" class="five columns offset-by-three">
                            <i class="fas fa-bolt"></i>
                            <span v-show="!keyRecording[input.label + index]">{{ $t('recordAreEvent') }}</span>
                            <span v-show="keyRecording[input.label + index]">{{ $t('waitingForEvent') }}</span>
                        </button>
                        <label class="four columns" for="inputAreUrl">{{ $t('areUrl') }}</label>
                        <input class="four columns" id="inputAreUrl" type="text" v-model="input.areURL"
                            :placeholder="$t('emptyIsAutomatic')" @change="changedAreURL(input)"
                            @input="areError[input.label + index] = false" />
                    </div>
                    <div class="srow">
                        <span class="nine columns offset-by-three" v-show="areError[input.label + index]">
                            <i class="fas fa-exclamation-triangle"></i>
                            {{ $t('errorConnectingToARE') }} {{ '(' + areService.getRestURL(input.areURL) + ')' }}
                        </span>
                    </div>
                    <div class="srow">
                        <span v-for="(eventName, index) in input.eventNames" class="nine columns offset-by-three">
                            <b>{{ $t('event') }}</b> {{ formatAreEvent(eventName) }} <button
                                @click="removeAREEvent(input, index)" :title="$t('delete')"
                                style="margin-left: 1em; padding: 0 0.5em"><i class="fas fa-trash"></i></button>
                        </span>
                    </div>
                </div>
            </li>
        </ul>
    </div>
</template>

<script>
import Vue from 'vue';
import { i18nService } from "../../js/service/i18nService";
import { InputConfig } from "../../js/model/InputConfig";
import { InputEventKey } from "../../js/model/InputEventKey";
import { InputEventARE } from "../../js/model/InputEventARE";
import { inputEventHandler } from "../../js/input/inputEventHandler";
import Accordion from "./accordion.vue";
import { areService } from "../../js/service/areService";

export default {
    components: { Accordion },
    props: {
        value: Array,
        inputLabels: Array,
        canAdd: Boolean,
        maxElements: Number,
        errorInputs: Array,
        minInputs: Number,
        maxInputs: Number
    },
    watch: {
        value: {
            handler: function (newValue) {
                this.initWithValue(newValue);
            },
            deep: true
        }
    },
    data() {
        return {
            inputs: [],
            inputEventTypes: InputConfig.getInputEventTypes(),
            InputEventKey: InputEventKey,
            InputEventARE: InputEventARE,
            InputConfig: InputConfig,
            keyRecording: {},
            areRecording: {},
            areError: {},
            lastEmitValue: null,
            localEventHandler: inputEventHandler.instance(),
            lastInitTime: null,
            areService: areService
        }
    },
    methods: {
        typeChange(elementIndex, type) {
            let currentElement = this.inputs[elementIndex];
            let emptyElements = this.inputs.filter(e => !e.modelName);
            if (!type) {
                currentElement.modelName = "";
                if (this.minInputs && this.inputs.length > this.minInputs && emptyElements.length >= 1) {
                    this.inputs.splice(elementIndex, 1);
                }
                this.modelChanged();
                return;
            }
            let newElement = InputConfig.getInputEventInstance(type, { label: currentElement.label });
            Vue.set(this.inputs, elementIndex, JSON.parse(JSON.stringify(newElement)));
            if (this.maxInputs && this.inputs.length < this.maxInputs && emptyElements.length <= 1) {
                this.addInput();
            }
            this.modelChanged();
        },
        recordKey(input, index) {
            let thiz = this;
            let recordingID = input.label + index;
            if (thiz.keyRecording[recordingID]) {
                Vue.set(thiz.keyRecording, recordingID, false);
                thiz.localEventHandler.destroy();
                return;
            }

            Vue.set(thiz.keyRecording, recordingID, true);
            thiz.localEventHandler.destroy();
            thiz.localEventHandler = inputEventHandler.instance();
            thiz.localEventHandler.onAnyKey((keyCode, keyName, event) => {
                event.preventDefault();
                thiz.localEventHandler.destroy();
                input.keyCode = keyCode;
                input.keyName = keyName;
                Object.assign(input, {
                    repeat: 1,
                    timeout: 0,
                    holdDuration: 0
                });
                Vue.set(thiz.keyRecording, recordingID, false);
                thiz.modelChanged();
            });
            thiz.localEventHandler.startListening();
        },
        recordAREEvent(input, index) {
            let thiz = this;
            let recordingID = input.label + index;
            thiz.areError[recordingID] = false;
            if (thiz.keyRecording[recordingID]) {
                endRecord();
                return;
            }

            Vue.set(thiz.keyRecording, recordingID, true);
            areService.unsubscribeEvents();
            let timeoutHandler = null;
            areService.subscribeEvents(input.areURL, (data) => {
                if (!timeoutHandler) {
                    timeoutHandler = setTimeout(() => {
                        Vue.set(thiz.keyRecording, recordingID, false);
                        areService.unsubscribeEvents();
                        thiz.modelChanged();
                    }, 1000);
                }
                input.eventNames.push(data);
            }, () => {
                thiz.areError[recordingID] = true;
                endRecord();
            });

            function endRecord() {
                Vue.set(thiz.keyRecording, recordingID, false);
                areService.unsubscribeEvents();
            }
        },
        removeAREEvent(input, index) {
            input.eventNames.splice(index, 1);
            this.modelChanged();
        },
        formatAreEvent(eventString) {
            let eventObject = JSON.parse(eventString);
            return eventObject.channelId + " -> " + eventObject.targetComponentId;
        },
        changedAreURL(input) {
            if (!input.areURL) {
                return;
            }
            input.areURL = areService.getRestURL(input.areURL);
        },
        modelChanged() {
            let passInputs = this.inputs.filter(input => {
                if (!input.modelName) {
                    return false;
                }
                let instance = InputConfig.getInputEventInstance(input.modelName, input);
                return instance.isValid();
            });
            let emitValue = JSON.parse(JSON.stringify(passInputs));
            if (JSON.stringify(emitValue) !== JSON.stringify(this.lastEmitValue)) {
                this.lastInitTime = new Date().getTime();
                this.$emit('input', emitValue);
                this.lastEmitValue = emitValue;
            }
        },
        addInput(count) {
            count = count || 1;
            for (let i = 0; i < count; i++) {
                let newInput = JSON.parse(JSON.stringify(new InputEventKey({ label: InputConfig.GENERAL_INPUT })));
                newInput.modelName = null;
                this.inputs.push(newInput);
            }
        },
        initWithValue(value) {
            if (this.lastInitTime && new Date().getTime() - this.lastInitTime < 500) {
                //TODO this is not the most beautiful way to prevent self-caused model reload
                return;
            }
            this.lastInitTime = new Date().getTime();
            let originalValue = JSON.parse(JSON.stringify(value)) || [];
            this.lastEmitValue = JSON.parse(JSON.stringify(originalValue));
            if (this.inputLabels) {
                let existingLabels = originalValue.map(input => input.label);
                let missingLabels = this.inputLabels.filter(label => existingLabels.indexOf(label) === -1);
                missingLabels.forEach(label => {
                    let inputEvent = new InputEventARE({ label: label });
                    inputEvent.modelName = "";
                    originalValue.push(inputEvent);
                });
                originalValue.sort((a, b) => this.inputLabels.indexOf(a.label) - this.inputLabels.indexOf(b.label));
            }
            this.inputs = JSON.parse(JSON.stringify(originalValue));
            let emptyElements = this.inputs.filter(e => !e.modelName);
            if (this.maxInputs && this.inputs.length < this.maxInputs && emptyElements.length <= 1) {
                this.addInput();
            }
            if (this.minInputs && this.inputs.length < this.minInputs) {
                this.addInput(this.minInputs - this.inputs.length);
            }
        }
    },
    mounted() {
        this.initWithValue(this.value);
    }
}
</script>

<style scoped>
ul {
    list-style: none;
}

ul li:first-child {
    margin-top: 1em !important;
}

li {
    margin-bottom: 2em;
    margin-top: 2em;
}

.srow.nomargin {
    margin: 0;
}

.input-label {
    font-weight: bold;
    margin-bottom: 0.7em;
}

@media (max-width: 850px) {
    li {
        outline: 1px solid lightgray;
        padding: 0.5em;
    }
}
</style>