sap.ui.define([
    "sap/ui/core/UIComponent",
    "sap/ui/model/json/JSONModel"
], function (UIComponent, JSONModel) {
    "use strict";

    return UIComponent.extend("superusermanagement.Component", {
        metadata: {
            manifest: "json"
        },
        init: function () {
            // Call the base component init function
            UIComponent.prototype.init.apply(this, arguments);
            
            // Initialize the router
            this.getRouter().initialize();

            // Initialize the shared view model global state
            var oGlobalUIModel = new JSONModel({
                isCreateMode: false
            });

            // Set it to the component level (propagates down to ALL views)
            this.setModel(oGlobalUIModel, "appView");
        }
    });
});