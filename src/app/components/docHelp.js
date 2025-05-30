// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

// Common
import { catchError } from "Common/error.js";

// Configuration
import { config } from "Conf/defaultOptions.js";

function DocHelp({dispatch}) {
    try {
        var options = [];
        config.treatmentList.forEach((v) => {
            options.push(v.label);
        });

        var optionText = [options.slice(0, -1).join(", ")];

        if (options.length > 1) {
            if (options.length > 2) {
                optionText = [...optionText, ...options.slice(-1)].join(", or ");
            } else {
                optionText = [...optionText, ...options.slice(-1)].join(" or ");
            }
        } else {
            optionText = options.join("");
        }
    } catch (error) { catchError(error); }

    return (
        <div id="ecease_doc_help">
            <div>
                <p className="ecease_h3">Documentation and Billing</p>
                <p>Billing can only occur when the caregiver accepts at least of one of the {config.treatmentList.length} treatment options ({optionText}) AND smoking cessation counseling is provided to the caregiver.</p>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style={{width: "34%"}}></th>
                        <th>
                            <p className="ecease_h4">Accepts Treatment</p>
                        </th>
                        <th>
                            <p className="ecease_h4">Declines Treatment</p>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>
                            <p className="ecease_h4">Counseling provided</p>
                        </td>
                        <td>
                            <ul>
                                <li>Secondhand smoke exposure discussion, smoking status, and selected treatments added to note.</li>
                                <li>Discussion is billable</li>
                            </ul>
                        </td>
                        <td>
                            <ul>
                                <li>Secondhand smoke exposure discussion and smoking status added to note.</li>
                                <li>No billing</li>
                            </ul>
                        </td>
                    </tr>
                    <tr>
                        <td>
                            <p className="ecease_h4">Counseling NOT provided</p>
                        </td>
                        <td>
                            <ul>
                                <li>Smoking status and selected treatments added to note.</li>
                                <li>No billing</li>
                            </ul>
                        </td>
                        <td>
                            <ul>
                                <li>Smoking status added to note.</li>
                                <li>No billing</li>
                            </ul>
                        </td>
                    </tr>
                </tbody>
            </table>
            <button className="ecease_close_btn" type="button" onClick={() => dispatch({type: "toggleDocHelp"})}>Close</button>
        </div>
    );
}

DocHelp.propTypes = {
    dispatch: PropTypes.func.isRequired
};

export default DocHelp;