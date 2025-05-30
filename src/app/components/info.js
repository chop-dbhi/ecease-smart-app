// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

// Common
import { catchError } from "Common/error.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

function Info({dispatch}) {
    try {
        var programInfo = [];
        config.treatmentList.forEach((v, i) => {
            if (v.info !== undefined) {
                programInfo.push(
                    <div key={"ecease_info_" + i}>
                        <p className="ecease_h4">{v.info.title}</p>
                        {v.info.body}
                    </div>
                );
            }
        });
    } catch (error) { catchError(error); }

    return (
        <div id="ecease_info">
            <div>
                <p className="ecease_h4">The caregiver completed a questionnaire describing the benefits to child and caregiver of quitting smoking and was offered three forms of assistance&#58;</p>
            </div>
            {programInfo}
            <button style={{marginTop: "-15px"}} type="button" onClick={() => dispatch({type: "toggleInfo"})}>Close</button>
        </div>
    );
}

Info.propTypes = {
    dispatch: PropTypes.func.isRequired
};

export default Info;