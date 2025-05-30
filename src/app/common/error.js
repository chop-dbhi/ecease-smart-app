import axios from "axios";

import { log } from "Shared/log.js";
import { failSplash } from "Shared/failSplash.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

function catchError(error, fail) {
    try {
        fail = fail || true;
        // Log the error and fail the application
        if (error && error.request) {
            // This is a web request, handle accordingly
            if (error.request.statusText != "abort") {
                if (fail) {
                    config.failure = true;
                }
                failSplash();
            }
        } else if (!axios.isCancel(error) && error.stack) {
            if (fail) {
                config.failure = true;
            }
            log(error.stack, "error");
            failSplash();
        } else {
            if (fail) {
                config.failure = true;
            }
            log(error.toString(), "error");
            failSplash();
        }
    } catch (error) {}
}

export {
    catchError
};