// Polyfill JS features
import objectEntries from 'core-js-pure/features/object/entries';

// Polyfill required React features
import "react-app-polyfill/ie9";

import React, { useEffect, useReducer, useRef } from 'react';
import PropTypes from 'prop-types';

// Common
import { catchError } from "Common/error.js";

// Shared
import { log } from "Shared/log.js";

// Components
import ErrorBoundary from "Components/error.js";
import Overview from "Components/overview.js";
import TreatmentPane from "Components/treatmentPane.js";
import Documentation from "Components/documentation.js";
import Discussed from "Components/discussed.js";
import Tips from "Components/tips.js";
import Info from "Components/info.js";
import DocHelp from "Components/docHelp.js";
import CaregiverInfo from "Components/caregiverInfo.js";
import AddProblem from "Components/addProblem.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

// Images
import logo from "Src/images/logo.png";

function reducer(state, action) {
    switch (action.type) {
        case "toggleTips":
            if (!state.ui.tips) {
                log("Viewing tips page", "info");
            }
            toggleApp(state);
            state.ui.tips = !state.ui.tips;
            break;
        case "toggleInfo":
            if (!state.ui.info) {
                log("Viewing treatment information page", "info");
            }
            toggleApp(state);
            state.ui.info = !state.ui.info;
            break;
        case "toggleDocHelp":
            if (!state.ui.docHelp) {
                log("Viewing documentation help page", "info");
            }
            toggleApp(state);
            state.ui.docHelp = !state.ui.docHelp;
            break;
        case "toggleService":
            state.services[action.service].selected = !state.services[action.service].selected;
            log("Toggle service: " + action.service + ". Value: " + !!state.services[action.service].selected, "info");
            // Check to see if information still needs to be provided
            // TODO - Could think of a better method to handle this
            // or bundle the below code into a function to handle multiple use cases.
            state.addingInfo = false;
            for (const [k, v] of objectEntries(state.services)) {
                if (v.selected && !v.sent && config.treatmentConfig[k]) {
                    state.addingInfo = true;
                }
            }
            break;
        case "setDiscussed":
            state.discussed = action.value;
            state.discussedDate = (new Date()).toLocaleDateString().replace(/[^\d/]/g, "");
            state.ui.discussed = true;
            log("Set discussed: " + action.value, "info");
            break;
        case "formUpdate":
            // Validation occurs in the "onChange" handler
            state.caregiverInfo[action.field].value = action.value;
            break;
        case "lockFields":
            // Prevents fields from showing up again when new services are selected
            for (var field in action.value) {
                state.caregiverInfo[field].disabled = true;
            }
            state.addingInfo = false;
            break;
        case "addProblem":
            state.problem.added = true;
            state.problem.addDate = (new Date()).toLocaleDateString().replace(/[^\d/]/g, "");
            break;
    }
    return { ...state };
}

function toggleApp(state) {
    // Set variable for easier access
    var ui = state.ui;

    // Always toggle the overview since this will always show
    ui.overview = !ui.overview;

    // If the rest of the application is hidden, return so we
    // don't inadvertantly show other aspects of the application
    if (!state.showFullView) {
        return;
    }

    // Toggle the remaining pieces of the application
    ui.discussed = !ui.discussed;
    ui.treatments = !ui.treatments;
    ui.documentation = !ui.documentation;
    ui.addProblem = !ui.addProblem;

    // Only toggle the caregiver info component if it is viewable
    ui.caregiverInfo = ui.caregiverInfo ? !ui.caregiverInfo : ui.caregiverInfo;
    return;
}

// Function to store previous state
function usePrevious(value) {
    const ref = useRef();
    useEffect(() => {
        ref.current = value;
    });
    return ref.current;
}

function App({ init }) {
    // Set initial state based on data from the EHR
    const [state, dispatch] = useReducer(reducer, init);

    try {

        // Prep object to store state
        var appData = JSON.parse(JSON.stringify(state));

        // Remove unnecessary keys
        delete appData.failure;
        delete appData.ui;

        // Store previous state
        config.prevState = usePrevious(appData);

        if (state.failure) {
            return (
                <ErrorBoundary hasError={true} />
            );
        }

        // Determine if caregiver information should be visible, which should only be visible
        // when the treatments section is visible.
        if (state.ui.treatments && state.showFullView) {
            // Only show caregiver information if a program has been selected
            // and not already sent
            state.ui.caregiverInfo = false;
            for (const [k, v] of objectEntries(state.services)) {
                if (v.selected && !v.sent && config.treatmentConfig[k]) {
                    state.ui.caregiverInfo = true;
                }
            }
        }
    } catch (error) { catchError(error); }

    if (!state.respondent && !state.assigned) {
        return <p>No data available from the past 12 months.</p>;
    } else if (state.respondent == "Self (no caregivers present)") {
        return <p>Caregiver did not complete the questionnaire. No data is available.</p>;
    } else {
        return (
            <>
                <div id="ecease_container" className="ecease_flex">
                    <div id="ecease_image_container">
                        <img src={logo} style={{position: "relative", left: "7px", width: "55px"}}/>
                    </div>
                    <div id="ecease_information">
                        {state.ui.overview && <Overview state={state} dispatch={dispatch} />}
                        {state.showFullView
                            && (
                                <>
                                    {state.ui.treatments && <TreatmentPane state={state} dispatch={dispatch} />}
                                    {state.ui.caregiverInfo && <CaregiverInfo state={state} dispatch={dispatch} />}
                                    {state.ui.documentation && <Documentation state={state} dispatch={dispatch} />}
                                    {state.ui.discussed && <Discussed state={state} />}
                                    {state.ui.addProblem && <AddProblem state={state} dispatch={dispatch} />}
                                    {state.ui.docHelp && <DocHelp dispatch={dispatch} />}
                                </>
                            )
                        }
                        {state.ui.info && <Info dispatch={dispatch} />}
                        {state.ui.tips && <Tips dispatch={dispatch} />}
                    </div>
                </div>
            </>
        );
    }
}

App.propTypes = {
    init: PropTypes.object.isRequired
};

export default App;