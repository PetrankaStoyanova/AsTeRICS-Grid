import {areService} from "./areService";
import {dataService} from "./data/dataService";
import {speechService} from "./speechService";
import {collectElementService} from "./collectElementService";
import {predictionService} from "./predictionService";
import {Router} from "./../router";
import {GridElement} from "./../model/GridElement";
import {constants} from "../util/constants";
import {GridActionCollectElement} from "../model/GridActionCollectElement";
import {webradioService} from "./webradioService";
import {i18nService} from "./i18nService";
import {youtubeService} from "./youtubeService";

let actionService = {};

actionService.doAction = function (gridId, gridElementId) {
    if (!gridId || !gridElementId) {
        return;
    }
    dataService.getGridElement(gridId, gridElementId).then(gridElement => {
        log.debug('do actions for: ' + i18nService.getTranslation(gridElement.label) + ', ' + gridElementId);
        switch (gridElement.type) {
            case GridElement.ELEMENT_TYPE_PREDICTION: {
                predictionService.doAction(gridElement.id);
                break;
            }
        }
        doActions(gridElement, gridId);
        $(window).trigger(constants.ELEMENT_EVENT_ID, [gridElement]);
    });
};

actionService.testAction = function (gridElement, action, gridData) {
    doAction(gridElement, action, gridData.id, gridData);
};

function doActions(gridElement, gridId) {
    gridElement.actions.forEach(action => {
        doAction(gridElement, action, gridId);
    });
}

function doAction(gridElement, action, gridId, gridData) {
    switch (action.modelName) {
        case 'GridActionSpeak':
            log.debug('action speak');
            speechService.speak(gridElement.label, action.speakLanguage);
            break;
        case 'GridActionSpeakCustom':
            log.debug('action speak custom');
            if (action.speakText) {
                speechService.speak(action.speakText, action.speakLanguage);
            }
            break;
        case 'GridActionNavigate':
            log.debug('action navigate');
            if (action.toLastGrid) {
                Router.toLastGrid();
            } else if (Router.isOnEditPage()) {
                Router.toEditGrid(action.toGridId);
            } else {
                Router.toGrid(action.toGridId);
            }
            break;
        case 'GridActionARE':
            log.debug('action are');
            if (gridData) {
                doAREAction(action, gridData)
            } else {
                dataService.getGrid(gridId).then(grid => {
                    doAREAction(action, grid);
                });
            }
            break;
        case 'GridActionPredict':
            log.debug('action predict');
            predictionService.predict(i18nService.getTranslation(gridElement.label), action.dictionaryKey);
            break;
        case 'GridActionCollectElement':
            log.debug('action collect element');
            collectElementService.doCollectElementActions(action.action);
            break;
        case 'GridActionWebradio':
            webradioService.doAction(gridId, action);
            break;
        case 'GridActionYoutube':
            youtubeService.doAction(action);
            break;
        case 'GridActionChangeLang':
            i18nService.setLanguage(action.language);
            break;
        case 'GridActionOpenWebpage':
            let tab = window.open(action.openURL, '_blank');
            if (action.timeoutSeconds > 0) {
                setTimeout(() => {
                    tab.close();
                }, action.timeoutSeconds * 1000);
            }
            break;
        
        case 'GridActionTurnOnShelly':
            if (action.turn === "On") {
                console.log("Turn On")
                $.get(action.httpHttps + "://" + action.shellyIP + "/relay/0?turn=on");     
            }   
            if (action.turn === "Off") {
                console.log("Turn Off")
                $.get(action.httpHttps + "://" + action.shellyIP + "/relay/0?turn=off");      
            }
             if (action.turn === "Toggle") {
                console.log("Toggle")
                $.get(action.httpHttps + "://" + action.shellyIP + "/relay/0?turn=toggle");      
            }
            break;
        
        case 'GridActionKeyValueRequest':

            if (action.format === "Parameters")
            {
                if (action.method === "POST") {
                    console.log("do POST request")
                    $.post(action.urlRequest + "?" + action.keyParameter + "=" + action.valueParameter).then(data => {
                    console.log(data);
                    });      
                }   
                if (action.method === "GET") {
                  console.log("do GET request")
                  $.get(action.urlRequest + "?" + action.keyParameter + "=" + action.valueParameter).then(data => {                
                    console.log(data);
                    });      
                }
            }
            
            if (action.format === "Body")
            {
                $.ajax({
                url: action.urlRequest,
                type: action.method,
                data: action.bodyData,
                contentType:"text/plain",
                dataType:"text/plain"
                }).then(data => { console.log(data);
                });           
            }
            break;    
   
    }
}

function doAREAction(action, gridData) {
    if (!action.componentId) {
        return;
    }
    let modelBase64 = gridData.getAdditionalFile(action.areModelGridFileName).dataBase64;
    areService.uploadAndStartModel(modelBase64, action.areURL, action.areModelGridFileName).then(() => {
        if (action.dataPortId && action.dataPortSendData) {
            areService.sendDataToInputPort(action.componentId, action.dataPortId, action.dataPortSendData, action.areURL);
        }
        if (action.eventPortId) {
            areService.triggerEvent(action.componentId, action.eventPortId, action.areURL);
        }
    });
}

export {actionService};