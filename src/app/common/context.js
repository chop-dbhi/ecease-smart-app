// Polyfill JS features
import objectEntries from "core-js-pure/features/object/entries";
import objectValues from 'core-js-pure/features/object/values';

// Common
import { saveData } from "Common/save.js";
import { log } from "Shared/log.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

var tobaccoUseMap = {
    "Only me": 1,
    "Me and someone else": 2,
    "Only someone else": 3,
    "Nobody": 4,
    "Prefer not to answer": 5
};

var insMap = {
    "Medicaid": 1,
    "Private": 2,
    "Other/Don't Know": 3
};

// Build reverse insurance map
var reverseInsMap = {};
for (const [k, v] of objectEntries(insMap)) {
    reverseInsMap[v] = k;
}

// Build reveres tobacco use map
var reversetobaccoUseMap = {};
for (const [k, v] of objectEntries(tobaccoUseMap)) {
    reversetobaccoUseMap[v] = k;
}

// build birthdate for patient from 3 separate date fields
function buildPatientBirthdate(caregiverInfo) {
    var day = caregiverInfo.birthDay.value;
    var month = caregiverInfo.birthMonth.value.substring(0,3);
    var year = caregiverInfo.birthYear.value;

    return new Date(month + " " + day + " " + year).toLocaleDateString().replace(/[^\d/]/g, "");
}

function buildAppContext(response) {

    function addCaregiverInfo(value) {
        return {
            disabled: value != "",
            value: value
        };
    }

    function addTreatmentOptions(value, sent) {
        return {
            selected: value,
            sent: !!sent
        };
    }

    var obj = {
        services: {},
        caregiverInfo: {}
    };

    // Loop through response elements to build app state
    response.SmartDataValues.forEach((v) => {
        var id = v.SmartDataIDs[0].ID;
        switch (id) {
            case "<RESPONDENT>":
                obj.respondent = v.Values.join("");
                break;
            case "<TOBACCO_USE>":
                obj.tobaccoUse = v.Values.join("") != "" ? tobaccoUseMap[v.Values.join("")] : "";
                break;
            case "<NRT>":
                obj.services.nrt = addTreatmentOptions(v.Values.join("") == "Yes");
                break;
            case "<QUITLINE>":
                var qlSelected = v.Values.join("") == "Yes";
                obj.services.quitline = addTreatmentOptions(qlSelected, qlSelected);
                break;
            case "<SFTXT>":
                obj.services.sfTxt = addTreatmentOptions(v.Values.join("") == "Yes");
                break;
            case "<FIRST_NAME>":
                obj.caregiverInfo.firstName = addCaregiverInfo(v.Values.join(""));
                break;
            case "<LAST_NAME>":
                obj.caregiverInfo.lastName = addCaregiverInfo(v.Values.join(""));
                break;
            case "<DATE_OF_BIRTH>":
                var val = v.Values.join("");
                if (val) {
                    val = new Date(config.ehrEpoch.getTime() + (86400000 * (+val))).toLocaleDateString().replace(/[^\d/]/g, "");
                }
                obj.caregiverInfo.dob = addCaregiverInfo(val);
                break;
            // new parent birth date fields for parent birth month, day and year month is in text (e.g. "January") to protect against missing values
            case "<BIRTH_MONTH>":
                if(v.Values.length>0) {
                    obj.caregiverInfo.birthMonth = addCaregiverInfo(v.Values.join(""));
                }
                break;
            case "<BIRTH_DAY>":
                if(v.Values.length>0) {
                    obj.caregiverInfo.birthDay = addCaregiverInfo(v.Values.join(""));
                }
                break;
            case "<BIRTH_YEAR>":
                if(v.Values.length>0) {
                    obj.caregiverInfo.birthYear = addCaregiverInfo(v.Values.join(""));
                }
                break;
            case "<PHONE>":
                obj.caregiverInfo.phone = addCaregiverInfo(v.Values.join(""));
                break;
            case "<MOBILE>":
                obj.caregiverInfo.mobile = addCaregiverInfo(v.Values.join(""));
                break;
            case "<ADDRESS_1>":
                obj.caregiverInfo.addr1 = addCaregiverInfo(v.Values.join(""));
                break;
            case "<ADDRESS_2>":
                obj.caregiverInfo.addr2 = addCaregiverInfo(v.Values.join(""));
                break;
            case "<ZIP>":
                if(v.Values.length > 0) {
                    obj.caregiverInfo.zip = addCaregiverInfo(v.Values.join(""));
                }
                break;
            case "<ZIP>":
                if(v.Values.length > 0) {
                    obj.caregiverInfo.zip = addCaregiverInfo(v.Values.join(""));
                }
                break;
            case "<INSURANCE>":
                obj.caregiverInfo.ins = addCaregiverInfo(v.Values.join("") != "" ? insMap[v.Values.join("")] : "");
                break;
        }
    });

    // It's possible that no zip code was provided, at which point we need to assign an empyt value
    if (!obj.caregiverInfo.zip) {
        obj.caregiverInfo.zip = addCaregiverInfo("");
    }

    // TODO
    // at this point check to see if we have the new "3 field" date information, and construct DOB appropriately
    // Assume the presence of a month indicates presence of other data elements, add correctly typed date to caregiver info
    if (obj.caregiverInfo.birthMonth) {
        var dob = buildPatientBirthdate(obj.caregiverInfo);
        obj.caregiverInfo.dob = addCaregiverInfo(dob);
    }

    // Only merge services if they don't exist
    if (config.data.services) {
        delete obj.services;
    }

    return obj;
}

