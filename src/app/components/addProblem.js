// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

// Configuration
import { config } from "Conf/defaultOptions.js";

// Common
import { saveState } from "Common/save.js";
import { catchError } from "Common/error.js";
import { addToProblemList } from "Common/condition.js";

// Shared
import { log } from "Shared/log.js";

// Images
import checkMark from "Src/images/checkMark.png";

function AddProblem({state, dispatch}) {

    function handleChange() {
        try {
            if (!("saveState" in config)) {
                dispatch({type: "addProblem"});
                setTimeout(() => {
                    config.saveState = saveState(state).then(() => {
                        try {
                            delete config.saveState;
                            addToProblemList(state).then(response => {
                                try {
                                    // If the request was successful, but the action (e.g. adding the problem) failed
                                    // We need to fail the application since we haven't provided more nuanced error handling
                                    if (!response.data.Success) {
                                        state.problem = {};
                                        setTimeout(() => {
                                            config.saveState = saveState(state).then(() => {
                                                try {
                                                    delete config.saveState;
                                                } catch (error) { catchError(error); }
                                            }).catch(catchError);
                                        });
                                        catchError(JSON.stringify(response.data));
                                    } else {
                                        log("Added Secondhand Smoke Exposure to the problem list", "info");
                                    }
                                } catch (error) { catchError(error); }
                            }).catch(catchError);
                        } catch (error) { catchError(error); }
                    }).catch(catchError);
                });
            }
        } catch (error) { catchError(error); }
    }

    try {
        var problemSummary;
        if (state.problem.added) {
               problemSummary = (
                   <>
                       <img src={checkMark} width="35px" />
                       <p>Secondhand smoke exposure added to the problem list on {state.problem.addDate}</p>
                   </>
               );
           }
        else if (state.problem.exists) {
            problemSummary = (
                <>
                    <img src={checkMark} width="35px" />
                    <p>Secondhand smoke exposure already on the problem list</p>
                </>
            );
        } else {
            problemSummary = (
                <>
                    <button type="button" onClick={handleChange}>Add</button>
                    <p>Secondhand smoke exposure to the problem list</p>
                </>
            );
        }
    } catch (error) { catchError(error); }

    return (
        <>
            <hr/>
            <div id="ecease_add_problem">
                {problemSummary}
            </div>
        </>
    );
}

AddProblem.propTypes = {
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

export default AddProblem;