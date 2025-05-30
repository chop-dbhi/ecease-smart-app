/*
 * Adds variables that are required by the application.
 */

import React from "react";

// Treatment option configuration
var config = {
    treatmentList: [
        {
            id: "nrt",
            label: "Nicotine Replacement Therapy",
            documentation: "prescribed nicotine replacement therapy",
            enrolled: {
                html: <p><a href="#" onClick={() => config.printRx()}>Optional: Print Rx</a></p>,
                tooltip: (
                    <div onClick={() => config.printRx()}>
                        <p>If the caregiver would prefer to fill the</p>
                        <p>prescription at their pharmacy, a paper</p>
                        <p>version can be printed.</p>
                    </div>
                )
            },
            fields: {
                exactly: [
                    "firstName",
                    "lastName",
                    "dob",
                    "addr1",
                    "addr2",
                    "zip",
                    "ins"
                ],
                either: [
                    {
                        "label" : "phone",
                        "satisfy": [
                            "mobile",
                            "phone"
                        ]
                    }
                ]
            },
            info: {
                title: "Nicotine Replacement Therapy (NRT)",
                body: (
                    <ul>
                        <li>When selected, prescription sent to Bright Medical, a medical supply company.</li>
                        <li>Bright Medical will deliver the nicotine patch/gum to caregiver.</li>
                        <li>Caregiver will get a call prior to delivery to confirm insurance information, address and a drop off time/location.</li>
                        <li>NRT will be delivered within the week.</li>
                        <li>NRT can DOUBLE caregiver’s chances of quitting smoking.</li>
                        <li>This prescription is FREE and is covered by their insurance.</li>
                        <li><span className="ecease_list_strong">Key use tips for Patch</span>: it gives a constant 24 hours of coverage. If patch affects sleep, take off before bed.</li>
                        <li><span className="ecease_list_strong">Key use tips for Gum</span>: Gum is for breakthrough cravings. Chew it until user feels a tingle, then park between check and gum.</li>
                        <li><span className="ecease_list_strong">For refills and use guidance</span>: advise family to call Quitline for additional support.</li>
                    </ul>
                )
            },
            tooltip: (
                <>
                    <p>A prescription for NRT is automatically sent</p>
                    <p>to Bright Medical who will contact the caregiver</p>
                    <p>directly by phone. <a href="#">Read more.</a></p>
                </>
            )
        },
        {
            id: "quitline",
            label: "Free Quitline",
            documentation: "referred to the Free Quitline",
            fields: {
                exactly: [
                    "firstName",
                    "lastName",
                    "dob"
                ],
                either: [
                    {
                        "label" : "phone",
                        "satisfy": [
                            "mobile",
                            "phone"
                        ]
                    }
                ]
            },
            info: {
                title: "Free Quitline (if selected, program will contact caregiver)",
                body: (
                    <ul>
                        <li>When selected, telephone-based cessation counseling will call caregiver to enrollment in treatment.</li>
                        <li>Trained quit coaches, available 24/7, who will help create a quit plan.</li>
                        <li>Up to 5 FREE coaching calls and unlimited inbound calls for support during times of high risk for using tobacco.</li>
                    </ul>
                )
            },
            tooltip: (
                <>
                    <p>A telephone-based tobacco cessation counseling</p>
                    <p>service offering free coaching, with no judgment.</p>
                    <p>Will contact parent directly by phone. <a href="#">Read more.</a></p>
                </>
            )
        },
        {
            id: "sfTxt",
            label: "SmokefreeTXT",
            documentation: "referred to SmokefreeTXT",
            fields: {
                exactly: [
                    "mobile",
                    "dob"
                ]
            },
            info: {
                title: "SmokefreeTXT Program (if selected, program will contact caregiver)",
                body: (
                    <ul>
                        <li>When selected, program will text caregiver.</li>
                        <li>Offers text messages to help parent quit smoking.</li>
                        <li>The program is FREE, lasts about 6-8 weeks, depending on the quit date.</li>
                        <li>About 3-5 messages per day.</li>
                    </ul>
                )
            },
            tooltip: (
                <>
                    <p>Offers text messages to help quit smoking. Will</p>
                    <p>contact parent by text. Program is free, standard</p>
                    <p>message rates apply. <a href="#">Read more.</a></p>
                </>
            )
        }
    ]
};

export {
    config
};