// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';
import Tippy from '@tippyjs/react/headless';

// Common
import { saveState } from "Common/save.js";
import { catchError } from "Common/error.js";

// Components
import { tippyStore } from "Components/tooltip.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

// Images
import tooltipIcon from "Src/images/tooltipIcon.png";

function TreatmentPane({ state, dispatch }) {

    function handleChange(e) {
        try {
            if (!("saveState" in config)) {
                dispatch({type: "toggleService", service: e.target.value});
                setTimeout(() => {
                    config.saveState = saveState(state).then(() => {
                        try {
                            delete config.saveState;
                        } catch (error) { catchError(error); }
                    }).catch(catchError);
                });
            }
        } catch (error) { catchError(error); }
    }
    
    try {
        var treatmentOptions = [];
        // Build list of treatment options based on the values in the config object
        config.treatmentList.forEach((v, i) => {
            treatmentOptions.push(
                <div key={"ecease_treatment_option_" + i} className="ecease_treatment_option">
                    <div className="ecease_treatment_checkbox" >
                        <input type="checkbox"
                            id={v.id}
                            name={v.id}
                            value={v.id}
                            disabled={state.services[v.id].sent}
                            checked={state.services[v.id].selected}
                            onChange={handleChange} />
                        <label htmlFor={v.id}>{v.label}</label>
                        { !!v.tooltip &&
                            <Tippy render={attrs => (
                            <div className="ecease_tooltip" id={"ecease_" + v.id + "_select_option"}tabIndex="-1" {...attrs}>
                                <div onClick={() => dispatch({type: "toggleInfo"})}>
                                    {v.tooltip}
                                </div>
                                <div id="ecease_arrow" data-popper-arrow></div>
                            </div>
                        )} plugins={[tippyStore]}>
                            <img src={tooltipIcon} style={{verticalAlign: "middle", margin: "0px" }} width="15px" />
                        </Tippy> }
                    </div>
                    { !!v.enrolled && state.services[v.id].sent &&
                        <div className="ecease_treatment_enrollment">
                            {v.enrolled.html}
                            { !!v.enrolled.tooltip &&
                                <Tippy render={attrs => (
                                    <div className="ecease_tooltip" id={"ecease_" + v.id + "_enrolled"} tabIndex="-1" {...attrs}>
                                        {v.enrolled.tooltip}
                                        <div id="ecease_arrow" data-popper-arrow></div>
                                    </div>
                                )} plugins={[tippyStore]}>
                                    <img src={tooltipIcon} style={{verticalAlign: "middle", margin: "0px" }} width="15px" />
                                </Tippy>
                            }
                        </div>
                    }
                </div>
            );
        });
    } catch (error) { catchError(error); }

    return (
        <>
            <hr/>
            <div id="ecease_treatment_options">
                <p className="ecease_h3">{state.respondent} Selected Treatment Options</p>
                <div id="ecease_treatment_selections">
                    {treatmentOptions}
                </div>
            </div>
        </>
    );
}

TreatmentPane.propTypes = {
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

export default TreatmentPane;