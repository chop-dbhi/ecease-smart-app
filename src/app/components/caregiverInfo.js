// Polyfill required React features
import "react-app-polyfill/ie9";

import React, { useEffect } from "react";
import PropTypes from 'prop-types';

// Common
import { saveState } from "Common/save.js";
import { sendPrograms } from "Common/treatments.js";
import { fieldDisplay, formatDate, formatPhoneNumber, getProgramList } from "Common/form.js";
import { catchError } from "Common/error.js";
import { buildRTF } from "Common/context.js";

// Shared
import { log } from "Shared/log.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

var stateTimer;

function CaregiverInfo({state, dispatch}) {

    function submit() {
        try {
            log("Submit button clicked", "info");
            if (!("saveState" in config)) {
                // Locks fields that have already been filled out so they no longer appear
                // on any subsequent program selections.
                dispatch({type: "lockFields", value: displayFields});

                // Update state and get a list of programs to send
                var programs = getProgramList(state);

                // Clear any existing timeouts
                clearTimeout(stateTimer);
                // Save state and then send programs as necessary
                setTimeout(() => {
                    config.saveState = saveState(state).then(() => {
                        try {
                            delete config.saveState;
                            // Send the programs
                            sendPrograms(programs, state);
                        } catch (error) { catchError(error); }
                    }).catch(catchError);
                    buildRTF(state);
                });
            }
        } catch (error) { catchError(error); }
    }

    // Updates state and validates fields
    function handleChange(e) {
        try {
            var value = e.target.value;
            // Get current position of "caret"
            var start;
            // EHR browser creates an error on selectionStart for radio buttons
            try {
                start = e.target.selectionStart;
            } catch (error) {}
            var field = e.target.getAttribute("ecease_state");
            // Phone number formatting and validation
            if (field == "phone" || field == "mobile") {
                // Restrict input to 14 characters, which includes formatting
                if (value.length > 14) {
                    return;
                }

                // Format phone number and caret position
                [value, start] = formatPhoneNumber(value, start);

                // Updates state with new value
                dispatch({type: "formUpdate", field, value});
                // Moves caret to appropriate position
                setTimeout(() => e.target.setSelectionRange(start, start));
            // Date formatting and validation
            } else if (field == "dob") {
                // Rely on Date to determine date validity
                // Datepickers aren't well supported in IE and those that do work, don't actually validate the date
                if (value.length > 10) {
                    return;
                }

                // Format date and caret position
                [value, start] = formatDate(value, start);

                // Updates state with new value
                dispatch({type: "formUpdate", field, value});
                // Moves caret to appropriate position
                setTimeout(() => e.target.setSelectionRange(start, start));
            // Zip code validation
            } else if (field == "zip") {
                if (value.length > 5) {
                    return;
                }
                value = value.replace(config.digitOnlyRegex, "");
                dispatch({type: "formUpdate", field, value});
            // Insurance field updates
            } else if (field == "ins") {
                dispatch({type: "formUpdate", field, value});
            } else {
                // Text string updates
                dispatch({type: "formUpdate", field, value});
            }

            // Only save caregiver information every 500 milliseconds
            // to avoid saturating the EHR web server
            clearTimeout(stateTimer);
            stateTimer = setTimeout(() => {
                saveState(state).catch(catchError);
            }, 500);
        } catch (error) { catchError(error); }
    }

    useEffect(() => {
        // Conditionally enables or disables submit button
        var enableButton = true;
        for (var field in displayFields) {
            if (config.formConfig[field].required) {
                var el = refs[field];
                if (config.formConfig[field].valid(el.value)) {
                    el.setAttribute("valid", "true");
                } else {
                    enableButton = false;
                    // Only provide invalid highlighting when a value exists
                    if (el.value.length === 0) {
                        el.removeAttribute("valid");
                    } else {
                        el.setAttribute("valid", "false");
                    }
                }
            }
        }
        if (enableButton) {
            refs.btn.removeAttribute("disabled");
            refs.btn.classList.remove("ecease_disabled");
        } else {
            refs.btn.disabled = true;
            refs.btn.classList.add("ecease_disabled");
        }
      }, [state]);

    try {
        // Gets an object containing the fields needed to display
        // Use an object for fast indexing
        var displayFields = fieldDisplay(state);

        // Creates a copy of field order to allow deletions based on "either" options
        var fieldOrder = [...config.fieldOrder];
        // Only show one phone field based on the program requirements
        if (displayFields.mobile) {
            fieldOrder.filter((field) => field != "mobile");
        } else if (displayFields.phone) {
            fieldOrder.filter((field) => field != "phone");
        }

        var refs = {};
        var items = [];
        for (const field of fieldOrder) {
            if (field in displayFields) {
                if (field != "ins") {
                    var elements = (
                        <div key={config.formConfig[field].id} className="ecease_form_field">
                            {config.formConfig[field].required && <span style={{color: "red", textAlign: "super", marginLeft: "-9px"}}>*</span>}
                            <label htmlFor={"ecease_" + config.formConfig[field].id}>{config.formConfig[field].label}</label>
                            <input ecease_state={field}
                                   required={config.formConfig[field].required}
                                   type={config.formConfig[field].type}
                                   id={"ecease_" + config.formConfig[field].id}
                                   value={state.caregiverInfo[field].value}
                                   ref={(input) => { refs[field] = input; }}
                                   onChange={handleChange} />
                       </div>
                    );
                    items.push(elements);
                }
                else {
                    items.push((
                        <div key={config.formConfig[field].id} className="ecease_form_field">
                            <label htmlFor="ecease_ins_type">Insurance Type</label>
                            <div id="ecease_ins_type">
                                <input ecease_state={field} type="radio" id="ecease_ins_medicaid" value="1" checked={state.caregiverInfo.ins.value == 1} name="ecease_ins_type" onChange={handleChange} />
                                <label htmlFor="ecease_ins_medicaid">Medicaid</label>
                                <input ecease_state={field} type="radio" id="ecease_ins_private" value="2" checked={state.caregiverInfo.ins.value == 2} name="ecease_ins_type" onChange={handleChange} />
                                <label htmlFor="ecease_ins_private">Private</label>
                                <input ecease_state={field} type="radio" id="ecease_ins_other" value="3" checked={state.caregiverInfo.ins.value == 3} name="ecease_ins_type" onChange={handleChange} />
                                <label htmlFor="ecease_ins_other">Other/Dont&#39;t Know</label>
                            </div>
                        </div>
                    ));
                }
            }
        }
    } catch (error) { catchError(error); }

    return (
        <div id="ecease_caregiver_info">
            { Object.keys(displayFields).length !== 0 &&
                <div>
                    <p className="ecease_h4">Caregiver information needed for selected treatments</p>
                </div>
            }
            <div id="ecease_info_form">
                {items}
            </div>
            <button type="button" ref={(btn) => refs.btn = btn} onClick={submit}>Submit</button>
        </div>
    );
}

CaregiverInfo.propTypes = {
    dispatch: PropTypes.func.isRequired,
    state: PropTypes.object.isRequired
};

export default CaregiverInfo;