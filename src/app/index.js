// Required for TippyJS to work in IE
import find from 'core-js/features/array/find';

// Polyfill required React features
import "react-app-polyfill/ie9";

// React
import React from "react";
import ReactDOM from "react-dom";

// Common
import { buildAppContext, buildRTF } from "Common/context.js";
import { getAccessToken } from "Common/auth.js";
import { getActiveConditions, problemListListener } from "Common/condition.js";
import { saveState } from "Common/save.js";
import { catchError } from "Common/error.js";
import { sendPrograms } from "Common/treatments.js";

// Shared
import { log } from "Shared/log.js";
import { failSplash } from "Shared/failSplash.js";
import { addEHRListener, ehrHandshake } from "Shared/ehrComms.js";
import { setTokenResponse, tokenResponse } from "Shared/token.js";
import { getAndSetState, saveSessionState, state, stateKey, setStateKey } from "Shared/session.js";
import { getUrlParameter } from "Shared/url.js";
import subscriptions from "Shared/subscriptions.js";

import { getProgramList } from "Common/form.js";
import { ajaxCalls, request } from "Shared/http.js";

// Components
import App from "Components/app.js";
import ErrorBoundary from "Components/error.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

// Admin based config
import admin from "Conf/admin.js";

// Style
import "App/css/index.scss";

try {
    // Extract URL parameters to complete auth
    setStateKey(getUrlParameter("state"));

    // If key is not present in the URL, abort the flow
    if (!stateKey) {
        // Invalid key parameter return an error
        throw new Error("Invalid state query parameter");
    }

    // Extract state from session storage
    getAndSetState(stateKey);

    // If state can't be found, abort the flow
    if (!state) {
        // Invalid key parameter return an error
        throw new Error("Failed to obtain application state");
    }

    // Store auth code in state to help with launch token reuse flows
    // and save to session. This is currently logged in launch.js to
    // determine if more effort needs to be placed here.
    state.authCode = getUrlParameter("code");
    saveSessionState(stateKey, state);

    // Initialize callbacks
    var callbacks = {
        closeCB,
        logFn: log,
        "Epic.Clinical.ProblemChanged": problemListListener
    };

    // Establish EHR event listener
    addEHRListener(callbacks);

    // It's possible the launch subscription will fail
    // but continue with application launch with decreased functionality
    // TODO - Could think about setting up a method to retry a few times
    ehrHandshake(subscriptions);

    // Check if an access token exists
    if (state.tokenResponse) {
        log("Access token exists", "info");

        // Update the token response with the previous state
        setTokenResponse(state.tokenResponse);

        // Initialize app
        entry();
    } else {
        getAccessToken(state.authCode).then(function() {
            try {
                entry();
            } catch (error) {
               failSplash();
               log(error.stack, "error");
            }
        });
    }
} catch (error) {
   log(error.stack, "error");
}

function closeCB() {
    // Remove sessionStorage - it is shared across the entire
    // EHR session so it is important to remove it when finished
    sessionStorage.removeItem(state.launchToken);
    sessionStorage.removeItem(stateKey);
}

function entry() {
    try {
        // Check for failures
        if (!config.failure) {
            // Cancel any outstanding requests
            // This is done for quick reboots of the EHR page
            for (const requestId in ajaxCalls) {
                ajaxCalls[requestId].cancel();
                delete ajaxCalls[requestId];
            }
        }

        // Obtain data from the EHR
        getAppState().then(() => {
            try {
                // Check if a previous state existed. Only use previous state if the
                // survey was assigned this visit.
                if (config.prevState && config.prevState.assigned) {
                    // If the user hasn't added secondhand smoke exposure, check
                    // if it was added to the problem list some other way.
                    if (!config.data.problem || !config.data.problem.added) {
                        getActiveConditions().then(() => {
                            try {
                                build();
                            } catch (error) { catchError(error); }
                        }).catch(catchError);
                    } else {
                        build();
                    }
                } else {
                    // Get survey details, which includes whether or not the survey
                    // was assigned during this visit and the latest date the survey was
                    // completed
                    // It's possible that some state was set as a result of the immediate
                    // response to the survey completion. Check for this in getRemainingData()
                    getSurveyInfo().then(() => {
                        try {
                            // If the survey was assigned during the current visit
                            // get the answers and problem list to build the app
                            if (config.data.assigned) {
                                getRemainingData().then(() => {
                                    try {
                                        build();
                                    } catch (error) { catchError(error); }
                                }).catch(catchError);
                            } else if (config.lastSurveyCSN){
                                // Survey was completed in an earlier encounter
                                // Pull these results and display them.
                                getPreviousState().then(() => {
                                    try {
                                        build();
                                    } catch (error) { catchError(error); }
                                });
                            } else {
                                build();
                            }
                        } catch (error) { catchError(error); }
                    }).catch(catchError);
                }
            } catch (error) { catchError(error); }
        }).catch(catchError);
    } catch (error) { catchError(error); }
}

