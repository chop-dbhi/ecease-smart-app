import axios from "axios";

// Shared
import { tokenResponse } from "Shared/token.js";

// Admin based config
import admin from "Conf/admin.js";

var logList = [];

function log(message, level, appState){
    try{
        // Convert to a consistent environment label to determine where logs are stored
        var buildEnv = __BUILD_ENVIRONMENT__ == "production" ? "prod" : "test";

        // Set a default level if none exists
        level = level || "debug";

        // Only send "info" and higher logs for prod
        if (buildEnv == "prod" && (level != "error" & level != "warn" & level != "info")) {
            return;
        }

        // Set app name - TODO - Move somewhere else
        var APP_NAME = "ecease-primary-care";

        // Build log message
        var data = {
            application: APP_NAME,
            environment: buildEnv,
            level: level,
            date: new Date().toISOString(),
        };

        // Check tokenResponse is defined
        if (tokenResponse) {
            data.patFHIRId = tokenResponse.patient;
            data.encounter = tokenResponse.encounter;
            data.csn = tokenResponse.csn;
            data.patient = tokenResponse.patId;
            data.user = tokenResponse.userId;
            //data.mrn = tokenResponse.mrn;
        }

        // Get EHR environment
        var runtimeEnv = sessionStorage.getItem("env");
        if (runtimeEnv) {
            data.ehr = runtimeEnv;
        }

        if (appState) {
            // Get application state
            var appData = {...appState};
            delete appData.failure;
            delete appData.ui;

            // Attach as metadata
            data.app = {
                state: JSON.stringify(appData)
            };
        }

        // Conditionally add keys to log object
        if (typeof message === "object") {
            data = {...data, ...message};
        } else if (typeof message === "string") {
            data.msg = message;
        } else {
            return;
        }

        // Send log message to elastic server
        axios({
            method: "POST",
            url: admin.logging,
            data: JSON.stringify(data),
            headers: {
                'Content-Type': 'application/json'
            },
            timeout: 5000
        });
    } catch (error) {}
}

function logD(message, level) {
    try {
        var tmpObj = {
            message: message,
            level: level || "debug"
        };

        logList.push(tmpObj);
    } catch (error) {}
}

function flushLogs() {
    try {
        logList.forEach(function(v) {
            log(v.message, v.level);
        });

        // Reset log list
        logList = [];
    } catch (error) {}
}

export {
    log,
    logD,
    flushLogs
};