function failSplash() {
    setTimeout(() => {
        try {
            var app = document.getElementById("ecease_start");
            // Check for existence of the html element
            if (app !== null) {
                var errorMessage = [
                    "An error occurred while loading the eCEASE Tool.",
                    "Application developers have been notified and are working to correct the issue."
                ].join(" ");
                if (app.firstChild) {
                    app.removeChild(app.firstChild);
                }
                // Add failure message to the DOM
                app.appendChild(document.createTextNode(errorMessage));
            }
        } catch (error) {}
    });
}

export {
    failSplash
};