function smokingStatus(state) {
    var summary;
    if (state.tobaccoUse == 1 || state.tobaccoUse == 2) {

        // Identify if the user accepted treatment
        var acceptedTreatment = false;
        objectValues(state.services).forEach((v) => {
            if (v.selected && v.sent) {
                acceptedTreatment = true;
            }
        });

        var othersText = " Others in household also smoke.";
        summary = "Is a smoker and " + (acceptedTreatment ? "accepted" : "declined") + " treatment." + (state.tobaccoUse == 2 ? othersText : "");
    } else if (state.tobaccoUse == 3) {
        summary = "Not a smoker, others in household smoke.";
    } else if (state.tobaccoUse == 4) {
        summary = "No smokers in household.";
    } else if (state.tobaccoUse == 5) {
        summary = "Prefers not to disclose smoking status.";
    }
    return summary;
}

function treatmentText(programs) {
    var optionText = [programs.slice(0, -1).join(", ")];
    if (programs.length > 1) {
        if (programs.length > 2) {
            optionText = [...optionText, ...programs.slice(-1)].join(", and ");
        } else {
            optionText = [...optionText, ...programs.slice(-1)].join(" and ");
        }
    } else {
        optionText = programs.join("");
    }
    return optionText;
}

function avsRTF(state) {
    var rtf = [];
    if (state.tobaccoUse in {1:1, 2:1}) {
        // Display selected treatment options
        var programs = [];
        for (const [k, v] of objectEntries(state.services)) {
            if (v.sent) {
                programs.push(config.treatmentConfig[k].label);
            }
        }
        var optionText = treatmentText(programs);
        if (programs.length > 0) {
            rtf.push(
                [
                    "{\\par\\plain   \\bullet  Congrats on working to quit smoking. As a summary, you selected the following treatment options:",
                    optionText + ".",
                    "For any additional questions or need for additional support, please call the Quitline at 1-800-QUIT-NOW.",
                    "They are ready to help you 24 hours a day, 7 days a week.}"
                ].join(" ")
            );
            if (programs.indexOf("SmokefreeTXT") >= 0) {
                rtf.push("{\\par\\plain   \\bullet  If you selected SmokefreeTXT and do not receive a text within 24-48 hours, please text QUIT to 47848.}");
            }
        } else {
            rtf.push(
                [
                    "{\\par\\plain   \\bullet  Thank you for telling us about your tobacco use. It’s never too late to get help to quit smoking. If you need",
                    "additional support, call the Quitline at 1-800-QUIT-NOW. They are ready to help you 24 hours a day, 7 days a week.}"
                ].join(" ")
            );
        }
    }
    if (state.tobaccoUse in {2:1, 3:1}) {
        rtf.push(
            [
                "{\\par\\plain   \\bullet  Quitting smoking is hard, and one of the best ways to help others quit is to offer support.",
                "\\par\\plain   \\bullet  If there is an adult smoker in the home who is thinking about quitting smoking, you call tell them to call the QUITLINE at 1-800-QUIT-NOW.",
                "\\par\\plain   \\bullet The QUITLINE provides free coaching – over the phone – to help smokers quit.}",
            ].join("")
        );
    }
    if (rtf.length > 0) {
        // If values exist, add a documentation header
        rtf.splice(0, 0, "{\\b Secondhand Smoke Exposure:}");
        rtf.push("\\par");
        saveData(rtf.join(""), config.ehrStoreIds.avsRtf).catch(() => {
            log("AVS RTF failed to save", "error");
        });
    }
}