function getAppState() {
    // Get host from session storage
    var host = sessionStorage.getItem("host");

    // Use host to determine OID string
    var oid = admin.productionHosts.indexOf(host) > -1 ? admin.oid.observation.production : admin.oid.observation.default;

    // Return ajax request
    return request(true, "FHIR/R4/Observation", {
        category: "smartdata",
        patient: tokenResponse.patient,
        focus: tokenResponse.encounter,
        code: oid + "|" + config.ehrStoreIds.appData
    }).then(response => {
        try {
            if (response.data.total == 1) {
                config.data = JSON.parse(response.data.entry[0].resource.component.map(line => line.valueString).join(""));

                // Intialize "prevState" with the current app data
                config.prevState = {...config.data};
            }
        } catch (error) { catchError(error); }
    });
}

// This gets all of a patient's completed surveys
// Could think about limiting to a certain number
// This is mainly to get the CSN from the previous survey responses
// which will be used to obtain the responses from the getSurveyResponses function
function getSurveyInfo() {
    return request(true, "FHIR/R4/QuestionnaireResponse", {
        patient: tokenResponse.patient,
        _count: 50
    }).then(response => {
        try {
            if (response.data.total == 0) {
                return;
            }
            // Using "some" to exit the loop early if an appropriate questionnaire
            // was identified.
            response.data.entry.some(entry => {
                // Exit early if we already have the data we need
                if (config.data.assigned || config.lastSurveyCSN) {
                    return true;
                }

                // Ensure the questionnaire was completed
                if (entry.resource.status != "completed") {
                    return;
                }

                // Verify an item field exists then loop on it to retrieve answers
                if (!entry.resource.item) {
                    return;
                }
                entry.resource.item.some((item, index) => {
                    var linkId = item.linkId.split("|");
                    if (linkId.length != 3) {
                        log("Invalid questionnaire item: " + JSON.stringify(entry.resource), "error");
                        return;
                    }
                    if (index == 0 && config.qnrId.indexOf(linkId[0]) < 0) {
                        return true;
                    }

                    // Check for tobacco use response
                    if (linkId[1] == config.tobaccoUseQuestion) {
                        // Set the date the survey was completed
                        config.data.dateCompleted = new Date(entry.resource.authored).toLocaleDateString().replace(/[^\d/]/g, "");
                        // Deteremine if we are in the encounter in which the questionnaire was assigned
                        if (entry.resource.encounter.identifier.value == tokenResponse.csn) {
                            config.data.assigned = true;
                        } else {
                            // Survey was completed at another visit. Save a reference to the CSN
                            // so we can pull the historical data
                            config.lastSurveyCSN = entry.resource.encounter.identifier.value;
                        }
                        return true;
                    }
                });
            });
        } catch (error) { catchError(error); }
    });
}

function getRemainingData() {
    // Build up a list of SDEs and prepend the OID using the observation.search API
    var smartDataIDs = [];
    config.ehrStoreIds.questionnaire.forEach(v => {
        smartDataIDs.push({
            ID: v,
            Type: "SDI"
        });
    });
    var deferreds = [];
    deferreds.push(
        request(true, "epic/2013/Clinical/Utility/GETSMARTDATAVALUES/SmartData/Values", {},
            {
                ContextName: "Encounter",
                EntityID: tokenResponse.patient,
                EntityIDType: "FHIR",
                ContactID: tokenResponse.csn,
                ContactIDType: "CSN",
                SmartDataIDs: smartDataIDs
            }, "POST", {"Content-Type": "application/json"}
        ).then((response) => {
            try {
                // Build context object
                config.data = {...config.data, ...buildAppContext(response.data)};
                // Check for tobacco use
                if ([1, 2].indexOf(config.data.tobaccoUse) >= 0) {
                    // Survey was assigned, completed, and identified a tobacco user
                    // We want to show the treatment options
                    config.data.showFullView = true;
                    config.showAddProblem = true;
                }
            } catch (error) { catchError(error); }
        }),
        getActiveConditions()
    );
    return Promise.all(deferreds);
}

