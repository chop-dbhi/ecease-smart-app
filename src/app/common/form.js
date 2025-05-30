// Polyfill JS features
import objectEntries from 'core-js-pure/features/object/entries';
import objectValues from 'core-js-pure/features/object/values';

// Common
import { log } from "Shared/log.js";
import { saveData } from "Common/save.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

// Create regular expressions for validation purposes
var formatCharRegex = /\(|\)|\s|-/g;

// Regular expression to match the last 10 digits of an expression
var lastTenRegex = /[0-9]{10}$/g;

var phoneTimer,
    mobileTimer;

function formatPhoneNumber(value, start) {
    // Get the number of formatting characters present in the "sliced" string
    let formatCharCount = (value.slice(0, start).match(formatCharRegex) || []).length;
    // Adjust start position based on the number of formatting chars
    start -= formatCharCount;
    // Strip input field of formatted characters
    value = value.replace(config.digitOnlyRegex, "");

    // Only format the response if value is populated with something
    if (value != "") {
        // Begin formatting process
        value = "(" + value.slice(0, 3) + ")" + value.slice(3);
        start += 1;
        if (value.length > 4) {
            if (start > 3) {
                start += 2;
            }
            value = value.slice(0, 5) + " " + value.slice(5);
        }
        if (value.length > 8) {
            if (start > 8) {
                start += 1;
            }
            value = value.slice(0, 9) + "-" + value.slice(9);
        }
    }

    // If the start position falls on a known formatting char
    // advance the position accordingly
    if (start == 4 || start == 5) {
        start = 6;
    }
    return [value, start];
}

function formatDate(value, start) {
    // Get the number of formatting characters present in the "sliced" string
    let formatCharCount = (value.slice(0, start).match(formatCharRegex) || []).length;
    // Adjust start position based on the number of formatting chars
    start -= formatCharCount;
    // Strip input field of formatted characters
    value = value.replace(config.digitOnlyRegex, "");

    // Only format the response if value is populated with something
    if (value != "") {
        // Begin formatting process
        value = value.slice(0, 2) + "/" + value.slice(2);
        if (value.length > 4) {
            value = value.slice(0, 5) + "/" + value.slice(5);
        }
    }

    // If the start position falls on a known formatting char
    // advance the position accordingly
    if (start == 2 || start == 5) {
        start += 1;
    }
    return [value, start];
}

// Compares current fields to those required by each service
function getFields(state, obj) {
    var items = {};
    for (const field of obj.exactly) {
        if (!state.caregiverInfo[field].disabled || state.caregiverInfo[field].value == "") {
            items[field] = 1;
        }
    }
    if (obj.either) {
        objectValues(obj.either).forEach((v) => {
            var haveInfo = false;
            for (const field of v.satisfy) {
                if (state.caregiverInfo[field].disabled) {
                    haveInfo = true;
                }
            }
            if (!haveInfo) {
                items[v.label] = 1;
            }
        });
    }
    return items;
}

function fieldDisplay(state) {
    // Gets an object containing the fields needed to display
    // Use an object for fast indexing
    var displayFields = {};
    for (const [k, v] of objectEntries(state.services)) {
        if (v.selected && !v.sent && config.treatmentConfig[k]) {
            displayFields = {...displayFields, ...getFields(state, config.treatmentConfig[k].fields)};
        }
    }
    // If both phone and mobile are required, remove the phone
    if (displayFields.phone && displayFields.mobile) {
        delete displayFields.phone;
    }

    return displayFields;
}

function getProgramList(state) {
    var programs = [];
    for (const [k, v] of objectEntries(state.services)) {
        if (!v.sent && v.selected) {
            v.sent = true;
            programs.push(k);
        }
    }
    return programs;
}

function getPhoneNumber(state, mobile) {
    var generic,
        phone;

    // Check to determine what type of phone number to return
    if (mobile) {
        phone = state.caregiverInfo.mobile.value.replace(config.digitOnlyRegex, "").match(lastTenRegex);
    } else {
        // Boolean flag to determine where to store phone value in EHR
        generic = !!state.caregiverInfo.phone.value;

        // Try to use the generic number first and fall back on the mobile
        phone = generic ? state.caregiverInfo.phone.value : state.caregiverInfo.mobile.value;
        phone =  phone.replace(config.digitOnlyRegex, "").match(lastTenRegex);
    }

    // Store phone value back in EHR. Only save if valid
    // Do not propogate errors to the UI
    if (phone) {
        if (generic) {
            clearTimeout(phoneTimer);
            phoneTimer = setTimeout(() => {
                log("Saving generic phone number to EHR", "info");
                saveData(phone.join(""), "<PHONE_FIELD>").catch(() => {});
            }, 100);
        } else {
            clearTimeout(mobileTimer);
            mobileTimer = setTimeout(() => {
                log("Saving mobile phone number to EHR", "info");
                saveData(phone.join(""), "<MOBILE_FIELD>").catch(() => {});
            }, 100);
        }
    }
    return phone;
}

export {
    fieldDisplay,
    formatDate,
    formatPhoneNumber,
    getPhoneNumber,
    getProgramList
};