function billingRTF(state) {
    if (state.tobaccoUse in {1:1, 2:1}) {
        var rtf = ["{{\\colortbl ;\\red225\\green246\\blue255;}"];
        if (state.discussed && state.discussed == "yes") {
            rtf.push(
                [
                    "\\par\\plain   \\bullet  Discussed health harms of smoking to child,",
                    "including increased risk of illnesses like coughs, colds,",
                    "and asthma, and increased risk of child becoming a smoker."
                ].join(" ")
            );
            rtf.push("\\par\\plain   \\bullet  Discussed harms to the caregiver and treatment options for smoking cessation");
        }

        // Display selected treatment options
        var programs = [];
        for (const [k, v] of objectEntries(state.services)) {
            if (v.sent) {
                programs.push(config.treatmentConfig[k].documentation);
            }
        }

        if (state.discussed && state.discussed == "yes" && programs.length > 0) {
            rtf.push(
                [
                    "\\par\\par\\cf1\\{\\plain \\b Billing note - In the LOS, select Modifier 25 with a Level 2, 3 or 4 E/M code based on",
                    "time, use attestation (.billtime), and associate that with the 3 diagnoses selected",
                    "(secondhand smoke exposure, family history of tobacco abuse and dependence, other specified",
                    "counseling).\\plain\\cf1:10027243}\\}"
                ].join(" ")
            );
        }
        // If values exist, add a documentation header
        if (rtf.length > 1) {
            rtf.splice(1, 0, "{\\b Secondhand Smoke Exposure:}");
        }
        // Resets formatting and adds an extra line
        rtf.push("}\\plain\\par");
        saveData(rtf.join(""), config.ehrStoreIds.billingRtf).catch(() => {
            log("Billing RTF failed to save", "error");
        });
    }
}

function summaryRTF(state) {
    var rtf = [
        "{{\\b Secondhand Smoke Exposure:}",
        "\\par   \\bullet  " + state.respondent + " completed Smoking Screener Survey on " + state.dateCompleted,
        "\\par   \\bullet  " + smokingStatus(state)
    ];

    // Display selected treatment options
    var programs = [];
    for (const [k, v] of objectEntries(state.services)) {
        if (v.sent) {
            programs.push(config.treatmentConfig[k].documentation);
        }
    }
    var optionText = treatmentText(programs);
    if (optionText) {
        rtf.push("\\par   \\bullet  Caregiver " + optionText);
    }
    // Resets formatting and adds an extra line
    rtf.push("}\\plain\\par\\par");
    saveData(rtf.join(""), config.ehrStoreIds.summaryRtf).catch(() => {
        log("Summary RTF failed to save", "error");
    });
}

function buildRTF(state) {
    if (state.tobaccoUse) {
        avsRTF(state);
        billingRTF(state);
        summaryRTF(state);
    }
}

export {
    buildAppContext,
    buildRTF,
    reverseInsMap,
    smokingStatus
};
