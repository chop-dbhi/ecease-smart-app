import axios from "axios";

// Required polyfill until fully moved to modern browsers
import find from 'core-js/features/array/find';

// Polyfill required modern features
import "react-app-polyfill/ie9";

import randomString from "./random.js";

// Shared
import { log } from "Shared/log.js";
import { getUrlParameter } from "Shared/url.js";
import { getAndSetState, setStateKey, state } from "Shared/session.js";
import { failSplash } from "Shared/failSplash.js";

// Admin based config
import admin from "Conf/admin.js";

try {
    // Get "iss" and launch parameter
    var iss = getUrlParameter("iss");
    var launch = getUrlParameter("launch");

    if (!iss) {
        throw new Error("Failed to obtain iss parameter");
    }

    if (!launch) {
        throw new Error("Failed to obtain launch parameter");
    }

    // Check if the launch token was previously stored in the session. If so,
    // obtain the state key
    var prevStateKey = sessionStorage.getItem(launch);
    if (prevStateKey) {
        log("EHR launch code used previously", "info");

        // Set state key with value passed from EHR response
        setStateKey(prevStateKey);

        // Retrieve previous state
        getAndSetState(prevStateKey);

        // TODO - Should also check for an authorization code, which suggests
        // the launch code was used. If no auth code exists, it's possible
        // the initial auth request with launch code did not occur. This
        // Would likely be a limited scenario, so we are measuring it before making
        // any changes.
        if (!state.authorizationCode) {
            log("Authorization code does not exist on launch token reuse", "info");
        }

        // If the redirect URI was not set in session storage the
        // auth call wasn't sent so try again.
        if (prevStateKey && state.redirectUri) {
            window.location.href = state.redirectUri + "?state=" + prevStateKey;
        }
    }

    // Create anchor tag to easily parse the ISS parameter
    var urlParser = document.createElement('a');
    urlParser.href = iss;

    // Set ehr environment
    sessionStorage.setItem("env", urlParser.hostname + "/" + urlParser.pathname.split("/").find((v) => v));
    sessionStorage.setItem("host", urlParser.hostname);

    // Break current path into an array
    var pathArray = window.location.pathname.split("/");
    // Remove "launch.html" from the array
    pathArray.pop();
    // Add index.html to path array
    pathArray.push("index.html");
    // Build redirect URI
    var redirectUri = window.location.origin + pathArray.join("/");

    // Set client ID based on ehr environment
    var clientId = admin.productionHosts.indexOf(urlParser.hostname) > -1 ? admin.clientId.production : admin.clientId.default;

    // Build well-known config URL
    var configURI = iss + "/.well-known/smart-configuration";

    // Obtain authorize and token URLs and save to storage
    axios({
        url: configURI,
        timeout: 5000
    })
    .catch(function(error) {
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
    })
    .then(function(response) {
        var smartConfig = response.data;
        try {
            // Build state key
            var stateKey = randomString(16);

            // Build state object
            var state = {
                authorizeUri: smartConfig.authorization_endpoint,
                clientId: clientId,
                key: stateKey,
                launchToken: launch,
                redirectUri: redirectUri,
                serverUrl: iss,
                tokenUri: smartConfig.token_endpoint
            };

            // Store state in session storage
            sessionStorage.setItem(stateKey, JSON.stringify(state));

            if (launch) {
                // Build remaining portions of redirect uri
                var redirectParams = [
                    "response_type=" + encodeURIComponent("code"),
                    "client_id="     + encodeURIComponent(clientId || ""),
                    "scope="         + encodeURIComponent("launch"), // Can define this further, but it may not matter
                    "redirect_uri="  + encodeURIComponent(redirectUri),
                    "aud="           + encodeURIComponent(iss),
                    "state="         + encodeURIComponent(stateKey),
                    "launch="        + encodeURIComponent(launch)
                ];

                // Build redirect URL
                var redirectUrl = state.authorizeUri + "?" + redirectParams.join("&");

                // Store launch token and state key in session storage to prevent failure on retries
                sessionStorage.setItem(launch, stateKey);

                // Redirect to authorize URL
                window.location.href =  redirectUrl;
            }
        } catch (error) {
           log(error.stack, "error");
           failSplash();
        }
    });
} catch (error) {
   log(error.stack, "error");
   failSplash();
}