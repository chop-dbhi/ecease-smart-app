// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

// Common
import { catchError } from "Common/error.js";
import { smokingStatus } from "Common/context.js";

// Shared
import { log } from "Shared/log.js";
import { executeAction } from "Shared/ehrComms.js";
import { tokenResponse } from "Shared/token.js";

function Overview({ state, dispatch }) {

    function viewSurvey() {
        log("View survey responses link clicked", "info");
        executeAction({
            action: "Epic.Clinical.Informatics.Web.LaunchActivity",
            args: {
                PatientID: tokenResponse.patient,
                ActivityKey: "QUESTIONNAIRE_REPORT"
            }
        });
    }

    try {
        var summary;
        if (state.tobaccoUse) {
            var smokingStatusText = smokingStatus(state);
            summary = (
                <>
                    <p>{state.respondent} completed Smoking Screener Survey on {state.dateCompleted} {state.assigned && (<> - <a href="#" onClick={viewSurvey}>View</a></>)}</p>
                    <p>{smokingStatusText}</p>
                    { (state.showFullView && (state.tobaccoUse == 2 || state.tobaccoUse ==  3)) && <p>Information added to AVS - <q>Helping others Quit Smoking</q></p> }
                </>
            );
        }
    } catch (error) { catchError(error); }

    return (
        <div id="ecease_overview" className="ecease_flex">
                <div id="ecease_overview_section" style={{width: "495px"}}>
                    {summary}
                </div>
                { (state.tobaccoUse && state.tobaccoUse != 4) &&
                    <div id="ecease_overview_section">
                        <p><a href="#" onClick={() => dispatch({type: "toggleTips"})}>Talking to parents</a></p>
                        <p><a href="#" onClick={() => dispatch({type: "toggleInfo"})}>Treatment information</a></p>
                    </div>
                }
        </div>
    );
}

Overview.propTypes = {
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

export default Overview;