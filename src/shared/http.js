import axios from "axios";

// Common
import { catchError } from "Common/error.js";

// Shared
import { log } from "Shared/log.js";
import { state } from "Shared/session.js";
import { tokenResponse } from "Shared/token.js";

// Stores ajaxRequests
var ajaxCalls = {};

function request(cancelable, endpoint, params, data, method, headers) {
    // Configure request
    params = params || {};
    method = method || "GET";
    data = data || {};
    headers = headers || {};
    headers.Authorization = "Bearer " + tokenResponse.access_token;
    headers.accept = "application/json";

    // Add a cancel token to allow us to cancel requests due to quick navigation
    var cancelTokenSource = axios.CancelToken.source();
    
    // Only make the cancel token available if requested
    if (cancelable) {
        // Adds a request Id to track the request across the application
        // and to cancel if necessary
        var requestId = Math.ceil(Math.random() * 1000000);
        ajaxCalls[requestId] = cancelTokenSource;
    }

    // Send the request
    return axios({
        cancelToken: cancelTokenSource.token,
        method: method,
        url: endpoint,
        baseURL: state.baseUrl,
        headers: headers,
        params: params,
        data: data,
        timeout: 10000
    }).catch(error => {
        try {
            // Only log for non-canceled errors
            if (!axios.isCancel(error)) {
                if (error.code) {
                    // Log the error, but rely on the deferreds to determine failure status
                    log(error.config.method + " " + error.config.baseURL + error.config.url + " " + error.code + " (" + error.message + ")", "error");
                } else {
                    // Log the error, but rely on the deferreds to determine failure status
                    log(error.config.method + " " + error.config.baseURL + error.config.url + " " + error.response.status + " (" + error.message + ")", "error");
                }
            }
            // Pass the error to the next layer in the chain
            return Promise.reject(error);
        } catch (error) { catchError(error); }
    });
}

export {
    ajaxCalls,
    request
};
