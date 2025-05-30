// Polyfill JS features
import objectValues from 'core-js-pure/features/object/values';

// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

// Common
import { catchError } from "Common/error.js";

function Discussed({state}) {
    try {
        var serviceSent = false;
        objectValues(state.services).forEach((v) => {
            if (v.sent) {
                serviceSent = true;
            }
        });

        var summary;
        if (state.discussed == "yes") {
            summary = (
                <>
                    <li>Counseled {state.respondent} on {state.discussedDate}</li>
                    { serviceSent ?
                        <>
                        <li>Secondhand smoke exposure discussion, smoking status, and selected treatments added to note.</li>
                        <li>Discussion is billable.</li>
                        </> :
                        <>
                            <li>Secondhand smoke exposure discussion and smoking status added to note.</li>
                            <li>No billing.</li>
                        </>
                    }
                </>
            );
        } else if (state.discussed == "no"){
            summary = (
                <>
                    { serviceSent ?
                        <>
                            <li>Smoking status and selected treatments added to note.</li>
                            <li>No billing.</li>
                        </> :
                        <>
                            <li>Smoking status added to note.</li>
                            <li>No billing.</li>
                        </>
                    }
                </>
            );
        }
    } catch (error) { catchError(error); }

    return (
        <div id="ecease_discussed">
            <ul>
                {summary}
            </ul>
        </div>
    );
}

Discussed.propTypes = {
    state: PropTypes.object.isRequired
};

export default Discussed;