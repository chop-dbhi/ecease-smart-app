// Polyfill required React features
import "react-app-polyfill/ie9";

import React from "react";
import PropTypes from 'prop-types';

function Tips({dispatch}) {
    
    return (
        <div id="ecease_tips">
            <div>
                <p className="ecease_h3">How To Talk To Caregivers About Smoking</p>
            </div>
            <div>
                <p className="ecease_h4">Evidence-Based Statements When Starting Quit Discussion:</p>
                <ul>
                    <li><q>Quitting smoking will improve your child&#39;s health by preventing respiratory illnesses like coughs, colds, and wheezing.</q></li>
                    <li>Parents said this statement coming from their pediatrician would most motivate them to quit. (Jenssen et al. Pediatrics 2020)</li>
                </ul>
            </div>
            <div>
                <p className="ecease_h4">When Caregiver Accepts Help</p>
                <ul>
                    <li>Acknowledge that quitting hard.</li>
                    <li>This increases chances the caregiver will keep trying.</li>
                </ul>
            </div>
            <div>
                <p className="ecease_h4">When Caregiver Is Not Ready To Quit</p>
                <ul>
                    <li>Don&#39;t push too hard.</li>
                    <li>Evidence suggests if the caregiver does not feel judged, they&#39;re more likely to quit at the next visit.</li>
                    <li>
                        Example Statement: <q>It&#39;s okay that you&#39;re not ready to quit at this time. We&#39;re here for you when you&#39;re ready.</q>
                    </li>
                </ul>
            </div>
            <div>
                <p className="ecease_h4">Additional Talking Points</p>
                <ul>
                    <li>Your child may be healthier.</li>
                    <li>You may live longer - by 10 years.</li>
                    <li>Your child will be less likely to become a smoker</li>
                    <li>If pregnant or have a newborn, a much lower risk of Sudden Infant Death Syndrome (SIDS).</li>
                    <li>You could save more than $4,000 a year.</li>
                </ul>
            </div>
            <button style={{marginTop: "-15px"}} type="button" onClick={() => dispatch({type: "toggleTips"})}>Close</button>
        </div>
    );
}

Tips.propTypes = {
    dispatch: PropTypes.func.isRequired
};

export default Tips;