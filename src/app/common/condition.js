import { config } from "Conf/defaultOptions.js";
import { tokenResponse } from "Shared/token.js";
import { request } from "Shared/http.js";
import { smokingStatus } from "Common/context.js";

import { catchError } from "Common/error.js";

import refreshApp from "Common/refresh.js";

var smokeExposureDxRegex = /^Z77\.22$/i;

function addToProblemList(state) {
    var comment = [
        state.respondent + " completed Smoking Screener Survey on " + state.dateCompleted + ". ",
        smokingStatus(state)
    ].join("");
    return request(false, "epic/2020/Clinical/Patient/ADDTOPROBLEMLISTDDI/AddToProblemListDDI",
        {
            PatientID: tokenResponse.patient,
            PatientIDType: "FHIR",
            ContactID: tokenResponse.csn,
            ContactIDType: "CSN",
            UserID: tokenResponse.userId,
            UserIDType: "External"
        },
        {
          "Problems": [
            {
              "Diagnosis": {
                "Comment": comment,
                "DiagnosisID": config.problemId,
                "DiagnosisIDType": "Internal",
              },
              "DateNoted": state.problem.addDate,
            }
          ]
        }, "POST", {"Content-Type": "application/json"}
    );
}

function getActiveConditions() {
    return request(true, "FHIR/R4/Condition", {
        subject: tokenResponse.patient,
        category: "problem-list-item",
        "clinical-status": 'active'
    }).then(response => {
        try {
            var conditions = response.data;
            // Check for "error" responses from EHR when there aren't any results to return
            if (conditions.total === 0 || !conditions.entry) {
                conditions.entry = [];
            }
            filterConditions(conditions);
        } catch (error) { catchError(error); }
    });
}

// TODO - This is doing more than filtering.
// May want to consider splitting.
function filterConditions(conditions) {
    var dxFound;
    config.data.problem = {};
    conditions.entry.forEach((v) => {
        if (!config.data.problem.exists && v.resource.clinicalStatus && v.resource.clinicalStatus.text == "Active") {
            if (v.resource.code.coding) {
                v.resource.code.coding.forEach((code) => {
                    if (!config.data.problem.exists && code.code.match(smokeExposureDxRegex)) {
                        dxFound = true;
                    }
                });
            }
        }
    });
    if (dxFound) {
        config.data.problem.exists = true;
    } else {
        config.data.problem = {};
    }
}

// No data is currently provided in the event so there is no
// parameter in the function. If this changes, an "event" parameter
// may be required.
function problemListListener() {
    if (config.data.showFullView) {
        getActiveConditions().then(() => {
            try {
                refreshApp();
            } catch (error) { catchError(error); }
        });
    }
}

export {
    addToProblemList,
    getActiveConditions,
    problemListListener
};