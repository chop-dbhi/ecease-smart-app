import axios from "axios";

import { log } from "Shared/log.js";
import { setTokenResponse, tokenResponse } from "Shared/token.js";
import { state, stateKey, saveSessionState } from "Shared/session.js";

// Or added with a basic error message
import { failSplash } from "Shared/failSplash.js";

// Used to remove encoded spaces in EHR provided
// variables within the token response
var plusRegex = /\+/g;

// Get first set of data
function getAccessToken(code) {
    try {
        // Set base URL
        state.baseUrl = state.serverUrl.replace('FHIR/R4', '');

        // Configure request body. AJAX library will encode so no need
        // to do it here.
        var data = [
            "grant_type="   + encodeURIComponent("authorization_code"),
            "code="         + encodeURIComponent(code),
            "redirect_uri=" + encodeURIComponent(state.redirectUri),
            "client_id="    + encodeURIComponent(state.clientId)
        ];

        // Build request
        return axios({
            method: "POST",
            url: state.tokenUri,
            headers: {
                "Content-Type": "application/x-www-form-urlencoded"
            },
            data: data.join("&"),
            timeout: 2000
        }).then(function(response) {
            try {
                // Store response to tokenResponse variable
                setTokenResponse(response.data);

                // Adjust token values to remove encoded spaces
                tokenResponse.patIdIn = tokenResponse.patId.replace(plusRegex, " ");
                tokenResponse.patId = tokenResponse.patId.replace(plusRegex, "");
                tokenResponse.userId = tokenResponse.userId.replace(plusRegex, "");

                // Store the token response information in session storage
                state.tokenResponse = tokenResponse;

                // Save updated state in session storage
                saveSessionState(stateKey, state);
                return response.data;
            } catch (error) {
                failSplash();
                log(error.stack, "error");
            }
        }).catch(function(error) {
            try {
                // Only log for non-aborted errors
                if (error.request.statusText != "abort") {
                    if (error.code) {
                        // Log the error, but rely on the deferreds to determine failure status
                        log(error.config.method + " " + error.config.url + " " + error.code + " (" + error.message + ")", "error");
                    } else {
                        // Log the error, but rely on the deferreds to determine failure status
                        log(error.config.method + " " + error.config.url + " " + error.response.status + " (" + error.message + ")", "error");
                    }
                    failSplash();
                }
            } catch (error) {
               log(error.stack, "error");
               failSplash();
            }
        });
    } catch (error) {
        failSplash();
        log(error.stack, "error");
    }
}

export {
    getAccessToken
};