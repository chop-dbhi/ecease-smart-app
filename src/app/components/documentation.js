// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

// Configuration
import { config } from "Conf/defaultOptions.js";

// Common
import { saveState } from "Common/save.js";
import { catchError } from "Common/error.js";
import { buildRTF } from "Common/context.js";

// Images
import stopSign from "Src/images/stopSign.png";
import checkMark from "Src/images/checkMark.png";

function Documentation({state, dispatch}) {

    function handleChange(e) {
        try {
            if (!("saveState" in config)) {
                dispatch({type: "setDiscussed", value: e.target.value});
                setTimeout(() => {
                    config.saveState = saveState(state).then(() => {
                        try {
                            delete config.saveState;
                        } catch (error) { catchError(error); }
                    }).catch(catchError);
                    buildRTF(state);
                });
            }
        } catch (error) { catchError(error); }
    }

    return (
        <>
            <hr/>
            <div id="ecease_documentation">
                <div id="ecease_documenation_header">
                    <img src={(state.discussed ? checkMark : stopSign)} width="35px" />
                    <p className="ecease_h3" style={{display: "inline-block"}}>Counseling and billing <a href="#" onClick={() => dispatch({type: "toggleDocHelp"})}>More info</a></p>
                </div>
                <div id="ecease_documentation_options">
                    <input type="radio" id="ecease_discuss_yes" value="yes" checked={state.discussed == "yes"} onChange={handleChange} name="ecease_documentation_option" />
                    <label htmlFor="ecease_discuss_yes">Counseling provided</label>
                    <input type="radio" id="ecease_discuss_no" value="no" checked={state.discussed == "no"} onChange={handleChange} name="ecease_documentation_option" />
                    <label htmlFor="ecease_discuss_no">Counseling NOT provided</label>
                </div>
            </div>
        </>
    );
}

Documentation.propTypes = {
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

export default Documentation;