function getPreviousState() {
    return request(true, "epic/2013/Clinical/Utility/GETSMARTDATAVALUES/SmartData/Values", {},
        {
            ContextName: "Encounter",
            EntityID: tokenResponse.patient,
            EntityIDType: "FHIR",
            ContactID: config.lastSurveyCSN,
            ContactIDType: "CSN",
            SmartDataIDs: [
                {
                    ID: config.ehrStoreIds.appData,
                    Type: "SDI"
                }
            ]
        }, "POST", {"Content-Type": "application/json"}
    ).then((response) => {
        try {
            // No historical data for this patient
            // TODO - This line may be unnecessary
            if (response.data.SmartDataValues[0].Values.length == 0) {
                return;
            }
            // Extend app config with subset of the historical data
            var obj = JSON.parse(response.data.SmartDataValues[0].Values.join(""));
            config.data = {
                ...config.data,
                respondent: obj.respondent,
                services: obj.services,
                tobaccoUse: obj.tobaccoUse
            };
        } catch (error) { catchError(error); }
    });
}

// Finalize configuration object, save data, and send treatments (if applicable)
function build() {
    // Check if we are in a failed state and return
    // all failures are handled by "catchError", which calls out to
    // "failureSplash" so we shouldn't need to add an additional call
    // to update the UI
    if (config.failure) {
        return;
    }

    // Always show the base application during the initial load
    config.data.ui = {
        overview: true,
        documentation: true,
        treatments: true,
        discussed: !!config.data.discussed,
        addProblem: [1, 2, 3].indexOf(config.data.tobaccoUse) >= 0, // Only show problem option if someone smokes
        tips: false,
        info: false,
        docHelp: false,
        caregiverInfo: false
    };

    // Initialize a list of programs to send out during the initial load
    var programs = [];

    // Check to see if the application should show the additional information
    if (config.data.showFullView) {

        // Only send immediately if this is the first time we are loading
        if (!config.data.addingInfo) {
            // Update state and get a list of programs to send
            programs = getProgramList(config.data);
        }

        // Configure treatment options
        config.treatmentList = config.treatmentList.filter((v) => {
            if (config.data.services[v.id]) {
                return true;
            } else {
                delete config.treatmentConfig[v.id];
                return false;
            }
        });
    }

    // Always try to update RTF
    buildRTF(config.data);

    // Only save data if survey was assigned. This helps to avoid the corruption of data
    // from previous surveys with the current survey, particularly if there was an error
    // saving data as part of the CDS Hooks service.
    if (config.data.assigned) {
        saveState(config.data).then(() => {
            try {
                // TODO - After this is in place for a week, this aspect of the code
                // can be removed as a result of the change to responding immediately
                // to questionnaire completion
                // If we are in full view mode, send any preselected programs
                if (config.data.showFullView && programs.length > 0) {
                    // This generates a deferred, but we don't wait for the response
                    // since errors will be handled externally.
                    sendPrograms(programs, config.data);
                }
                // Render
                render();
            } catch (error) { catchError(error); }
        }).catch(catchError);
    } else {
        // If data isn't avaialable, don't save data and render immediately
        // which will display a splash message of "No data available from the past 12 months."
        render();
    }
}

// Entry point to react application
function render() {
    // Display application
    const element = (
        <ErrorBoundary>
            <App init={config.data} />
        </ErrorBoundary>
    );

    // Check to make sure target container is a DOM element
    var domElem = document.getElementById("ecease_start");
    if (domElem !== null) {
        ReactDOM.render(
            element,
            domElem
        );

        if (!config.failure) {
            var viewType;
            if (config.data.assigned) {
                if (config.data.tobaccoUse) {
                    viewType = config.data.showFullView ? "Full" : "Summary";
                } else if (config.data.respondent) {
                    viewType = "Patient completed survey";
                } else {
                    log("Incomplete survey load", "error");
                    viewType = "Incomplete survey";
                }
            } else {
                viewType = "Historical";
            }
            log(viewType + " eCEASE Clinician Facing Tool displayed", "info");
        }
    } else {
        log("eCEASE DOM element not available", "error");
    }
}