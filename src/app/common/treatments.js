import axios from "axios";

// Configuration
import { config } from "Conf/defaultOptions.js";

// Common
import { reverseInsMap } from "Common/context.js";
import { getPhoneNumber } from "Common/form.js";
import serialize from "Common/serialize.js";
import { catchError } from "Common/error.js";
import { saveData } from "Common/save.js";

// Shared
import { log } from "Shared/log.js";
import { executeAction } from "Shared/ehrComms.js";
import { tokenResponse } from "Shared/token.js";
import { request } from "Shared/http.js";

function sendPrograms(programs, state) {
    programs.forEach((v) => {
        try {
            var phone;
            switch (v) {
                case "nrt":
                    phone = getPhoneNumber(state);
                    if (!phone) {
                        log("Invalid Bright Medical number", "error", true);
                    } else {
                        log("NRT prescription sent to Bright Medical", "info");
                        sendRx(phone.join("")).catch(() => {});
                    }
                    break;
                case "quitline":
                    phone = getPhoneNumber(state);
                    if (!phone) {
                        log("Invalid Quitline number", "error", true);
                    } else {
                        // Also need to ensure first and last name, and DOB are stored
                        // in the EHR so they can be picked up by the nightly batch job.
                        var dob = new Date(state.caregiverInfo.dob.value).getTime();
                        var ehrDOB = Math.round((dob - config.ehrEpoch.getTime()) / (1000 * 3600 * 24));

                        // Store data in EHR
                        saveData("Yes", "<QUITLINE>").catch(() => {});
                        saveData(state.caregiverInfo.firstName.value, "<FIRST_NAME>").catch(() => {});
                        saveData(state.caregiverInfo.lastName.value, "<LAST_NAME>>").catch(() => {});
                        saveData(ehrDOB, "<DOB>").catch(() => {});

                        // Send request to partner, if applicable (e.g. state based)
                        sendQuitline(phone.join(""));
                    }
                    break;
                case "sfTxt":
                    phone = getPhoneNumber(state, true);
                    if (!phone) {
                        log("Invalid SmokefreeTXT number", "error", true);
                    } else {
                        log("Referral sent to SmokefreeTXT", "info");
                        sendSfTxt(phone.join("")).catch(() => {});
                    }
                    break;
            }
        } catch (error) {
            catchError(error, false);
        }
    });
}

function sendRx(phone) {
    // Configure request
    var data = {
        name: config.data.caregiverInfo.firstName.value + " " + config.data.caregiverInfo.lastName.value,
        dob: config.data.caregiverInfo.dob.value,
        phone: phone,
        address: config.data.caregiverInfo.addr1.value + (config.data.caregiverInfo.addr2.value ? ", " + config.data.caregiverInfo.addr2.value : ""),
        zip: config.data.caregiverInfo.zip.value,
        ins: reverseInsMap[config.data.caregiverInfo.ins.value],
    };

    return sendService("rx", data);
}

function sendSfTxt(phone) {
    // Configure request
    var data = {
        phone: phone,
        dob: config.data.caregiverInfo.dob.value
    };

    return sendService("sftxt", data);
}

function sendQuitline(phone) {
    // Get location to determine where to send
    request(true, "FHIR/R4/Location/" + tokenResponse.location).then(response => {
        try {
            if (response.data.resourceType !== "Location" || !response.data.address) {
                log("Couldn't find location for: " + tokenResponse.location, "error");
                return;
            }

            if (response.data.address.state == "New Jersey") {
                // Configure request
                var data = {
                    name: config.data.caregiverInfo.firstName.value + " " + config.data.caregiverInfo.lastName.value,
                    dob: config.data.caregiverInfo.dob.value,
                    phone: phone,
                    zip: config.data.caregiverInfo.zip.value || response.data.address.postalCode
                };

                log("Referral sent to Moms Quit", "info");
                // Send message to quitline service
                sendService("quitline", data).catch(() => {});
            } else {
                log("Referral sent to Quitline", "info");
            }
        } catch (error) {
            log("Error sending qutline: " + error, "error");
        }
    });
}

function sendService(endpoint, data, headers) {
    // Append to headers
    headers = headers || {};
    headers.Authorization = "Bearer " + tokenResponse.access_token;

    // Send the request
    return axios({
        method: "POST",
        url: endpoint,
        baseURL: config.endpoints.services[sessionStorage.getItem("env")],
        headers: headers,
        data: data,
        timeout: 10000
    }).catch(error => {
        // Only log for non-canceled errors
        if (!axios.isCancel(error)) {
            if (error.code) {
                // Log the error to be followed up on my project staff
                log(error.config.method + " " + error.config.baseURL + error.config.url + " " + error.code + " (" + error.message + ")", "error");
            } else {
                // Log the error to be followed up on my project staff
                log(error.config.method + " " + error.config.baseURL + error.config.url + " " + error.response.status + " (" + error.message + ")", "error");
            }
        }
        throw error;
    });
}

function printRx() {
    log("View prescription page", "info");
    var params = serialize({
        name: config.data.caregiverInfo.firstName.value + " " + config.data.caregiverInfo.lastName.value,
        dob: config.data.caregiverInfo.dob.value,
        Authorization:"Bearer " + tokenResponse.access_token
    });

    // Build the url
    var url = config.endpoints.services[sessionStorage.getItem("env")] + "rx" + "?" + params;

    // Open new EHR window with the pre-populated rx
    executeAction({
        action: "Epic.Clinical.Informatics.Web.OpenExternalWindow",
        args:  url
    });
}

export {
    sendPrograms,
    printRx
};