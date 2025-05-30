/*
 * Adds variables that are required by the application.
 */

// Common
import { catchError } from "Common/error.js";
import { printRx } from "Common/treatments.js";

// Configuration
import { config } from "Conf/userOptions.js";
import { isValidString, isValidPhone, isValidDate } from "Common/regex.js";

try {

    config.appName = "ecease-primary-care";

    config.ehrEpoch = new Date("12/31/1840 04:00:00");

    config.printRx = () => {
        try {
            printRx();
        } catch (error) { catchError(error); }
    };

    config.problemId = "<PROBLEM_ID>"
    config.systemUserId = "<SYSTEM_USER_ID>"

    config.digitOnlyRegex = /\D/g;

    config.endpoints = {
        services: {
            "<FHIR_SERVER>": "<SERVICE_ENDPOINT>",
        }
    };

    config.qnrId = ["<QUESTIONNAIRE_ID"];
    config.tobaccoUseQuestion = "<TOBACCO_USE_QUESTION>";

    // Initialize a key to store application data
    config.data = {};

    config.ehrStoreIds = {
        questionnaire: [
            "<RESPONDENT>",  // Respondent
            "<TOBACCO_USE>",  // Tobacco use
            "<NRT>",  // NRT selection
            "<QUITLINE",  // Quitline selection
            "<SFTXT>",  // SmokefreeTXT selection
            "<FIRST_NAME>",  // First name
            "<LAST_NAME>",  // Last name
            "<DOB>",  // Date of birth
            "<BIRTH_MONTH>",  // Month of birth (new "3-field" format for birth date)
            "<BIRTH_DAY>",  // Day of birth
            "<BIRTH_YEAR>",  // Year of birth
            "<PHONE_NUMBER>",  // Phone number
            "<MOBILE>",  // Phone number (mobile)
            "<ADDRESS_1",  // Address 1
            "<ADDRESS_2",  // Address 2
            "<ZIP_INT>",  // Zip code int (to be deprecated)
            "<ZIP_STRING>", // Zip code string
            "<INSURANCE>"   // Insurance type
        ],
        appData: "<APP_DATA>",
        billingRtf: "<BILLING_RTF>",
        summaryRtf: "<SUMMARY_RTF>",
        avsRtf: "<AVS_RTF>"
    };

    // Configuation information for form values
    config.formConfig = {
        firstName: {
            label: "First Name",
            id: "first_name",
            required: true,
            valid: isValidString
        },
        lastName: {
            label: "Last Name",
            id: "last_name",
            required: true,
            valid: isValidString
        },
        dob: {
            label: "Date of Birth (MM/DD/YYYY)",
            id: "dob",
            type: "dob",
            required: true,
            valid: isValidDate
        },
        addr1: {
            label: "Street Address",
            id: "address_1",
            required: true,
            valid: isValidString
        },
        addr2: {
            label: "Apt, Suite, Unit, Building #",
            id: "address_2"
        },
        zip: {
            label: "Zip Code",
            id: "zip",
            type: "zip",
            required: true,
            valid: isValidString
        },
        phone: {
            label: "Phone Number",
            id: "phone",
            type: "phone",
            required: true,
            valid: isValidPhone
        },
        mobile: {
            label: "Phone Number (Mobile)",
            id: "mobile",
            type: "phone",
            required: true,
            valid: isValidPhone
        },
        ins: {
            id: "ins_type"
        }
    };

    // Determines the order in which each field is displayed to the user
    config.fieldOrder = ["firstName", "lastName", "dob", "phone", "mobile", "addr1", "addr2", "zip", "ins"];

    // Modifies treatment config to only include materials
    var treatmentConfig = {};
    config.treatmentList.forEach((v) => {
        treatmentConfig[v.id] = {
            id: v.id,
            label: v.label,
            documentation: v.documentation,
            fields: v.fields
        };
    });

    config.treatmentConfig = treatmentConfig;
} catch (error) { catchError(error); }

export {
    config
};
