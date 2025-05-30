// Configuration
import { config } from "Conf/defaultOptions.js";

// Common
import { request } from "Shared/http.js";

// Shared
import { tokenResponse } from "Shared/token.js";

function saveData(data, key) {
    
    // Build request body
    var body = {
        "ContextName":"encounter",
        "EntityID":tokenResponse.patient,
        "EntityIDType":"FHIR",
        "ContactID":tokenResponse.csn,
        "ContactIDType":"CSN",
        "UserID": config.systemUserId,
        "UserIDType":"External",
        "Source":"Web Service",
        "SmartDataValues": [
            {
                "SmartDataID": key,
                "SmartDataIDType": "SDI",
                "Comments": [
                    "Value set from the eCEASE web application."
                ],
                "Values":[
                    data
                ]
            }
        ]
    };
    return request(true, "epic/2013/Clinical/Utility/SETSMARTDATAVALUES/SmartData/Values", {}, JSON.stringify(body), "PUT", {"Content-Type": "application/json"});
}

function saveState(state) {

        // Copy current state into new object
        var appData = {...state};
        delete appData.failure;
        delete appData.ui;

        // Check if the current state is the same as the current state
        if (JSON.stringify(appData) == JSON.stringify(config.prevState)) {
            return Promise.resolve(true);
        }

        // Update previous state
        config.prevState = {...appData};

        // Send request
        return saveData(JSON.stringify(appData), config.ehrStoreIds.appData);
}

export {
    saveData,
    saveState
};